"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import {
  setTarifSantriForm,
  hapusTarifSantriForm,
} from "@/actions/forms";
import { MinimumNominalNote } from "@/components/shared/minimum-nominal-note";
import { rupiah, tanggalIndo } from "@/lib/format";

export type TarifSantriRow = {
  id: string;
  santriId: string;
  santriNama: string;
  nis: string;
  kelasNama: string | null;
  nominal: number;
  catatan: string | null;
  isActive: boolean;
  updatedAt: Date;
};

export type SantriOption = { id: string; label: string };
export type TarifDefault = {
  id: string;
  nama: string;
  nominal: number;
  kelasNama: string | null;
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

export function TarifSantriClient({
  rows,
  santriOptions,
  tarifDefault,
}: {
  rows: TarifSantriRow[];
  santriOptions: SantriOption[];
  tarifDefault: TarifDefault[];
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState<TarifSantriRow | null>(null);
  const [nominal, setNominal] = useState(0);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
      if (result.ok) {
        setEdit(null);
        setNominal(0);
      }
    });
  };

  return (
    <div
      className="detail-layout"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 300px",
        gap: 15,
        alignItems: "start",
      }}
    >
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Daftar tarif khusus</h2>
            <p className="panel-subtitle">
              {rows.length} santri punya nominal khusus. Nominalnya final dan tidak ikut
              berubah walau tarif kelas naik.
            </p>
          </div>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Santri</th>
                <th>Kelas</th>
                <th>Nominal khusus</th>
                <th>Catatan</th>
                <th>Diperbarui</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.santriNama}</strong>
                    <div className="invoice-number-small">NIS {row.nis}</div>
                  </td>
                  <td>{row.kelasNama ?? "—"}</td>
                  <td>
                    <strong>{rupiah(row.nominal)}</strong>
                  </td>
                  <td>{row.catatan ?? "—"}</td>
                  <td>{tanggalIndo(row.updatedAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        type="button"
                        title="Ubah"
                        disabled={pending}
                        onClick={() => {
                          setEdit(row);
                          setNominal(row.nominal);
                        }}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="table-action danger"
                        type="button"
                        title="Hapus (kembali ke tarif kelas)"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Hapus tarif khusus ${row.santriNama}? Santri akan kembali memakai tarif kelas.`,
                            )
                          )
                            return;
                          const fd = new FormData();
                          fd.set("santriId", row.santriId);
                          run(() => hapusTarifSantriForm(fd));
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
              Belum ada tarif khusus. Semua santri memakai tarif kelas.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">
          {edit ? `Ubah tarif ${edit.santriNama}` : "Tambah tarif khusus"}
        </h2>
        <p className="form-card-description">
          Nominal ini otomatis dipakai saat generate tagihan SPP santri tersebut.
        </p>
        <form
          key={edit?.id ?? "baru"}
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            run(() => setTarifSantriForm(fd));
          }}
        >
          {edit ? (
            <input type="hidden" name="santriId" value={edit.santriId} />
          ) : (
            <div className="field">
              <label htmlFor="ts-santri">Santri</label>
              <select id="ts-santri" name="santriId" required defaultValue="" style={inputStyle}>
                <option value="" disabled>
                  Pilih santri…
                </option>
                {santriOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="ts-nominal">Nominal SPP per bulan</label>
            <input
              id="ts-nominal"
              name="nominal"
              type="number"
              min={0}
              step={500}
              required
              defaultValue={edit?.nominal ?? ""}
              placeholder="mis. 15000"
              style={inputStyle}
              onChange={(event) => setNominal(Number(event.target.value))}
            />
            <MinimumNominalNote nominal={nominal} />
          </div>
          <div className="field">
            <label htmlFor="ts-catatan">Catatan (opsional)</label>
            <input
              id="ts-catatan"
              name="catatan"
              defaultValue={edit?.catatan ?? ""}
              placeholder="mis. sesuai kemampuan keluarga"
              style={inputStyle}
            />
          </div>
          <div className="form-actions">
            {edit ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEdit(null);
                  setNominal(0);
                }}
              >
                Batal
              </button>
            ) : null}
            <button className="button button-primary" type="submit" disabled={pending}>
              {edit ? "Simpan perubahan" : "Simpan"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 18 }}>
          <h3 className="panel-title" style={{ fontSize: 12 }}>
            Tarif kelas sebagai pembanding
          </h3>
          {tarifDefault.length === 0 ? (
            <p className="panel-subtitle">Belum ada tarif aktif.</p>
          ) : (
            <ul className="check-list">
              {tarifDefault.map((t) => (
                <li key={t.id} className="check-row">
                  {t.nama}
                  {t.kelasNama ? ` (${t.kelasNama})` : " (umum)"} — <strong>{rupiah(t.nominal)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
