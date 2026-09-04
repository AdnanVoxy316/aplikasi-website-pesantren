"use client";

import { useState } from "react";
import { useToast } from "@/components/app-shell";
import { authClient } from "@/lib/auth/client";

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function ChangePasswordForm() {
  const showToast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      id="keamanan"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        const currentPassword = String(fd.get("currentPassword") ?? "");
        const newPassword = String(fd.get("newPassword") ?? "");
        const confirmPassword = String(fd.get("confirmPassword") ?? "");

        setError("");
        if (newPassword.length < 8) {
          setError("Kata sandi baru minimal 8 karakter.");
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("Konfirmasi kata sandi tidak cocok.");
          return;
        }

        setPending(true);
        const { error: authError } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });
        setPending(false);

        if (authError) {
          setError(
            authError.message ?? "Kata sandi saat ini salah atau terjadi kesalahan.",
          );
          return;
        }
        showToast("Kata sandi berhasil diubah.");
        form.reset();
      }}
    >
      <div className="field">
        <label htmlFor="cp-current">Kata sandi saat ini</label>
        <input id="cp-current" name="currentPassword" type="password" required autoComplete="current-password" style={inputStyle} />
      </div>
      <div className="field">
        <label htmlFor="cp-new">Kata sandi baru</label>
        <input id="cp-new" name="newPassword" type="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
      </div>
      <div className="field">
        <label htmlFor="cp-confirm">Ulangi kata sandi baru</label>
        <input id="cp-confirm" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
      </div>
      {error ? (
        <div className="notice error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Ubah kata sandi"}
        </button>
      </div>
    </form>
  );
}
