import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export function isMailerConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

export const MAILER_SETUP_HINT =
  "Layanan email belum dikonfigurasi. Isi SMTP_HOST, SMTP_USER (email Google admin), dan SMTP_PASS (App Password Gmail) di .env.local lalu restart server.";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT?.trim() || "465");
    const user = process.env.SMTP_USER?.trim() ?? "";
    const pass = process.env.SMTP_PASS?.trim() ?? "";
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function kirimEmailKonfirmasiUbahEmail(
  emailLama: string,
  emailBaru: string,
  kode: string,
): Promise<void> {
  const from =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "LMS Pesantren";
  await getTransporter().sendMail({
    from: `LMS Pesantren Miftahul Mukhlishin <${from}>`,
    to: emailLama,
    subject: `Konfirmasi perubahan email admin: ${kode}`,
    text: [
      `Seseorang (seharusnya Anda) meminta mengubah email akun admin LMS Pesantren menjadi:`,
      emailBaru,
      "",
      `Kode konfirmasi: ${kode}`,
      "",
      `Kode berlaku 10 menit. Masukkan kode ini di situs untuk melanjutkan perubahan email.`,
      "Jika ini bukan Anda, abaikan email ini dan segera ganti kata sandi akun Anda.",
    ].join("\n"),
    html: `
      <p>Seseorang (seharusnya Anda) meminta mengubah email akun admin LMS Pesantren menjadi:</p>
      <p style="font-weight:bold;">${emailBaru}</p>
      <p>Kode konfirmasi:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${kode}</p>
      <p>Kode berlaku 10 menit. Masukkan kode ini di situs untuk melanjutkan perubahan email.</p>
      <p style="color:#b91c1c;">Jika ini bukan Anda, abaikan email ini dan segera ganti kata sandi akun Anda.</p>
    `,
  });
}

export async function kirimEmailOtp(to: string, kode: string): Promise<void> {
  const from =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "LMS Pesantren";
  await getTransporter().sendMail({
    from: `LMS Pesantren Miftahul Mukhlishin <${from}>`,
    to,
    subject: `Kode OTP verifikasi email: ${kode}`,
    text: [
      `Kode OTP Anda: ${kode}`,
      "",
      "Kode berlaku 10 menit dan hanya untuk verifikasi email baru akun admin.",
      "Jangan bagikan kode ini kepada siapa pun.",
      "Abaikan email ini jika Anda tidak meminta perubahan email.",
    ].join("\n"),
    html: `
      <p>Kode OTP Anda:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${kode}</p>
      <p>Kode berlaku 10 menit dan hanya untuk verifikasi email baru akun admin.</p>
      <p>Jangan bagikan kode ini kepada siapa pun. Abaikan email ini jika Anda tidak meminta perubahan.</p>
    `,
  });
}

export async function kirimEmailOtpLupaSandi(
  to: string,
  kode: string,
  emailLms: string,
): Promise<void> {
  const from =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "LMS Pesantren";
  await getTransporter().sendMail({
    from: `LMS Pesantren Miftahul Mukhlishin <${from}>`,
    to,
    subject: `Kode reset kata sandi LMS: ${kode}`,
    text: [
      `Kode reset kata sandi Anda: ${kode}`,
      "",
      `Permintaan reset untuk akun LMS: ${emailLms}`,
      "Kode berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.",
      "Abaikan email ini jika Anda tidak meminta reset kata sandi.",
    ].join("\n"),
    html: `
      <p>Kode reset kata sandi Anda:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${kode}</p>
      <p>Permintaan reset untuk akun LMS: <strong>${emailLms}</strong></p>
      <p>Kode berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.
      Abaikan email ini jika Anda tidak meminta reset kata sandi.</p>
    `,
  });
}

export async function kirimEmailNotifikasiUbahEmail(
  emailLama: string,
  emailBaru: string,
): Promise<void> {
  const from =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "LMS Pesantren";
  await getTransporter().sendMail({
    from: `LMS Pesantren Miftahul Mukhlishin <${from}>`,
    to: emailLama,
    subject: "Email akun admin LMS telah diubah",
    text: [
      "Email akun admin LMS Pesantren telah diubah.",
      "",
      `Email lama: ${emailLama}`,
      `Email baru: ${emailBaru}`,
      "",
      "Semua sesi login di perangkat lain telah otomatis dikeluarkan.",
      "Jika ini bukan Anda, segera hubungi pengelola sistem dan gunakan fitur lupa kata sandi.",
    ].join("\n"),
    html: `
      <p>Email akun admin LMS Pesantren telah diubah.</p>
      <p>Email lama: <strong>${emailLama}</strong><br />
      Email baru: <strong>${emailBaru}</strong></p>
      <p>Semua sesi login di perangkat lain telah otomatis dikeluarkan.</p>
      <p style="color:#b91c1c;">Jika ini bukan Anda, segera hubungi pengelola sistem dan gunakan fitur lupa kata sandi.</p>
    `,
  });
}
