import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke ruang belajar ELMS Pesantren.",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-story" aria-labelledby="storyTitle">
        <Link className="login-brand" href="/" aria-label="ELMS Pesantren, kembali ke beranda">
          <span className="brand-mark">
            <Icon name="mosque" />
          </span>
          <span>
            <strong className="brand-name">ELMS Pesantren</strong>
            <span className="brand-subtitle">Ruang belajar terpadu</span>
          </span>
        </Link>
        <div className="login-story-copy">
          <span className="login-story-kicker">Platform akademik pesantren</span>
          <h1 className="login-story-title" id="storyTitle">
            Ilmu yang tertata, langkah yang lebih bermakna.
          </h1>
          <p className="login-story-text">
            Satu ruang untuk mengelola kelas, tugas, kehadiran, nilai, rapor, dan
            komunikasi seluruh warga pesantren.
          </p>
          <div className="login-story-points">
            <div className="login-story-point">
              <Icon name="check" />
              Kelola kegiatan akademik dengan lebih rapi
            </div>
            <div className="login-story-point">
              <Icon name="shield" />
              Data setiap peran terlindungi dan terarah
            </div>
            <div className="login-story-point">
              <Icon name="wallet" />
              Pantau pembayaran SPP secara transparan
            </div>
          </div>
        </div>
        <div className="login-footer">
          Pesantren Al-Hikmah · Tahun Ajaran 2026 / 2027
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
          <LoginForm />
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
