"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { createPengajaranForm, deletePengajaranForm } from "@/actions/forms";

export type PengajaranRow = {
  id: string;
  guruNama: string;
  kelasNama: string;
  mapelNama: string;
  tahunAjaranLabel: string;
};

export type Option = { id: string; label: string };

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function PengajaranClient({
  rows,
  guruOptions,
  kelasOptions,
  mapelOptions,
  taOptions,
}: {
  rows: PengajaranRow[];
  guruOptions: Option[];
  kelasOptions: Option[];
  mapelOptions: Option[];
  taOptions: Option[];
}) {
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
            <h2 className="panel-title">Penugasan mengajar</h2>
            <p className="panel-subtitle">{rows.length} kombinasi guru + kelas + mapel</p>
          </div>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guru</th>
                <th>Kelas</th>
                <th>Mapel</th>
                <th>Tahun ajaran</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.guruNama}</strong>
                  </td>
                  <td>{row.kelasNama}</td>
                  <td>{row.mapelNama}</td>
                  <td>{row.tahunAjaranLabel}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action danger"
                        type="button"
                        title="Hapus"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`Hapus penugasan ${row.guruNama} · ${row.kelasNama} · ${row.mapelNama}?`)) return;
                          const fd = new FormData();
                          fd.set("id", row.id);
                          run(() => deletePengajaranForm(fd));
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
              Belum ada penugasan. Tanpa penugasan, guru tidak dapat input nilai/kehadiran.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">Penugasan baru</h2>
        <p className="form-card-description">
          Assign guru ke kombinasi kelas + mapel untuk tahun ajaran tertentu.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            run(() => createPengajaranForm(fd));
            form.reset();
          }}
        >
          <div className="form-grid single">
            <div className="field">
              <label htmlFor="p-guru">Guru</label>
              <select id="p-guru" name="guruId" required style={inputStyle}>
                {guruOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-kelas">Kelas</label>
              <select id="p-kelas" name="kelasId" required style={inputStyle}>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-mapel">Mapel</label>
              <select id="p-mapel" name="mapelId" required style={inputStyle}>
                {mapelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-ta">Tahun ajaran</label>
              <select id="p-ta" name="tahunAjaranId" required style={inputStyle}>
                {taOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Tambah penugasan
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
