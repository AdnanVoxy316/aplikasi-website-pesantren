"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { lepasAkunGoogleForm } from "@/actions/forms";
import { authClient } from "@/lib/auth/client";

const PESAN_OAUTH: Record<string, string> = {
  email_does_not_match:
    "Email akun Google berbeda dengan email akun Anda saat ini. Gunakan akun Google yang sama dengan email LMS Anda.",
  admin_email_mismatch:
    "Akun admin hanya boleh dihubungkan dengan akun Google yang emailnya sama dengan email admin.",
  account_already_linked_to_different_user:
    "Akun Google itu sudah terhubung ke akun LMS lain.",
  unable_to_link_account:
    "Gagal menghubungkan akun Google. Silakan coba lagi.",
  account_not_linked:
    "Akun Google belum terhubung. Masuk dengan kata sandi, lalu hubungkan Google dari pengaturan akun.",
};

export function GoogleAccountPanel({
  terhubung,
  terkonfigurasi,
  kembali = "/admin/pengaturan",
}: {
  terhubung: boolean;
  terkonfigurasi: boolean;
  kembali?: string;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [linking, setLinking] = useState(false);
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const oauthError = err
    ? PESAN_OAUTH[err] ??
      searchParams.get("error_description") ??
      "Gagal menghubungkan akun Google."
    : null;

  const hubungkan = async () => {
    setLinking(true);
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: kembali,
        errorCallbackURL: kembali,
      });
    } catch {
      showToast("Gagal memulai penghubungan akun Google.");
      setLinking(false);
    }
  };

  const lepas = () => {
    if (!window.confirm("Lepas akun Google dari akun ini? Anda tetap masuk dengan email/kata sandi.")) {
      return;
    }
    startTransition(async () => {
      const result = await lepasAkunGoogleForm();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
    });
  };

  return (
    <div className="setting-list">
      <p className="form-card-description" style={{ marginTop: 0 }}>
        {terhubung
          ? "Akun Google terhubung — Anda dapat masuk dengan Google. Lepas kapan saja agar masuk hanya dengan email/kata sandi."
          : "Hubungkan akun Google untuk bisa masuk tanpa kata sandi. Selalu ada kata sandi sebagai cadangan."}
      </p>
      {oauthError ? (
        <div className="notice error" role="alert">
          <Icon name="alert" />
          <span>{oauthError}</span>
        </div>
      ) : null}
      {!terkonfigurasi ? (
        <p className="form-card-description">
          Belum dikonfigurasi: isi <strong>GOOGLE_CLIENT_ID</strong> dan{" "}
          <strong>GOOGLE_CLIENT_SECRET</strong> di .env.local (buat di{" "}
          <strong>console.cloud.google.com</strong> → Credentials → OAuth client ID, jenis Web,
          redirect URI: <em>http://localhost:3000/api/auth/callback/google</em> dan{" "}
          <em>https://domain-anda/api/auth/callback/google</em>).
        </p>
      ) : (
        <div className="profile-form-actions">
          {terhubung ? (
            <button className="button button-secondary" type="button" disabled={pending} onClick={lepas}>
              <Icon name="link" />
              Lepas akun Google
            </button>
          ) : (
            <button
              className="button button-outline-primary"
              type="button"
              disabled={pending || linking}
              onClick={hubungkan}
            >
              <Icon name="link" />
              Hubungkan akun Google
            </button>
          )}
        </div>
      )}
    </div>
  );
}
