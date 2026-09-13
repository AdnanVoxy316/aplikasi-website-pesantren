"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import {
  generateTagihanForm,
  cancelTagihanForm,
  markPaidManualForm,
  updateTagihanNominalForm,
} from "@/actions/forms";
import { rupiah, labelPeriode, tanggalIndo, BULAN } from "@/lib/format";
import { MinimumNominalNote } from "@/components/shared/minimum-nominal-note";
import { BuatTagihanModal } from "./buat-tagihan-modal";
import { KelolaItemModal, type JenisOption, type TagihanItemLengkap } from "./kelola-item-modal";

export type TagihanRow = {
  id: string;
  nomorTagihan: string;
  santriNama: string;
  nis: string | null;
  kelasNama: string | null;
  sumber: string;
  periodeBulan: number;
  periodeTahun: number;
  nominal: number;
  totalTagihan: number;
  jatuhTempo: Date | null;
  status: string;
  jumlahItem: number;
  itemRingkas: string | null;
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
  jenisOptions,
  itemMap,
}: {
  rows: TagihanRow[];
  kelasOptions: KelasOption[];
  santriOptions: SantriOption[];
  taOptions: TaOption[];
  tahunAjaranId: string;
  jenisOptions: JenisOption[];
  itemMap: Record<string, TagihanItemLengkap[]>;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("semua");
  const [bayarRow, setBayarRow] = useState<TagihanRow | null>(null);
  const [editRow, setEditRow] = useState<TagihanRow | null>(null);
  const [editNominal, setEditNominal] = useState(0);
  const [buatTerbuka, setBuatTerbuka] = useState(false);
  const [kelolaRow, setKelolaRow] = useState<TagihanRow | null>(null);

  const filtered = rows.filter((r) => statusFilter === "semua" || r.status === statusFilter);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
      if (result.ok) {
        setBayarRow(null);
        setEditRow(null);
        setBuatTerbuka(false);
      }
    });
  };

  const now = new Date();
  const bulanDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1);

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setBuatTerbuka(true)}
            >
              <Icon name="plus" />
              Buat tagihan
            </button>
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
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. tagihan</th>
                <th>Santri</th>
                <th>Jenis</th>
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
                  <td style={{ maxWidth: 190 }}>
                    <span className={`status-badge ${row.sumber === "spp" ? "neutral" : "success"}`}>
                      {row.sumber === "spp" ? "SPP" : "Manual"}
                    </span>
                    <div className="invoice-number-small" style={{ marginTop: 4 }}>
                      {row.jumlahItem > 1
                        ? `${row.jumlahItem} item · ${row.itemRingkas}`
                        : row.itemRingkas ?? "—"}
                    </div>
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
                      <button
                        className="table-action"
                        type="button"
                        title="Rincian & kelola item"
                        disabled={pending}
                        onClick={() => setKelolaRow(row)}
                      >
                        <Icon name="clipboard" />
                      </button>
                      {row.status !== "paid" && row.status !== "cancelled" ? (
                        <>
                          {row.jumlahItem <= 1 ? (
                            <button
                              className="table-action"
                              type="button"
                              title="Ubah nominal tagihan"
                              disabled={pending}
                              onClick={() => {
                                setEditRow(row);
                                setEditNominal(row.nominal);
                              }}
                            >
                              <Icon name="edit" />
                            </button>
                          ) : null}
                          <button
                            className="table-action"
                            type="button"
                            title="Tandai lunas (cash/transfer)"
                            disabled={pending}
                            onClick={() => setBayarRow(row)}
                          >
                            <Icon name="cash" />
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
              Tidak ada tagihan sesuai filter. Generate tagihan SPP dari panel sebelah, atau klik
              Buat tagihan untuk tagihan jenis lain.
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
            <select id="g-bulan" name="periodeBulan" defaultValue={String(bulanDepan.getMonth() + 1)} required style={inputStyle}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {BULAN[i]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-tahun">Tahun</label>
            <input id="g-tahun" name="periodeTahun" type="number" defaultValue={bulanDepan.getFullYear()} required style={inputStyle} />
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

      {bayarRow ? (
        <div className="preview-overlay" role="dialog" aria-modal="true">
          <div className="preview-modal" style={{ maxWidth: 420 }}>
            <div className="preview-header">
              <div className="preview-title">
                <strong>Tandai lunas</strong>
                <span className="panel-subtitle">
                  {bayarRow.santriNama} · {labelPeriode(bayarRow.periodeBulan, bayarRow.periodeTahun)}
                </span>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="table-action danger"
                  title="Tutup"
                  onClick={() => setBayarRow(null)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <form
              className="preview-body"
              style={{ padding: 16 }}
              onSubmit={(event) => {
                event.preventDefault();
                const fd = new FormData(event.currentTarget);
                run(() => markPaidManualForm(fd));
              }}
            >
              <input type="hidden" name="id" value={bayarRow.id} />
              <div className="field">
                <label htmlFor="b-metode">Metode pembayaran</label>
                <select id="b-metode" name="metode" defaultValue="cash" style={inputStyle}>
                  <option value="cash">Tunai (cash)</option>
                  <option value="transfer">Transfer bank</option>
                  <option value="qris">QRIS manual</option>
                  <option value="ewallet">E-wallet</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="b-catatan">Catatan (opsional)</label>
                <input
                  id="b-catatan"
                  name="catatan"
                  placeholder="mis. diterima bendahara, no. kuitansi"
                  style={inputStyle}
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                Total ditandai lunas: <strong>{rupiah(bayarRow.totalTagihan)}</strong>
              </p>
              <div className="form-actions">
                <button className="button button-secondary" type="button" onClick={() => setBayarRow(null)}>
                  Batal
                </button>
                <button className="button button-primary" type="submit" disabled={pending}>
                  Tandai lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editRow ? (
        <div className="preview-overlay" role="dialog" aria-modal="true">
          <div className="preview-modal" style={{ maxWidth: 420 }}>
            <div className="preview-header">
              <div className="preview-title">
                <strong>Ubah nominal tagihan</strong>
                <span className="panel-subtitle">
                  {editRow.santriNama} · {labelPeriode(editRow.periodeBulan, editRow.periodeTahun)}
                </span>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="table-action danger"
                  title="Tutup"
                  onClick={() => setEditRow(null)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <form
              className="preview-body"
              style={{ padding: 16 }}
              onSubmit={(event) => {
                event.preventDefault();
                const fd = new FormData(event.currentTarget);
                run(() => updateTagihanNominalForm(fd));
              }}
            >
              <input type="hidden" name="tagihanId" value={editRow.id} />
              <div className="field">
                <label htmlFor="e-nominal">Nominal dasar tagihan</label>
                <input
                  id="e-nominal"
                  name="nominal"
                  type="number"
                  min={0}
                  step={500}
                  defaultValue={editRow.nominal}
                  required
                  style={inputStyle}
                  onChange={(event) => setEditNominal(Number(event.target.value))}
                />
                <small>
                  Nominal sebelumnya {rupiah(editRow.nominal)}. Cocokkan dengan kemampuan santri.
                </small>
                <MinimumNominalNote nominal={editNominal} />
              </div>
              <div className="field">
                <label htmlFor="e-catatan">Catatan (opsional)</label>
                <input id="e-catatan" name="catatan" placeholder="alasan penyesuaian" style={inputStyle} />
              </div>
              <div className="form-actions">
                <button className="button button-secondary" type="button" onClick={() => setEditRow(null)}>
                  Batal
                </button>
                <button className="button button-primary" type="submit" disabled={pending}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {buatTerbuka ? (
        <BuatTagihanModal
          santriOptions={santriOptions}
          taOptions={taOptions}
          jenisOptions={jenisOptions}
          defaultTahunAjaranId={tahunAjaranId}
          onClose={() => setBuatTerbuka(false)}
          run={run}
        />
      ) : null}

      {kelolaRow ? (
        <KelolaItemModal
          tagihan={{
            id: kelolaRow.id,
            nomorTagihan: kelolaRow.nomorTagihan,
            santriNama: kelolaRow.santriNama,
            periodeBulan: kelolaRow.periodeBulan,
            periodeTahun: kelolaRow.periodeTahun,
            status: kelolaRow.status,
            totalTagihan: kelolaRow.totalTagihan,
          }}
          items={itemMap[kelolaRow.id] ?? []}
          jenisOptions={jenisOptions}
          onClose={() => setKelolaRow(null)}
          run={run}
        />
      ) : null}
    </div>
  );
}
