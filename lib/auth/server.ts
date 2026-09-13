import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, session, user as userTable, verification } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user: userTable, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
  },
  session: {
    /* Model sesi ala aplikasi bank:
       - Login TANPA "Ingat saya" → cookie sesi tanpa max-age (hilang saat
         browser ditutup, wajib login ulang). Diterapkan better-auth lewat
         cookie dont_remember; refresh sesi juga diskip otomatis.
       - Login DENGAN "Ingat saya" → cookie persisten selama expiresIn (12 jam).
       - Keluar otomatis saat idle (30 menit) ditangani watchdog klien di
         components/session-guard.tsx. */
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 5,
  },
  account: {
    accountLinking: {
      /* Email lokal tidak pernah diverifikasi via link, jadi jangan blokir
         linking hanya karena emailVerified=false di sisi lokal. Google sudah
         memverifikasi kepemilikan email di sisi mereka. */
      requireLocalEmailVerified: false,
      /* Linking hanya boleh eksplisit (tombol "Hubungkan" saat login).
         Tanpa ini, Google yang belum ter-link bisa me-link ulang diam-diam
         saat sign-in — mengalahkan tombol "Lepas akun Google". */
      disableImplicitLinking: true,
      /* Guru/santri/wali boleh me-link Google yang emailnya berbeda
         dari email LMS (mis. LMS @pesantren.sch.id, Google @gmail.com).
         Admin tetap dikunci email sama lewat gerbang validateUserInfo. */
      allowDifferentEmails: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "santri",
        input: false,
      },
      isDisabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
    /* Gerbang identitas OAuth:
       1. Blokir akun nonaktif masuk lewat Google.
       2. Admin hanya boleh link Google yang emailnya sama dengan email admin.
       Linking implisit sudah ditolak global via disableImplicitLinking;
       sign-up implicit diblokir lewat disableSignUp pada provider google. */
    validateUserInfo: async (data) => {
      if (data.source.method !== "oauth" || data.source.oauth?.providerId !== "google") return;
      /* action ada di level source: "link-account" (linking) / "sign-in" (masuk). */
      const action = (data.source as { action?: string } | undefined)?.action ?? "sign-in";
      const oauthUserId = data.user.id ?? "";
      if (!oauthUserId) return;

      const [row] = await db
        .select({
          id: userTable.id,
          role: userTable.role,
          email: userTable.email,
          isDisabled: userTable.isDisabled,
        })
        .from(userTable)
        .where(eq(userTable.id, oauthUserId))
        .limit(1);
      if (!row) return;
      if (row.isDisabled) {
        throw new APIError("FORBIDDEN", {
          code: "account_disabled",
          message: "Akun Anda dinonaktifkan. Hubungi admin pesantren.",
        });
      }
      if (
        row.role === "admin" &&
        action === "link-account" &&
        (data.user.email?.toLowerCase() ?? "") !== row.email
      ) {
        throw new APIError("FORBIDDEN", {
          code: "admin_email_mismatch",
          message:
            "Akun admin hanya boleh dihubungkan dengan akun Google yang emailnya sama dengan email admin.",
        });
      }
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  ...(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID.trim(),
            clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
            /* Google tidak boleh menjadi jalur pendaftaran akun baru —
               hanya akun yang didaftarkan admin yang bisa login. */
            disableSignUp: true,
            /* Selalu tampilkan layar pilih akun — tanpa ini Google bisa
               diam-diam memakai sesi akun yang salah dan gagal link/masuk. */
            prompt: "select_account",
          },
        },
      }
    : {}),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      /* Login Google selalu tidak diingat (setara "Ingat saya" tidak dicentang):
         tandai dont_remember sebelum redirect ke Google — callback OAuth membaca
         cookie ini sebagai fallback, dan /get-session ikut skip refresh.
         Hanya saat belum ada sesi (bukan alur link akun dari halaman profil). */
      if (ctx.path === "/sign-in/social") {
        const existingToken = await ctx.getSignedCookie(
          ctx.context.authCookies.sessionToken.name,
          ctx.context.secret,
        );
        if (!existingToken) {
          await ctx.setSignedCookie(
            ctx.context.authCookies.dontRememberToken.name,
            "true",
            ctx.context.secret,
            ctx.context.authCookies.dontRememberToken.attributes,
          );
        }
      }
      if (ctx.path === "/sign-in/email") {
        const email = (ctx.body as { email?: string } | undefined)?.email;
        if (email) {
          const [row] = await db
            .select({ isDisabled: userTable.isDisabled })
            .from(userTable)
            .where(eq(userTable.email, email.toLowerCase()))
            .limit(1);
          if (row?.isDisabled) {
            throw new APIError("FORBIDDEN", {
              message: "Akun Anda dinonaktifkan. Hubungi admin pesantren.",
            });
          }
        }
      }
    }),
  },
  plugins: [nextCookies()],
});

export async function hashPasswordWithAuth(password: string): Promise<string> {
  const context = await auth.$context;
  return context.password.hash(password);
}
