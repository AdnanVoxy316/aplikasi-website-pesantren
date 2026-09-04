"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createKelasForm,
  updateKelasForm,
  deleteKelasForm,
} from "@/actions/forms";

export type KelasRow = {
  id: string;
  nama: string;
  tingkat: string | null;
  tahunAjaranId: string;
  tahunAjaranLabel: string;
  waliKelasId: string | null;
  waliKelasNama: string | null;
  jumlahSantri: number;
};

export type GuruOption = { id: string; nama: string };
export type TaOption = { id: string; label: string; isActive: boolean };

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function KelasClient({
  rows,
  guruOptions,
  taOptions,
}: {
  rows: KelasRow[];
  guruOptions: GuruOption[];
  taOptions: TaOption[];
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
      if (result.ok) {
        setCreating(false);
        setEditingId(null);
      }
    });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Daftar kelas</h2>
          <p className="panel-subtitle">{rows.length} kelas terdaftar</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => setCreating((v) => !v)}>
          <Icon name="plus" />
          Tambah kelas
        </button>
      </div>

      {creating ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            run(() => createKelasForm(fd));
          }}
          className="form-card"
          style={{ margin: "0 22px 18px" }}
        >
          <h3 className="form-card-title">Kelas baru</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="k-nama">Nama kelas</label>
              <input id="k-nama" name="nama" required placeholder="misal Ibtida A" style={inputStyle} />
            </div>
            <div className="field">
              <label htmlFor="k-tingkat">Tingkat (opsional)</label>
              <input id="k-tingkat" name="tingkat" placeholder="misal Ibtida" style={inputStyle} />
            </div>
            <div className="field">
              <label htmlFor="k-ta">Tahun ajaran</label>
              <select id="k-ta" name="tahunAjaranId" required style={inputStyle}>
                {taOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                    {t.isActive ? " (aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="k-wali">Wali kelas</label>
              <select id="k-wali" name="waliKelasId" style={inputStyle} defaultValue="">
                <option value="">— belum ditentukan —</option>
                {guruOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-secondary" type="button" onClick={() => setCreating(false)}>
              Batal
            </button>
            <button className="button button-primary" type="submit" disabled={pending}>
              Buat kelas
            </button>
          </div>
        </form>
      ) : null}

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tingkat</th>
              <th>Tahun ajaran</th>
              <th>Wali kelas</th>
              <th>Santri</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id}>
                  <td colSpan={6}>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const fd = new FormData(event.currentTarget);
                        fd.set("id", row.id);
                        run(() => updateKelasForm(fd));
                      }}
                      className="form-grid"
                      style={{ padding: "10px 0" }}
                    >
                      <div className="field">
                        <label htmlFor={`nama-${row.id}`}>Nama</label>
                        <input id={`nama-${row.id}`} name="nama" defaultValue={row.nama} required style={inputStyle} />
                      </div>
                      <div className="field">
                        <label htmlFor={`tingkat-${row.id}`}>Tingkat</label>
                        <input id={`tingkat-${row.id}`} name="tingkat" defaultValue={row.tingkat ?? ""} style={inputStyle} />
                      </div>
                      <div className="field">
                        <label htmlFor={`ta-${row.id}`}>Tahun ajaran</label>
                        <select id={`ta-${row.id}`} name="tahunAjaranId" defaultValue={row.tahunAjaranId} style={inputStyle}>
                          {taOptions.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor={`wali-${row.id}`}>Wali kelas</label>
                        <select id={`wali-${row.id}`} name="waliKelasId" defaultValue={row.waliKelasId ?? ""} style={inputStyle}>
                          <option value="">— belum ditentukan —</option>
                          {guruOptions.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
                        <button className="button button-secondary" type="button" onClick={() => setEditingId(null)}>
                          Batal
                        </button>
                        <button className="button button-primary" type="submit" disabled={pending}>
                          Simpan
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={row.id}>
                  <td>
                    <strong>{row.nama}</strong>
                  </td>
                  <td>{row.tingkat ?? "—"}</td>
                  <td>{row.tahunAjaranLabel}</td>
                  <td>{row.waliKelasNama ?? <StatusBadge variant="neutral">belum ada</StatusBadge>}</td>
                  <td>{row.jumlahSantri}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        type="button"
                        title="Edit"
                        onClick={() => setEditingId(row.id)}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="table-action danger"
                        type="button"
                        title="Hapus"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`Hapus kelas ${row.nama}?`)) return;
                          const fd = new FormData();
                          fd.set("id", row.id);
                          run(() => deleteKelasForm(fd));
                        }}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="panel-subtitle" style={{ padding: 14 }}>
            Belum ada kelas. Buat kelas pertama untuk tahun ajaran aktif.
          </p>
        ) : null}
      </div>
    </section>
  );
}
