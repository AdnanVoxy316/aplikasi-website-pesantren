"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { roleDashboard, type Role } from "@/lib/nav";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "guru", label: "Guru / Ustadz" },
  { value: "santri", label: "Santri" },
  { value: "wali", label: "Wali Santri" },
];

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const role = (data.get("role") as Role) ?? "admin";
    window.setTimeout(() => {
      router.push(roleDashboard[role]);
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
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>
      <div className="login-field">
        <label htmlFor="role">Masuk sebagai</label>
        <select id="role" name="role" defaultValue="admin">
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
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
