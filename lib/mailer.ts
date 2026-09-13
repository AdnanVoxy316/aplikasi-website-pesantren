import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { rupiah, tanggalLengkapIndo } from "@/lib/format";
import type { BuktiPembayaranData } from "@/lib/bukti";

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

export async function kirimEmailBuktiPembayaran(
  data: BuktiPembayaranData,
): Promise<void> {
  const from =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "LMS Pesantren";
  const tujuan = data.emailTujuan;
  if (!tujuan) return;

  const total = data.totalTagihan;
  const dibayar = data.nominalDibayar ?? total;
  const spp = data.sumber === "spp";
  const tampilkanItem = data.items.length > 0 && !(spp && data.items.length <= 1);
  const baris = [
    ["Nomor bukti", data.nomorBukti],
    ["Nama santri", data.santriNama],
    ["NIS", data.nis],
    ["Kelas", data.kelasNama ?? "—"],
    ["Periode", data.periodeLabel],
    ...(tampilkanItem
      ? data.items.map((item): [string, string] => [item.nama, rupiah(item.nominal)])
      : []),
    ["Nominal tagihan", rupiah(data.nominal)],
    data.nominalDiskon > 0 ? ["Diskon", `- ${rupiah(data.nominalDiskon)}`] : null,
    data.nominalDenda > 0 ? ["Denda", `+ ${rupiah(data.nominalDenda)}`] : null,
    ["Total dibayar", rupiah(dibayar)],
    ["Metode", data.metodeLabel],
    ["Waktu", data.paidAt ? tanggalLengkapIndo(new Date(data.paidAt)) : "—"],
    data.dicatatOlehNama ? ["Dicatat oleh", data.dicatatOlehNama] : null,
  ].filter((row): row is [string, string] => row !== null);

  const rowsHtml = baris
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">${label}</td><td style="padding:4px 0;font-weight:600;">${value}</td></tr>`,
    )
    .join("");

  const judulEmail = spp ? "Terima kasih sudah membayar SPP" : "Terima kasih sudah membayar";
  const kalimatEmail = spp
    ? `Terima kasih sudah membayar SPP bulan <strong>${data.periodeLabel}</strong>.`
    : `Terima kasih sudah membayar tagihan <strong>${data.nomorTagihan}</strong>.`;

  await getTransporter().sendMail({
    from: `${data.namaPesantren} <${from}>`,
    to: tujuan,
    subject: spp
      ? `Bukti pembayaran SPP ${data.periodeLabel} — ${data.santriNama}`
      : `Bukti pembayaran ${data.nomorTagihan} — ${data.santriNama}`,
    text: [
      spp
        ? `Terima kasih sudah membayar SPP bulan ${data.periodeLabel}.`
        : `Terima kasih sudah membayar tagihan ${data.nomorTagihan}.`,
      `Ini merupakan bukti pembayaran sebesar ${rupiah(dibayar)}.`,
      "",
      ...baris.map(([label, value]) => `${label}: ${value}`),
      "",
      `Salam, ${data.namaPesantren}`,
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;">
        <h2 style="margin:0 0 4px;color:#0f766e;">${judulEmail}</h2>
        <p style="margin:0 0 12px;color:#334155;">
          ${kalimatEmail}
          Ini merupakan bukti pembayaran sebesar
          <strong>${rupiah(dibayar)}</strong>.
        </p>
        <table style="border-collapse:collapse;font-size:13px;">${rowsHtml}</table>
        <p style="margin-top:16px;color:#334155;">
          ${data.namaPesantren}${data.alamatPesantren ? `<br />${data.alamatPesantren}` : ""}
        </p>
      </div>
    `,
  });
}
