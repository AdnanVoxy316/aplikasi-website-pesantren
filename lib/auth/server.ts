import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
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
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = (ctx.body as { email?: string } | undefined)?.email;
        if (email) {
          const [row] = await db
            .select({ isDisabled: user.isDisabled })
            .from(user)
            .where(eq(user.email, email.toLowerCase()))
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
