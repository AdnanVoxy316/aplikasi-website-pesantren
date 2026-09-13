import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@/lib/icons";
import { getPesantrenSettings } from "@/db/queries/admin";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/auth/session";
import { roleDashboard } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke ruang belajar LMS Pesantren.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ alasan?: string }>;
}) {
  const { alasan } = await searchParams;
  /* Validasi sesi yang sebenarnya di sini (bukan di proxy): cookie yang ada
     belum tentu sesi valid — bisa basi/kedaluwarsa. Jika valid, pengguna yang
     sudah masuk tidak perlu melihat form login. */
  const session = await getSession();
  if (session) redirect(roleDashboard[session.user.role]);
  const settings = await getPesantrenSettings();
  const brandLogo = settings?.settings.logoUrl ?? null;
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return (
    <main className="login-page">
      <section className="login-story" aria-labelledby="storyTitle">
        <Link className="login-brand" href="/" aria-label="LMS Pesantren, kembali ke beranda">
          <span className="brand-mark">
            {brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="brand-logo" src={brandLogo} alt="Logo pesantren" />
            ) : (
              <Icon name="mosque" />
            )}
          </span>
          <span>
            <strong className="brand-name">LMS Pesantren</strong>
            <span className="brand-subtitle">Miftahul Mukhlishin Kota Bandung</span>
          </span>
        </Link>
        <div className="login-story-copy">
          <span className="login-story-kicker">Platform akademik pesantren</span>
          <h1 className="login-story-title" id="storyTitle">
            Ilmu yang tertata, langkah yang lebih bermakna.
          </h1>
          <p className="login-story-text">
            Absensi, tugas, nilai, sampai rapor tercatat rapi dan bisa dilihat
            kapan saja oleh guru, santri, dan wali.
          </p>
        </div>
        <div className="login-footer">
          Pesantren Miftahul Mukhlishin Kota Bandung
          {settings?.tahunAjaranLabel
            ? ` · Tahun Ajaran ${settings.tahunAjaranLabel}`
            : ""}
        </div>
      </section>

      <section className="login-form-side" aria-labelledby="loginTitle">
        <div className="login-card">
          <div className="login-card-header">
            <span className="login-card-kicker">Selamat datang kembali</span>
            <h2 className="login-card-title" id="loginTitle">
              Masuk ke akun
            </h2>
            <p className="login-card-description">
              Gunakan akun pesantren untuk melanjutkan aktivitas Anda.
            </p>
          </div>
          {alasan === "sesi-berakhir" ? (
            <div className="notice" role="alert" style={{ marginBottom: 14 }}>
              <Icon name="alert" />
              <span>
                Sesi ini telah berakhir. Login kembali untuk membuka LMS
                Pesantren.
              </span>
            </div>
          ) : null}
          <LoginForm googleConfigured={googleConfigured} />
          <p className="login-note">
            <Icon name="lock" />
            Akses akun dibatasi berdasarkan peran. Jangan bagikan kata sandi
            Anda kepada siapa pun.
          </p>
        </div>
      </section>
    </main>
  );
}
