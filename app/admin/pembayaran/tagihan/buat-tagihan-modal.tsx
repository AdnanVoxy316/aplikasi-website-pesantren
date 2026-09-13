"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import { rupiah } from "@/lib/format";
import { MinimumNominalNote } from "@/components/shared/minimum-nominal-note";
import { createTagihanManualForm } from "@/actions/forms";
import type { JenisOption } from "./kelola-item-modal";

type SantriOption = { id: string; label: string };
type TaOption = { id: string; label: string };

type ItemBaris = {
  key: number;
  jenisId: string;
  nominal: string;
  keterangan: string;
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

const inputKecil = {
  width: "100%",
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  fontSize: 12,
};

let keyBaris = 1;

export function BuatTagihanModal({
  santriOptions,
  taOptions,
  jenisOptions,
  defaultTahunAjaranId,
  onClose,
  run,
}: {
  santriOptions: SantriOption[];
  taOptions: TaOption[];
  jenisOptions: JenisOption[];
  defaultTahunAjaranId: string;
  onClose: () => void;
  run: (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => void;
}) {
  const [santriId, setSantriId] = useState("");
  const [tahunAjaranId, setTahunAjaranId] = useState(defaultTahunAjaranId);
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [catatan, setCatatan] = useState("");
  const [baris, setBaris] = useState<ItemBaris[]>([
    { key: 0, jenisId: "", nominal: "", keterangan: "" },
  ]);

  const jenisAktif = jenisOptions.filter((j) => j.isActive);
  const total = baris.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  const ubahBaris = (key: number, patch: Partial<ItemBaris>) => {
    setBaris((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const pilihJenis = (key: number, jenisId: string) => {
    const jenis = jenisAktif.find((j) => j.id === jenisId);
    const nominalLama = baris.find((b) => b.key === key)?.nominal ?? "";
    const nominalBaru =
      jenis && jenis.tarif > 0 && !Number(nominalLama) ? String(jenis.tarif) : nominalLama;
    ubahBaris(key, { jenisId, nominal: nominalBaru });
  };

  const kirim = () => {
    const items = baris
      .filter((item) => item.jenisId && Number(item.nominal) > 0)
      .map((item) => ({
        jenisPembayaranId: item.jenisId,
        nominal: Number(item.nominal),
        keterangan: item.keterangan.trim() || undefined,
      }));
    const fd = new FormData();
    fd.set("santriId", santriId);
    fd.set("tahunAjaranId", tahunAjaranId);
    fd.set("jatuhTempo", jatuhTempo);
    fd.set("catatan", catatan);
    fd.set("items", JSON.stringify(items));
    run(() => createTagihanManualForm(fd));
  };

  return (
    <div className="preview-overlay" role="dialog" aria-modal="true">
      <div className="preview-modal" style={{ maxWidth: 620 }}>
        <div className="preview-header">
          <div className="preview-title">
            <strong>Buat tagihan manual</strong>
            <span className="panel-subtitle">
              Satu tagihan bisa berisi beberapa jenis — santri membayar sekali.
            </span>
          </div>
          <div className="preview-actions">
            <button type="button" className="table-action danger" title="Tutup" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="preview-body" style={{ padding: 16 }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              kirim();
            }}
          >
            <div className="field">
              <label htmlFor="bt-santri">Santri</label>
              <select
                id="bt-santri"
                required
                value={santriId}
                onChange={(event) => setSantriId(event.target.value)}
                style={inputStyle}
              >
                <option value="">— pilih santri —</option>
                {santriOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bt-ta">Tahun ajaran</label>
              <select
                id="bt-ta"
                required
                value={tahunAjaranId}
                onChange={(event) => setTahunAjaranId(event.target.value)}
                style={inputStyle}
              >
                {taOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <p style={{ margin: "4px 0 8px", fontSize: 12, fontWeight: 700 }}>
              Item tagihan <span className="optional">(minimal satu)</span>
            </p>
            {baris.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr auto",
                  gap: 8,
                  alignItems: "start",
                  marginBottom: 8,
                }}
              >
                <select
                  required
                  value={item.jenisId}
                  onChange={(event) => pilihJenis(item.key, event.target.value)}
                  style={inputKecil}
                  aria-label="Jenis pembayaran"
                >
                  <option value="">— jenis —</option>
                  {jenisAktif.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                      {j.tarif > 0 ? ` · ${rupiah(j.tarif)}` : ""}
                    </option>
                  ))}
                </select>
                <div>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    placeholder="Nominal"
                    value={item.nominal}
                    onChange={(event) => ubahBaris(item.key, { nominal: event.target.value })}
                    style={inputKecil}
                    aria-label="Nominal item"
                  />
                  <MinimumNominalNote nominal={Number(item.nominal)} />
                </div>
                <button
                  type="button"
                  className="table-action danger"
                  title="Hapus baris"
                  disabled={baris.length <= 1}
                  onClick={() => setBaris((prev) => prev.filter((b) => b.key !== item.key))}
                >
                  <Icon name="trash" />
                </button>
                <input
                  type="text"
                  placeholder="Keterangan item (opsional) — mis. ukuran M"
                  value={item.keterangan}
                  onChange={(event) => ubahBaris(item.key, { keterangan: event.target.value })}
                  style={{ ...inputKecil, gridColumn: "1 / span 2" }}
                  aria-label="Keterangan item"
                />
              </div>
            ))}
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setBaris((prev) => [
                  ...prev,
                  { key: keyBaris++, jenisId: "", nominal: "", keterangan: "" },
                ])
              }
            >
              <Icon name="plus" />
              Tambah baris
            </button>

            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--muted)" }}>{baris.length} baris item</span>
              <span>
                Total <strong>{rupiah(total)}</strong>
              </span>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="bt-tempo">
                Jatuh tempo <span className="optional">(opsional)</span>
              </label>
              <input
                id="bt-tempo"
                type="date"
                value={jatuhTempo}
                onChange={(event) => setJatuhTempo(event.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label htmlFor="bt-catatan">
                Catatan tagihan <span className="optional">(opsional)</span>
              </label>
              <input
                id="bt-catatan"
                value={catatan}
                onChange={(event) => setCatatan(event.target.value)}
                placeholder="mis. dibayar paling lambat saat registrasi"
                style={inputStyle}
              />
            </div>

            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={onClose}>
                Batal
              </button>
              <button className="button button-primary" type="submit">
                Buat tagihan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
