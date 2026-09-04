"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import {
  generateTagihanForm,
  cancelTagihanForm,
  markPaidManualForm,
} from "@/actions/forms";
import { rupiah, labelPeriode, tanggalIndo } from "@/lib/format";

export type TagihanRow = {
  id: string;
  nomorTagihan: string;
  santriNama: string;
  nis: string | null;
  kelasNama: string | null;
  periodeBulan: number;
  periodeTahun: number;
  nominal: number;
  totalTagihan: number;
  jatuhTempo: Date | null;
  status: string;
};

export type KelasOption = { id: string; nama: string };
export type SantriOption = { id: string; label: string };
export type TaOption = { id: string; label: string };

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

const STATUS_VARIANT: Record<string, string> = {
  paid: "success",
  unpaid: "neutral",
  pending: "warning",
  processing: "warning",
  cancelled: "danger",
  expired: "danger",
  failed: "danger",
  draft: "neutral",
};

export function TagihanClient({
  rows,
  kelasOptions,
  santriOptions,
  taOptions,
  tahunAjaranId,
}: {
  rows: TagihanRow[];
  kelasOptions: KelasOption[];
  santriOptions: SantriOption[];
  taOptions: TaOption[];
  tahunAjaranId: string;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("semua");

  const filtered = rows.filter((r) => statusFilter === "semua" || r.status === statusFilter);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
    });
  };

  const now = new Date();

  return (
    <div className="detail-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 285px", gap: 15, alignItems: "start" }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Daftar tagihan</h2>
            <p className="panel-subtitle">
              {filtered.length} tagihan · total{" "}
              {rupiah(filtered.reduce((s, r) => s + r.totalTagihan, 0))}
            </p>
          </div>
          <select
            className="date-input"
            aria-label="Filter status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ ...inputStyle, width: "auto", marginBottom: 0 }}
          >
            <option value="semua">Semua status</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. tagihan</th>
                <th>Santri</th>
                <th>Periode</th>
                <th>Total</th>
                <th>Jatuh tempo</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 10 }}>{row.nomorTagihan}</td>
                  <td>
                    <strong>{row.santriNama}</strong>
                    {row.kelasNama ? ` · ${row.kelasNama}` : ""}
                  </td>
                  <td>{labelPeriode(row.periodeBulan, row.periodeTahun)}</td>
                  <td>{rupiah(row.totalTagihan)}</td>
                  <td>{tanggalIndo(row.jatuhTempo)}</td>
                  <td>
                    <span className={`status-badge ${STATUS_VARIANT[row.status] ?? "neutral"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {row.status !== "paid" && row.status !== "cancelled" ? (
                        <>
                          <button
                            className="table-action"
                            type="button"
                            title="Tandai lunas (manual)"
                            disabled={pending}
                            onClick={() => {
                              const catatan = window.prompt(
                                `Catatan pembayaran manual untuk ${row.santriNama} (misal: transfer manual):`,
                              );
                              if (catatan === null) return;
                              const fd = new FormData();
                              fd.set("id", row.id);
                              fd.set("catatan", catatan);
                              run(() => markPaidManualForm(fd));
                            }}
                          >
                            <Icon name="wallet" />
                          </button>
                          <button
                            className="table-action danger"
                            type="button"
                            title="Batalkan tagihan"
                            disabled={pending}
                            onClick={() => {
                              if (!window.confirm(`Batalkan tagihan ${row.nomorTagihan}?`)) return;
                              const fd = new FormData();
                              fd.set("id", row.id);
                              run(() => cancelTagihanForm(fd));
                            }}
                          >
                            <Icon name="trash" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="panel-subtitle" style={{ padding: 14 }}>
              Tidak ada tagihan sesuai filter. Generate tagihan dari panel sebelah.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">Generate tagihan</h2>
        <p className="form-card-description">
          Idempotent — tagihan yang sudah ada untuk periode yang sama dilewati.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            run(() => generateTagihanForm(fd));
          }}
        >
          <div className="field">
            <label htmlFor="g-ta">Tahun ajaran</label>
            <select id="g-ta" name="tahunAjaranId" defaultValue={tahunAjaranId} required style={inputStyle}>
              {taOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-bulan">Periode bulan</label>
            <select id="g-bulan" name="periodeBulan" defaultValue={String(now.getMonth() + 1)} required style={inputStyle}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {labelPeriode(i + 1, now.getFullYear())}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-tahun">Tahun</label>
            <input id="g-tahun" name="periodeTahun" type="number" defaultValue={now.getFullYear()} required style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="g-scope">Cakupan</label>
            <select id="g-scope" name="scope" defaultValue="semua" style={inputStyle}>
              <option value="semua">Seluruh santri</option>
              <option value="kelas">Per kelas</option>
              <option value="santri">Satu santri</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-kelas">
              Kelas <span className="optional">(jika per kelas)</span>
            </label>
            <select id="g-kelas" name="kelasId" defaultValue="" style={inputStyle}>
              <option value="">—</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-santri">
              Santri <span className="optional">(jika satu santri)</span>
            </label>
            <select id="g-santri" name="santriId" defaultValue="" style={inputStyle}>
              <option value="">—</option>
              {santriOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-tempo">
              Jatuh tempo <span className="optional">(opsional)</span>
            </label>
            <input id="g-tempo" name="jatuhTempo" type="date" style={inputStyle} />
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Generate
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
