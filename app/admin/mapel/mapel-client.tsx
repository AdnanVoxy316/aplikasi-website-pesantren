"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { createMapelForm, deleteMapelForm } from "@/actions/forms";

export type MapelRow = {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string | null;
  jumlahPengajar: number;
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

export function MapelClient({ rows }: { rows: MapelRow[] }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
    });
  };

  return (
    <div className="form-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Daftar mapel</h2>
            <p className="panel-subtitle">{rows.length} mapel terdaftar</p>
          </div>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Pengajar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.nama}</strong>
                  </td>
                  <td>
                    <StatusBadge variant={row.kategori === "pesantren" ? "success" : "neutral"}>
                      {row.kategori}
                    </StatusBadge>
                  </td>
                  <td>{row.deskripsi ?? "—"}</td>
                  <td>{row.jumlahPengajar}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action danger"
                        type="button"
                        title="Hapus"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`Hapus mapel ${row.nama}? Nilai terkait ikut terhapus.`)) return;
                          const fd = new FormData();
                          fd.set("id", row.id);
                          run(() => deleteMapelForm(fd));
                        }}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="panel-subtitle" style={{ padding: 14 }}>
              Belum ada mapel. Tambahkan mapel pertama di panel sebelah.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">Mapel baru</h2>
        <p className="form-card-description">
          Mapel fleksibel — bisa mapel pesantren (tahfidz, kitab, akhlak) maupun umum.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            run(() => createMapelForm(fd));
            form.reset();
          }}
        >
          <div className="field">
            <label htmlFor="m-nama">Nama mapel</label>
            <input id="m-nama" name="nama" required placeholder="misal Tahfidz Qur'an" style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="m-kategori">Kategori</label>
            <select id="m-kategori" name="kategori" defaultValue="umum" style={inputStyle}>
              <option value="umum">Umum</option>
              <option value="pesantren">Pesantren</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-deskripsi">
              Deskripsi <span className="optional">(opsional)</span>
            </label>
            <textarea id="m-deskripsi" name="deskripsi" style={{ ...inputStyle, minHeight: 70 }} />
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Tambah mapel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
