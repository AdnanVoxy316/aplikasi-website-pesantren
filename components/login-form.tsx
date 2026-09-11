"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/lib/icons";
import { authClient } from "@/lib/auth/client";
import { LupaSandiForm } from "@/components/lupa-sandi-form";

export function LoginForm({ googleConfigured }: { googleConfigured: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "lupa">("login");

  const masukGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login/error",
    });
    setGoogleLoading(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    setLoading(true);
    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message?.includes("dinonaktifkan")
          ? authError.message
          : "Email atau kata sandi tidak cocok dengan akun terdaftar mana pun.",
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  if (mode === "lupa") {
    return <LupaSandiForm onKembali={() => setMode("login")} />;
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="nama@pesantren.sch.id"
          autoComplete="username"
          required
        />
      </div>
      <div className="login-field">
        <label htmlFor="password">Kata sandi</label>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} />
          </button>
        </div>
      </div>
      {error ? (
        <div className="notice error" role="alert">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="login-row">
        <label className="login-check">
          <input type="checkbox" name="remember" /> Ingat saya
        </label>
        <button
          className="login-link"
          type="button"
          onClick={() => {
            setError("");
            setMode("lupa");
          }}
        >
          Lupa kata sandi?
        </button>
      </div>
      <button
        className="button button-primary login-submit"
        type="submit"
        disabled={loading}
      >
        {loading ? "Memproses..." : (
          <>
            Masuk ke dashboard <span aria-hidden="true">&rarr;</span>
          </>
        )}
      </button>
      {googleConfigured ? (
        <>
          <div
            className="login-divider"
            style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}
            aria-hidden="true"
          >
            <span style={{ flex: 1, height: 1, background: "var(--border, #e2e8f0)" }} />
            <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>atau</span>
            <span style={{ flex: 1, height: 1, background: "var(--border, #e2e8f0)" }} />
          </div>
          <button
            className="button button-outline-primary login-submit"
            type="button"
            disabled={googleLoading}
            onClick={masukGoogle}
          >
            {googleLoading ? (
              "Mengalihkan ke Google..."
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.22-1.81Z"
                  />
                </svg>
                Masuk dengan Google
              </>
            )}
          </button>
        </>
      ) : null}
    </form>
  );
}
