import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Login Google gagal",
};

const PESAN: Record<string, string> = {
  signup_disabled:
    "Email Google ini belum terdaftar di LMS. Gunakan akun yang didaftarkan admin pesantren, lalu hubungkan Google di pengaturan akun.",
  account_not_linked:
    "Akun Google belum terhubung ke akun LMS. Masuk dengan email/kata sandi terlebih dahulu, lalu hubungkan Google di pengaturan akun.",
  admin_google_not_linked:
    "Login Google untuk akun ini belum diaktifkan. Masuk dengan kata sandi terlebih dahulu, lalu hubungkan akun Google di pengaturan akun.",
  account_disabled:
    "Akun Anda dinonaktifkan. Hubungi admin pesantren.",
  email_does_not_match:
    "Email akun Google berbeda dengan email akun LMS yang sedang dihubungkan.",
  admin_email_mismatch:
    "Akun admin hanya boleh dihubungkan dengan akun Google yang emailnya sama dengan email admin.",
  email_not_found:
    "Google tidak mengembalikan alamat email. Pastikan akun Google Anda memiliki email aktif.",
  invalid_code: "Sesi login Google kedaluwarsa atau tidak valid. Silakan coba lagi.",
  no_code: "Sesi login Google kedaluwarsa. Silakan coba lagi.",
};

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const kode = params.error ?? "";
  const pesan =
    PESAN[kode] ??
    params.error_description ??
    "Terjadi kesalahan saat login dengan Google. Silakan coba lagi.";

  return (
    <main
      className="login-page"
      style={{ display: "grid", placeItems: "center", minHeight: "100dvh", padding: 20 }}
    >
      <section
        className="login-form-side"
        style={{ width: "min(460px, 100%)", marginInline: 0 }}
        aria-labelledby="errTitle"
      >
        <div className="login-card" style={{ textAlign: "center" }}>
          <div className="login-card-header">
            <span className="login-card-kicker">Login Google</span>
            <h2 className="login-card-title" id="errTitle">
              Masuk dengan Google gagal
            </h2>
          </div>
          <div className="notice error" role="alert">
            <Icon name="alert" />
            <span>{pesan}</span>
          </div>
          <Link
            className="button button-primary login-submit"
            href="/login"
            style={{ marginTop: 16 }}
          >
            <Icon name="lock" />
            Kembali ke halaman masuk
          </Link>
        </div>
      </section>
    </main>
  );
}
