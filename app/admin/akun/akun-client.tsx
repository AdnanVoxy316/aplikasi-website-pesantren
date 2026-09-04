"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAkunForm,
  updateAkunForm,
  resetPasswordForm,
  toggleAkunForm,
  deleteAkunForm,
} from "@/actions/forms";
export type KelasOption = { id: string; nama: string };

type AkunRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isDisabled: boolean;
  nip: string | null;
  noTelp: string | null;
  nis: string | null;
  kelasId: string | null;
  kelasNama: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  santri: "Santri",
  wali_santri: "Wali Santri",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function AkunClient({
  rows,
  kelasOptions,
}: {
  rows: AkunRow[];
  kelasOptions: KelasOption[];
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AkunRow | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = rows.filter((row) => {
    const matchRole = filter === "semua" || row.role === filter;
    const matchQuery =
      query === "" ||
      row.name.toLowerCase().includes(query.toLowerCase()) ||
      row.email.toLowerCase().includes(query.toLowerCase());
    return matchRole && matchQuery;
  });

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
    });
  };

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    run(() => createAkunForm(fd));
    setCreating(false);
  };

  const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const password = String(fd.get("password") ?? "");
    run(async () => {
      const result = await updateAkunForm(fd);
      if (result.ok && password.length >= 8) {
        return resetPasswordForm(fd);
      }
      return result;
    });
    setEditing(null);
  };

  return (
    <div className="form-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Daftar akun</h2>
            <p className="panel-subtitle">{rows.length} akun terdaftar</p>
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              setCreating((v) => !v);
              setEditing(null);
            }}
          >
            <Icon name="plus" />
            Tambah akun
          </button>
        </div>

        {creating ? (
          <form
            onSubmit={submitCreate}
            className="form-card"
            style={{ margin: "0 22px 18px" }}
          >
            <h3 className="form-card-title">Akun baru</h3>
            <p className="form-card-description">
              Guru & wali cukup email; santri wajib NIS. Kata sandi minimal 8 karakter.
            </p>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Nama lengkap</label>
                <input id="name" name="name" required style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="password">Kata sandi awal</label>
                <input id="password" name="password" minLength={8} required style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" required defaultValue="santri" style={inputStyle}>
                  <option value="guru">Guru</option>
                  <option value="santri">Santri</option>
                  <option value="wali_santri">Wali Santri</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="nis">
                  NIS <span className="optional">(santri)</span>
                </label>
                <input id="nis" name="nis" style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="kelasId">
                  Kelas <span className="optional">(santri)</span>
                </label>
                <select id="kelasId" name="kelasId" style={inputStyle} defaultValue="">
                  <option value="">— tanpa kelas —</option>
                  {kelasOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="nip">
                  NIP <span className="optional">(guru)</span>
                </label>
                <input id="nip" name="nip" style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="noTelp">
                  No. telepon <span className="optional">(guru/wali)</span>
                </label>
                <input id="noTelp" name="noTelp" style={inputStyle} />
              </div>
            </div>
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={() => setCreating(false)}>
                Batal
              </button>
              <button className="button button-primary" type="submit" disabled={pending}>
                Buat akun
              </button>
            </div>
          </form>
        ) : null}

        {editing ? (
          <form
            onSubmit={submitEdit}
            className="form-card"
            style={{ margin: "0 22px 18px" }}
          >
            <h3 className="form-card-title">Edit akun — {editing.name}</h3>
            <input type="hidden" name="userId" value={editing.id} />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="edit-name">Nama lengkap</label>
                <input id="edit-name" name="name" defaultValue={editing.name} required style={inputStyle} />
              </div>
              {editing.role === "santri" ? (
                <>
                  <div className="field">
                    <label htmlFor="edit-nis">NIS</label>
                    <input id="edit-nis" name="nis" defaultValue={editing.nis ?? ""} style={inputStyle} />
                  </div>
                  <div className="field">
                    <label htmlFor="edit-kelasId">Kelas</label>
                    <select
                      id="edit-kelasId"
                      name="kelasId"
                      defaultValue={editing.kelasId ?? ""}
                      style={inputStyle}
                    >
                      <option value="">— tanpa kelas —</option>
                      {kelasOptions.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="edit-nip">NIP</label>
                    <input id="edit-nip" name="nip" defaultValue={editing.nip ?? ""} style={inputStyle} />
                  </div>
                  <div className="field">
                    <label htmlFor="edit-noTelp">No. telepon</label>
                    <input id="edit-noTelp" name="noTelp" defaultValue={editing.noTelp ?? ""} style={inputStyle} />
                  </div>
                </>
              )}
              <div className="field">
                <label htmlFor="reset-password">
                  Reset kata sandi <span className="optional">(kosongkan bila tidak diubah)</span>
                </label>
                <input id="reset-password" name="password" minLength={8} style={inputStyle} />
              </div>
            </div>
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button className="button button-primary" type="submit" disabled={pending}>
                Simpan perubahan
              </button>
            </div>
          </form>
        ) : null}

        <div className="panel-toolbar" style={{ padding: "0 22px 12px" }}>
          <div className="toolbar-left">
            <div className="search-field">
              <Icon name="search" />
              <input
                placeholder="Cari nama atau email..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Cari akun"
              />
            </div>
          </div>
          <div className="toolbar-right">
            <select
              className="date-input"
              aria-label="Filter role"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              style={inputStyle}
            >
              <option value="semua">Semua role</option>
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="santri">Santri</option>
              <option value="wali_santri">Wali Santri</option>
            </select>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Detail</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.email}</td>
                  <td>{ROLE_LABEL[row.role] ?? row.role}</td>
                  <td>
                    {row.role === "santri"
                      ? `NIS ${row.nis ?? "-"}${row.kelasNama ? ` · ${row.kelasNama}` : ""}`
                      : row.role === "guru"
                        ? `NIP ${row.nip ?? "-"}`
                        : "—"}
                  </td>
                  <td>
                    {row.isDisabled ? (
                      <StatusBadge variant="danger">Nonaktif</StatusBadge>
                    ) : (
                      <StatusBadge variant="success">Aktif</StatusBadge>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        type="button"
                        title="Edit"
                        onClick={() => {
                          setEditing(row);
                          setCreating(false);
                        }}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="table-action"
                        type="button"
                        title={row.isDisabled ? "Aktifkan" : "Nonaktifkan"}
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`${row.isDisabled ? "Aktifkan" : "Nonaktifkan"} akun ${row.name}?`)) return;
                          const fd = new FormData();
                          fd.set("userId", row.id);
                          fd.set("isActive", row.isDisabled ? "true" : "false");
                          run(() => toggleAkunForm(fd));
                        }}
                      >
                        <Icon name={row.isDisabled ? "check-circle" : "shield"} />
                      </button>
                      {row.role !== "admin" ? (
                        <button
                          className="table-action danger"
                          type="button"
                          title="Hapus"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm(`Hapus permanen akun ${row.name}? Tindakan tidak dapat dibatalkan.`)) return;
                            const fd = new FormData();
                            fd.set("userId", row.id);
                            run(() => deleteAkunForm(fd));
                          }}
                        >
                          <Icon name="trash" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="panel-subtitle" style={{ padding: 14 }}>
              Tidak ada akun yang cocok dengan filter.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function ResetPasswordHint() {
  return null;
}
