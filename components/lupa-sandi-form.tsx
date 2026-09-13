"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/lib/icons";
import {
  mintaOtpLupaSandiForm,
  verifikasiOtpLupaSandiForm,
  resetSandiLupaForm,
} from "@/actions/forms";

type Langkah = "email" | "otp" | "sandi" | "sukses";

export function LupaSandiForm({ onKembali }: { onKembali: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [langkah, setLangkah] = useState<Langkah>("email");
  const [emailLms, setEmailLms] = useState("");
  const [infoEmail, setInfoEmail] = useState("");
  const [error, setError] = useState("");

  const minta = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await mintaOtpLupaSandiForm(fd);
      if (result.ok) {
        setInfoEmail(result.message ?? "Kode terkirim.");
        setEmailLms(String(fd.get("emailLms") ?? ""));
        setLangkah("otp");
      } else {
        setError(result.error ?? "Gagal.");
      }
    });
  };

  const verifikasi = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setError("");
    startTransition(async () => {
      const result = await verifikasiOtpLupaSandiForm(fd);
      if (result.ok) {
        form.reset();
        setLangkah("sandi");
      } else {
        setError(result.error ?? "Gagal.");
      }
    });
  };

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setError("");
    startTransition(async () => {
      const result = await resetSandiLupaForm(fd);
      if (result.ok) {
        form.reset();
        setLangkah("sukses");
      } else {
        setError(result.error ?? "Gagal.");
      }
    });
  };

  const kembali = () => {
    setLangkah("email");
    setInfoEmail("");
    setEmailLms("");
    setError("");
  };

  return (
    <div
      className={`login-form lupa-wrap${langkah === "sandi" ? " lupa-sandi" : ""}`}
      style={{ display: "grid", gap: 14 }}
    >
      <div className="login-card-header" style={{ textAlign: "left" }}>
        <span className="login-card-kicker">Lupa kata sandi</span>
        {langkah !== "sukses" ? (
          <p className="login-card-description" style={{ margin: 0 }}>
            Kode verifikasi dikirim ke email akun Google yang terhubung dengan akun Anda.
          </p>
        ) : null}
      </div>

      {langkah === "email" ? (
        <form className="lupa-step" onSubmit={minta}>
          <div className="login-field">
            <label htmlFor="lupa-email">Email LMS Anda</label>
            <input
              id="lupa-email"
              name="emailLms"
              type="email"
              placeholder="nama@pesantren.sch.id"
              required
            />
          </div>
          {error ? (
            <div className="notice error" role="alert">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          ) : null}
          <div className="login-row">
            <button
              className="button button-outline-primary login-submit"
              type="submit"
              disabled={pending}
            >
              <Icon name="external" />
              {pending ? "Memproses..." : "Kirim kode verifikasi"}
            </button>
            <button className="login-link" type="button" onClick={onKembali} disabled={pending}>
              Kembali masuk
            </button>
          </div>
        </form>
      ) : langkah === "otp" ? (
        <form className="lupa-step" onSubmit={verifikasi} key="otp">
          <input type="hidden" name="emailLms" value={emailLms} />
          <div className="login-field">
            <label htmlFor="lupa-otp">Kode verifikasi (cek Gmail Anda, berlaku 10 menit)</label>
            <input
              id="lupa-otp"
              name="kode"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="6 digit"
            />
          </div>
          {infoEmail ? (
            <div className="notice" role="status">
              <Icon name="check" />
              <span>{infoEmail}</span>
            </div>
          ) : null}
          {error ? (
            <div className="notice error" role="alert">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          ) : null}
          <div className="login-row">
            <button
              className="button button-outline-primary login-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? "Memproses..." : "Verifikasi kode"}
            </button>
            <button className="login-link" type="button" onClick={kembali} disabled={pending}>
              Minta kode baru
            </button>
          </div>
        </form>
      ) : langkah === "sandi" ? (
        <form className="lupa-step" onSubmit={simpan} key="sandi">
          <input type="hidden" name="emailLms" value={emailLms} />
          <div className="login-field">
            <label htmlFor="lupa-sandi-baru">Kata sandi baru</label>
            <input
              id="lupa-sandi-baru"
              name="sandiBaru"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="lupa-sandi-konfirmasi">Ulangi kata sandi baru</label>
            <input
              id="lupa-sandi-konfirmasi"
              name="konfirmasi"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          {error ? (
            <div className="notice error" role="alert">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          ) : null}
          <div className="login-row">
            <button
              className="button button-primary login-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? "Menyimpan..." : "Simpan kata sandi baru"}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div className="notice" role="status">
            <Icon name="check" />
            <span>
              Kata sandi berhasil direset. Semua sesi lama telah keluar otomatis — silakan masuk
              kembali.
            </span>
          </div>
          <button
            className="button button-primary login-submit"
            type="button"
            onClick={() => {
              onKembali();
              router.push("/login");
              router.refresh();
            }}
          >
            Login ke LMS <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}
