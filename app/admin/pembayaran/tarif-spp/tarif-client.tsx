"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { createTarifForm, setTarifAktifForm } from "@/actions/forms";
import { rupiah } from "@/lib/format";

export type TarifRow = {
  id: string;
  nama: string;
  nominal: number;
  kelasNama: string | null;
  berlakuMulai: string;
  berlakuSampai: string | null;
  isActive: boolean;
};

export type KelasOption = { id: string; nama: string };

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function TarifClient({ rows, kelasOptions }: { rows: TarifRow[]; kelasOptions: KelasOption[] }) {
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
            <h2 className="panel-title">Daftar tarif</h2>
            <p className="panel-subtitle">
              Perubahan tarif tidak mengubah tagihan lama (snapshot nominal).
            </p>
          </div>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Nominal</th>
                <th>Kelas</th>
                <th>Berlaku</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.nama}</strong>
                  </td>
                  <td>{rupiah(row.nominal)}</td>
                  <td>{row.kelasNama ?? "Semua kelas"}</td>
                  <td>
                    {row.berlakuMulai}
                    {row.berlakuSampai ? ` s/d ${row.berlakuSampai}` : " → sekarang"}
                  </td>
                  <td>
                    <span className={`status-badge ${row.isActive ? "success" : "neutral"}`}>
                      {row.isActive ? "aktif" : "nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        type="button"
                        title={row.isActive ? "Nonaktifkan" : "Aktifkan"}
                        disabled={pending}
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("id", row.id);
                          fd.set("isActive", row.isActive ? "false" : "true");
                          run(() => setTarifAktifForm(fd));
                        }}
                      >
                        <Icon name={row.isActive ? "eye-off" : "check-circle"} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="panel-subtitle" style={{ padding: 14 }}>
              Belum ada tarif SPP. Buat tarif pertama di panel sebelah.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">Tarif baru</h2>
        <p className="form-card-description">
          Buat tarif baru saat nominal naik — jangan ubah tarif lama agar histori tetap konsisten.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            run(() => createTarifForm(fd));
            form.reset();
          }}
        >
          <div className="field">
            <label htmlFor="t-nama">Nama tarif</label>
            <input id="t-nama" name="nama" required placeholder="SPP Reguler 2026/2027" style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="t-nominal">Nominal (Rp)</label>
            <input id="t-nominal" name="nominal" type="number" min="1" required placeholder="300000" style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="t-kelas">
              Kelas khusus <span className="optional">(kosongkan = semua santri)</span>
            </label>
            <select id="t-kelas" name="kelasId" defaultValue="" style={inputStyle}>
              <option value="">Semua kelas</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-mulai">Berlaku mulai</label>
            <input id="t-mulai" name="berlakuMulai" type="date" required style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="t-sampai">
              Berlaku sampai <span className="optional">(opsional)</span>
            </label>
            <input id="t-sampai" name="berlakuSampai" type="date" style={inputStyle} />
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Buat tarif
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
