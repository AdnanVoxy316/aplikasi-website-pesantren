"use server";

import { createHash, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { emailOtp, session as sessionTable, user } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";
import {
  MAILER_SETUP_HINT,
  isMailerConfigured,
  kirimEmailKonfirmasiUbahEmail,
  kirimEmailNotifikasiUbahEmail,
  kirimEmailOtp,
} from "@/lib/mailer";

const OTP_MENIT = 10;
const MAX_ATTEMPTS = 5;
const COOLDOWN_DETIK = 60;
const MAKS_KIRIM = 6;

function hashKode(kode: string): string {
  return createHash("sha256").update(kode.trim()).digest("hex");
}

function kodeOtpBaru(): string {
  return String(randomInt(100000, 1000000));
}

function kedaluwarsaBaru(): Date {
  return new Date(Date.now() + OTP_MENIT * 60 * 1000);
}

function kirimOtpSchema() {
  return z.object({ emailBaru: z.string().trim().toLowerCase().email("Format email tidak valid") });
}

/* Langkah 1: minta perubahan email → kode konfirmasi dikirim ke EMAIL LAMA. */
export async function kirimOtpEmailAdmin(
  input: z.input<ReturnType<typeof kirimOtpSchema>>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah email admin.");
    }
    if (!isMailerConfigured()) {
      return fail(MAILER_SETUP_HINT);
    }
    const emailBaru = kirimOtpSchema().parse(input).emailBaru;
    const emailLama = session.user.email;

    const [dipakai] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, emailBaru), ne(user.id, session.user.id)))
      .limit(1);
    if (dipakai) return fail("Email sudah dipakai akun lain.");

    const [row] = await db
      .select()
      .from(emailOtp)
      .where(eq(emailOtp.userId, session.user.id))
      .limit(1);

    const rowMasihHidup = Boolean(row && row.expiresAt.getTime() > Date.now());

    if (row && rowMasihHidup) {
      const lewat = (Date.now() - row.lastSentAt.getTime()) / 1000;
      if (lewat < COOLDOWN_DETIK) {
        const sisa = Math.ceil(COOLDOWN_DETIK - lewat);
        return fail(`Tunggu ${sisa} detik sebelum meminta kode baru.`);
      }
      if (row.sentCount >= MAKS_KIRIM) {
        return fail(`Terlalu banyak permintaan kode. Coba lagi ${OTP_MENIT} menit.`);
      }
    }

    const kode = kodeOtpBaru();
    if (row) {
      await db
        .update(emailOtp)
        .set({
          email: emailBaru,
          codeHash: hashKode(kode),
          stage: "konfirmasi_lama",
          attempts: 0,
          sentCount: rowMasihHidup ? row.sentCount + 1 : 1,
          lastSentAt: new Date(),
          expiresAt: kedaluwarsaBaru(),
        })
        .where(eq(emailOtp.id, row.id));
    } else {
      await db.insert(emailOtp).values({
        userId: session.user.id,
        email: emailBaru,
        codeHash: hashKode(kode),
        stage: "konfirmasi_lama",
        sentCount: 1,
        lastSentAt: new Date(),
        expiresAt: kedaluwarsaBaru(),
      });
    }

    await kirimEmailKonfirmasiUbahEmail(emailLama, emailBaru, kode);
    await logActivity({
      userId: session.user.id,
      aksi: "kirim_otp_ubah_email_admin",
      entitas: "user",
      entitasId: session.user.id,
      detail: { emailBaru },
    });

    return ok(
      undefined,
      `Kode konfirmasi dikirim ke email Anda saat ini (${emailLama}). Berlaku ${OTP_MENIT} menit.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

/* Langkah 2: verifikasi kode konfirmasi dari EMAIL LAMA → kirim OTP ke EMAIL BARU. */
export async function konfirmasiOtpEmailLama(input: {
  kode: string;
}): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah email admin.");
    }

    const [row] = await db
      .select()
      .from(emailOtp)
      .where(eq(emailOtp.userId, session.user.id))
      .limit(1);
    if (!row) return fail("Tidak ada proses aktif. Minta kode konfirmasi terlebih dahulu.");

    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(emailOtp).where(eq(emailOtp.id, row.id));
      return fail("Kode konfirmasi kedaluwarsa. Minta kode baru.");
    }
    if (row.stage !== "konfirmasi_lama") {
      return fail(
        "Kode konfirmasi email lama sudah diverifikasi. Lanjutkan dengan kode dari email baru.",
      );
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await db.delete(emailOtp).where(eq(emailOtp.id, row.id));
      return fail("Terlalu banyak percobaan salah. Minta kode baru.");
    }
    if (hashKode(input.kode) !== row.codeHash) {
      await db
        .update(emailOtp)
        .set({ attempts: row.attempts + 1 })
        .where(eq(emailOtp.id, row.id));
      return fail(`Kode konfirmasi salah. Sisa percobaan: ${MAX_ATTEMPTS - row.attempts - 1}.`);
    }

    const kode = kodeOtpBaru();
    await db
      .update(emailOtp)
      .set({
        codeHash: hashKode(kode),
        stage: "verifikasi_baru",
        attempts: 0,
        sentCount: 1,
        lastSentAt: new Date(),
        expiresAt: kedaluwarsaBaru(),
      })
      .where(eq(emailOtp.id, row.id));

    await kirimEmailOtp(row.email, kode);
    await logActivity({
      userId: session.user.id,
      aksi: "konfirmasi_otp_email_lama",
      entitas: "user",
      entitasId: session.user.id,
    });

    return ok(
      undefined,
      `Kode konfirmasi benar. Kode OTP dikirim ke ${row.email}. Berlaku ${OTP_MENIT} menit.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

/* Langkah 3: verifikasi OTP dari EMAIL BARU → email resmi berubah. */
export async function verifikasiOtpEmailAdmin(input: {
  kode: string;
}): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah email admin.");
    }

    const [row] = await db
      .select()
      .from(emailOtp)
      .where(eq(emailOtp.userId, session.user.id))
      .limit(1);
    if (!row) return fail("Tidak ada kode OTP aktif. Minta kode baru terlebih dahulu.");

    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(emailOtp).where(eq(emailOtp.id, row.id));
      return fail("Kode OTP kedaluwarsa. Minta kode baru.");
    }
    if (row.stage !== "verifikasi_baru") {
      return fail("Masukkan kode konfirmasi dari email lama terlebih dahulu.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await db.delete(emailOtp).where(eq(emailOtp.id, row.id));
      return fail("Terlalu banyak percobaan salah. Minta kode baru.");
    }
    if (hashKode(input.kode) !== row.codeHash) {
      await db
        .update(emailOtp)
        .set({ attempts: row.attempts + 1 })
        .where(eq(emailOtp.id, row.id));
      return fail(`Kode OTP salah. Sisa percobaan: ${MAX_ATTEMPTS - row.attempts - 1}.`);
    }

    const emailLama = session.user.email;
    const emailBaru = row.email;

    const [dipakai] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, emailBaru), ne(user.id, session.user.id)))
      .limit(1);
    if (dipakai) {
      await db.delete(emailOtp).where(eq(emailOtp.id, row.id));
      return fail("Email baru sudah dipakai akun lain. Mulai proses dari awal.");
    }

    await db.update(user).set({ email: emailBaru }).where(eq(user.id, session.user.id));
    await db.delete(emailOtp).where(eq(emailOtp.id, row.id));

    // Logout paksa semua sesi lain — sesi yang meminta perubahan tetap aktif.
    await db
      .delete(sessionTable)
      .where(and(eq(sessionTable.userId, session.user.id), ne(sessionTable.id, session.session.id)));

    await kirimEmailNotifikasiUbahEmail(emailLama, emailBaru);
    await logActivity({
      userId: session.user.id,
      aksi: "ubah_email_admin",
      entitas: "user",
      entitasId: session.user.id,
      detail: { emailLama, emailBaru },
    });

    revalidatePath("/", "layout");
    return ok(
      undefined,
      `Email admin berhasil diubah menjadi ${emailBaru}. Semua perangkat lain telah keluar otomatis.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}
