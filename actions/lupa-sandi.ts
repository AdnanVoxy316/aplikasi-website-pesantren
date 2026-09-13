"use server";

import { createHash, randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { account, resetOtp, session as sessionTable, user as userTable } from "@/db/schema";
import { hashPasswordWithAuth } from "@/lib/auth/server";
import { emailDariIdToken } from "@/lib/auth/google";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";
import { MAILER_SETUP_HINT, isMailerConfigured, kirimEmailOtpLupaSandi } from "@/lib/mailer";

const OTP_MENIT = 10;
const MAX_ATTEMPTS = 5;
const COOLDOWN_DETIK = 60;
const MAKS_KIRIM = 6;

const GAGAL_UMUM =
  "Reset mandiri tidak tersedia untuk akun ini. Hubungi admin pesantren untuk mengatur ulang kata sandi.";

function hashKode(kode: string): string {
  return createHash("sha256").update(kode.trim()).digest("hex");
}

function kodeOtpBaru(): string {
  return String(randomInt(100000, 1000000));
}

type AkunReset = {
  userId: string;
  emailLms: string;
  emailGoogle: string;
};

/* Validasi syarat reset: role non-admin, aktif, punya kata sandi (credential)
   dan akun Google ter-link dengan email yang bisa dibaca dari id_token. */
async function siapkanReset(emailLms: string): Promise<AkunReset | null> {
  const email = emailLms.trim().toLowerCase();
  const [userRow] = await db
    .select({ id: userTable.id, role: userTable.role, isDisabled: userTable.isDisabled })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (!userRow || userRow.role === "admin" || userRow.isDisabled) return null;

  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userRow.id), eq(account.providerId, "credential")))
    .limit(1);
  if (!credential) return null;

  const [googleRow] = await db
    .select({ idToken: account.idToken })
    .from(account)
    .where(and(eq(account.userId, userRow.id), eq(account.providerId, "google")))
    .limit(1);
  if (!googleRow) return null;

  const emailGoogle = emailDariIdToken(googleRow.idToken);
  if (!emailGoogle) return null;

  return { userId: userRow.id, emailLms: email, emailGoogle };
}

const emailSchema = z.object({
  emailLms: z.string().trim().toLowerCase().email("Format email tidak valid"),
});

/* Langkah 1: minta kode reset — OTP dikirim ke email Google ter-link. */
export async function mintaOtpLupaSandi(
  input: z.input<typeof emailSchema>,
): Promise<ActionResult<undefined>> {
  try {
    if (!isMailerConfigured()) return fail(MAILER_SETUP_HINT);
    const emailLms = emailSchema.parse(input).emailLms;
    const akun = await siapkanReset(emailLms);
    if (!akun) return fail(GAGAL_UMUM);

    const [row] = await db.select().from(resetOtp).where(eq(resetOtp.userId, akun.userId)).limit(1);
    const rowMasihHidup = Boolean(row && row.expiresAt.getTime() > Date.now());

    if (row && rowMasihHidup) {
      const lewat = (Date.now() - row.lastSentAt.getTime()) / 1000;
      if (lewat < COOLDOWN_DETIK) {
        return fail(`Tunggu ${Math.ceil(COOLDOWN_DETIK - lewat)} detik sebelum meminta kode baru.`);
      }
      if (row.sentCount >= MAKS_KIRIM) {
        return fail(`Terlalu banyak permintaan kode. Coba lagi ${OTP_MENIT} menit.`);
      }
    }

    const kode = kodeOtpBaru();
    const kedaluwarsa = new Date(Date.now() + OTP_MENIT * 60 * 1000);
    if (row) {
      await db
        .update(resetOtp)
        .set({
          email: akun.emailLms,
          accountEmail: akun.emailGoogle,
          codeHash: hashKode(kode),
          stage: "verifikasi",
          attempts: 0,
          sentCount: rowMasihHidup ? row.sentCount + 1 : 1,
          lastSentAt: new Date(),
          expiresAt: kedaluwarsa,
        })
        .where(eq(resetOtp.id, row.id));
    } else {
      await db.insert(resetOtp).values({
        userId: akun.userId,
        email: akun.emailLms,
        accountEmail: akun.emailGoogle,
        codeHash: hashKode(kode),
        stage: "verifikasi",
        sentCount: 1,
        lastSentAt: new Date(),
        expiresAt: kedaluwarsa,
      });
    }

    await kirimEmailOtpLupaSandi(akun.emailGoogle, kode, akun.emailLms);
    await logActivity({
      userId: akun.userId,
      aksi: "minta_otp_lupa_sandi",
      entitas: "user",
      entitasId: akun.userId,
      detail: { emailLms: akun.emailLms, emailGoogle: akun.emailGoogle },
    });

    return ok(
      undefined,
      `Kode reset dikirim ke email Google ter-link (${akun.emailGoogle}). Berlaku ${OTP_MENIT} menit.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

/* Langkah 2: verifikasi kode OTP dari Gmail. */
export async function verifikasiOtpLupaSandi(input: {
  emailLms: string;
  kode: string;
}): Promise<ActionResult<undefined>> {
  try {
    const emailLms = emailSchema.parse(input).emailLms;
    const akun = await siapkanReset(emailLms);
    if (!akun) return fail(GAGAL_UMUM);

    const [row] = await db.select().from(resetOtp).where(eq(resetOtp.userId, akun.userId)).limit(1);
    if (!row || row.stage !== "verifikasi") {
      return fail("Tidak ada kode reset aktif. Minta kode baru terlebih dahulu.");
    }
    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(resetOtp).where(eq(resetOtp.id, row.id));
      return fail("Kode reset kedaluwarsa. Minta kode baru.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await db.delete(resetOtp).where(eq(resetOtp.id, row.id));
      return fail("Terlalu banyak percobaan salah. Minta kode baru.");
    }
    if (hashKode(input.kode) !== row.codeHash) {
      await db
        .update(resetOtp)
        .set({ attempts: row.attempts + 1 })
        .where(eq(resetOtp.id, row.id));
      return fail(`Kode reset salah. Sisa percobaan: ${MAX_ATTEMPTS - row.attempts - 1}.`);
    }

    await db
      .update(resetOtp)
      .set({
        stage: "reset_sandi",
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_MENIT * 60 * 1000),
      })
      .where(eq(resetOtp.id, row.id));

    return ok(undefined, "Kode benar. Silakan buat kata sandi baru.");
  } catch (error) {
    return toActionError(error);
  }
}

const sandiSchema = z
  .object({
    emailLms: z.string().trim().toLowerCase().email("Format email tidak valid"),
    sandiBaru: z.string().min(8, "Kata sandi minimal 8 karakter"),
    konfirmasi: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.sandiBaru === data.konfirmasi, {
    message: "Konfirmasi kata sandi tidak sama",
    path: ["konfirmasi"],
  });

/* Langkah 3: simpan kata sandi baru. */
export async function resetSandiLupa(input: {
  emailLms: string;
  sandiBaru: string;
  konfirmasi: string;
}): Promise<ActionResult<undefined>> {
  try {
    const data = sandiSchema.parse(input);
    const akun = await siapkanReset(data.emailLms);
    if (!akun) return fail(GAGAL_UMUM);

    const [row] = await db.select().from(resetOtp).where(eq(resetOtp.userId, akun.userId)).limit(1);
    if (!row || row.stage !== "reset_sandi") {
      return fail("Verifikasi kode belum selesai. Ulangi proses dari awal.");
    }
    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(resetOtp).where(eq(resetOtp.id, row.id));
      return fail("Sesi reset kedaluwarsa. Ulangi proses dari awal.");
    }

    const hashed = await hashPasswordWithAuth(data.sandiBaru);
    await db
      .update(account)
      .set({ password: hashed })
      .where(and(eq(account.userId, akun.userId), eq(account.providerId, "credential")));

    await db.delete(resetOtp).where(eq(resetOtp.id, row.id));
    await db.delete(sessionTable).where(eq(sessionTable.userId, akun.userId));

    await logActivity({
      userId: akun.userId,
      aksi: "reset_sandi_mandiri",
      entitas: "user",
      entitasId: akun.userId,
      detail: { emailLms: akun.emailLms, emailGoogle: akun.emailGoogle },
    });

    return ok(undefined, "Kata sandi berhasil direset. Semua sesi lama telah keluar.");
  } catch (error) {
    return toActionError(error);
  }
}
