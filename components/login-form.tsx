"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/lib/icons";
import { findDemoAccount } from "@/lib/data/accounts";
import { roleDashboard } from "@/lib/nav";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const account = findDemoAccount(email, password);
    if (!account) {
      setError(
        "Email atau kata sandi tidak cocok dengan akun terdaftar mana pun.",
      );
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      router.push(roleDashboard[account.role]);
    }, 450);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-field">
        <label htmlFor="email">Email atau NIS</label>
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
        <a
          className="login-link"
          href="#lupa-password"
          onClick={(event) => event.preventDefault()}
        >
          Lupa kata sandi?
        </a>
      </div>
      <button
        className="button button-primary login-submit"
        type="submit"
        disabled={loading}
      >
        Masuk ke dashboard <span aria-hidden="true">&rarr;</span>
      </button>
    </form>
  );
}
