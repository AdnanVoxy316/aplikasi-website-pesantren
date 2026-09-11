"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import {
  kirimOtpEmailAdminForm,
  konfirmasiOtpEmailLamaForm,
  verifikasiOtpEmailAdminForm,
} from "@/actions/forms";

type Step = "email" | "konfirmasi" | "verifikasi";

export function EmailAdminPanel({
  emailSekarang,
}: {
  emailSekarang: string | null;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("email");
  const [emailBaru, setEmailBaru] = useState("");

  const kirim = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await kirimOtpEmailAdminForm(fd);
      showToast(result.ok ? result.message ?? "Kode terkirim." : result.error ?? "Gagal.");
      if (result.ok) {
        setEmailBaru(String(fd.get("emailBaru") ?? ""));
        setStep("konfirmasi");
      }
    });
  };

  const konfirmasi = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await konfirmasiOtpEmailLamaForm(fd);
      showToast(result.ok ? result.message ?? "Terkonfirmasi." : result.error ?? "Gagal.");
      if (result.ok) {
        form.reset();
        setStep("verifikasi");
      }
    });
  };

  const verifikasi = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await verifikasiOtpEmailAdminForm(fd);
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
      if (result.ok) {
        form.reset();
        setEmailBaru("");
        setStep("email");
      }
    });
  };

  return (
    <div className="setting-list">
      <p className="form-card-description" style={{ marginTop: 0 }}>
        Email admin saat ini: <strong>{emailSekarang ?? "—"}</strong>
      </p>
      {step === "email" ? (
        <form key="email" onSubmit={kirim}>
          <div className="field">
            <label htmlFor="otp-email">
              Email baru{" "}
              <span className="optional">
                (konfirmasi dikirim ke email lama, lalu OTP ke email baru)
              </span>
            </label>
            <input id="otp-email" name="emailBaru" type="email" required />
          </div>
          <div className="profile-form-actions">
            <button className="button button-outline-primary" type="submit" disabled={pending}>
              <Icon name="external" />
              Kirim kode konfirmasi
            </button>
          </div>
        </form>
      ) : step === "konfirmasi" ? (
        <form key="konfirmasi" onSubmit={konfirmasi}>
          <div className="field">
            <label htmlFor="otp-konfirmasi">
              Langkah 1 dari 2 — kode konfirmasi dari email{" "}
              <strong>{emailSekarang ?? "lama"}</strong> (berlaku 10 menit)
            </label>
            <input
              id="otp-konfirmasi"
              name="kode"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="6 digit"
            />
          </div>
          <div className="profile-form-actions">
            <button className="button button-outline-primary" type="submit" disabled={pending}>
              Konfirmasi &amp; kirim OTP ke email baru
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={pending}
              onClick={() => setStep("email")}
            >
              Batalkan
            </button>
          </div>
        </form>
      ) : (
        <form key="verifikasi" onSubmit={verifikasi}>
          <div className="field">
            <label htmlFor="otp-verifikasi">
              Langkah 2 dari 2 — kode OTP dari email baru <strong>{emailBaru}</strong> (berlaku 10
              menit)
            </label>
            <input
              id="otp-verifikasi"
              name="kode"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="6 digit"
            />
          </div>
          <div className="profile-form-actions">
            <button className="button button-outline-primary" type="submit" disabled={pending}>
              Verifikasi &amp; ubah email
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={pending}
              onClick={() => setStep("email")}
            >
              Batalkan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
