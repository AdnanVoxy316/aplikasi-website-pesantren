"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import { rupiah, labelPeriode } from "@/lib/format";
import { MinimumNominalNote } from "@/components/shared/minimum-nominal-note";
import {
  tambahItemTagihanForm,
  ubahItemTagihanForm,
  hapusItemTagihanForm,
} from "@/actions/forms";
import type { RincianItem } from "@/components/shared/rincian-tagihan";

export type JenisOption = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  tarif: number;
  isActive: boolean;
};

export type TagihanItemLengkap = RincianItem & {
  tagihanSppId: string;
  jenisPembayaranId: string;
  urutan: number;
};

const STATUS_BISA_DIISI = ["draft", "unpaid", "expired", "failed"];

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

export function KelolaItemModal({
  tagihan,
  items,
  jenisOptions,
  onClose,
  run,
}: {
  tagihan: {
    id: string;
    nomorTagihan: string;
    santriNama: string;
    periodeBulan: number;
    periodeTahun: number;
    status: string;
    totalTagihan: number;
  };
  items: TagihanItemLengkap[];
  jenisOptions: JenisOption[];
  onClose: () => void;
  run: (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => void;
}) {
  const bisaDiisi = STATUS_BISA_DIISI.includes(tagihan.status);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNominal, setEditNominal] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [tambahJenisId, setTambahJenisId] = useState("");
  const [tambahNominal, setTambahNominal] = useState("");
  const [tambahKeterangan, setTambahKeterangan] = useState("");
  const totalItem = items.reduce((sum, item) => sum + item.nominal, 0);

  const jenisAktif = jenisOptions.filter((j) => j.isActive);

  const pilihJenisTambah = (id: string) => {
    setTambahJenisId(id);
    const jenis = jenisAktif.find((j) => j.id === id);
    if (jenis && jenis.tarif > 0) setTambahNominal(String(jenis.tarif));
  };

  return (
    <div className="preview-overlay" role="dialog" aria-modal="true">
      <div className="preview-modal" style={{ maxWidth: 560 }}>
        <div className="preview-header">
          <div className="preview-title">
            <strong>Rincian & kelola item</strong>
            <span className="panel-subtitle">
              {tagihan.santriNama} · {labelPeriode(tagihan.periodeBulan, tagihan.periodeTahun)} ·{" "}
              {tagihan.nomorTagihan}
            </span>
          </div>
          <div className="preview-actions">
            <button
              type="button"
              className="table-action danger"
              title="Tutup"
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="preview-body" style={{ padding: 16 }}>
          <div className="table-shell modal-table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Nominal</th>
                  {bisaDiisi ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    {editId === item.id ? (
                      <>
                        <td>
                          <strong>{item.nama}</strong>
                          <input
                            type="text"
                            value={editKeterangan}
                            onChange={(event) => setEditKeterangan(event.target.value)}
                            placeholder="Keterangan (opsional)"
                            style={{ ...inputKecil, marginTop: 6 }}
                          />
                        </td>
                        <td style={{ minWidth: 130 }}>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            value={editNominal}
                            onChange={(event) => setEditNominal(event.target.value)}
                            style={inputKecil}
                          />
                          <MinimumNominalNote nominal={Number(editNominal)} />
                        </td>
                        {bisaDiisi ? (
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="table-action"
                                title="Simpan"
                                onClick={() => {
                                  const fd = new FormData();
                                  fd.set("itemId", item.id);
                                  fd.set("nominal", editNominal);
                                  fd.set("keterangan", editKeterangan);
                                  run(() => ubahItemTagihanForm(fd));
                                  setEditId(null);
                                }}
                              >
                                <Icon name="check" />
                              </button>
                              <button
                                type="button"
                                className="table-action"
                                title="Batal"
                                onClick={() => setEditId(null)}
                              >
                                <Icon name="close" />
                              </button>
                            </div>
                          </td>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <td>
                          <strong>{item.nama}</strong>
                          {item.keterangan ? (
                            <div className="invoice-number-small">{item.keterangan}</div>
                          ) : null}
                        </td>
                        <td style={{ textAlign: "right" }}>{rupiah(item.nominal)}</td>
                        {bisaDiisi ? (
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="table-action"
                                title="Ubah item"
                                onClick={() => {
                                  setEditId(item.id);
                                  setEditNominal(String(item.nominal));
                                  setEditKeterangan(item.keterangan ?? "");
                                }}
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                type="button"
                                className="table-action danger"
                                title="Hapus item"
                                disabled={items.length <= 1}
                                onClick={() => {
                                  if (!window.confirm(`Hapus item "${item.nama}"?`)) return;
                                  const fd = new FormData();
                                  fd.set("itemId", item.id);
                                  run(() => hapusItemTagihanForm(fd));
                                }}
                              >
                                <Icon name="trash" />
                              </button>
                            </div>
                          </td>
                        ) : null}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {items.length} item
              {!bisaDiisi ? " · item tidak dapat diubah pada status ini" : ""}
            </span>
            <span style={{ fontSize: 13 }}>
              Total item <strong>{rupiah(totalItem)}</strong>
            </span>
          </div>

          {bisaDiisi ? (
            <form
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                background: "var(--surface-soft)",
                border: "1px solid var(--line)",
              }}
              onSubmit={(event) => {
                event.preventDefault();
                const fd = new FormData();
                fd.set("tagihanId", tagihan.id);
                fd.set("jenisPembayaranId", tambahJenisId);
                fd.set("nominal", tambahNominal);
                fd.set("keterangan", tambahKeterangan);
                run(() => tambahItemTagihanForm(fd));
                setTambahJenisId("");
                setTambahNominal("");
                setTambahKeterangan("");
              }}
            >
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700 }}>
                Tambah item ke tagihan ini
              </p>
              <div className="field">
                <label htmlFor="ki-jenis">Jenis pembayaran</label>
                <select
                  id="ki-jenis"
                  required
                  value={tambahJenisId}
                  onChange={(event) => pilihJenisTambah(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">— pilih jenis —</option>
                  {jenisAktif
                    .filter((j) => j.kode !== "spp_bulanan")
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nama}
                        {j.tarif > 0 ? ` · ${rupiah(j.tarif)}` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ki-nominal">Nominal</label>
                <input
                  id="ki-nominal"
                  type="number"
                  min={0}
                  step={500}
                  required
                  value={tambahNominal}
                  onChange={(event) => setTambahNominal(event.target.value)}
                  style={inputStyle}
                />
                <MinimumNominalNote nominal={Number(tambahNominal)} />
              </div>
              <div className="field">
                <label htmlFor="ki-keterangan">
                  Keterangan <span className="optional">(opsional)</span>
                </label>
                <input
                  id="ki-keterangan"
                  value={tambahKeterangan}
                  onChange={(event) => setTambahKeterangan(event.target.value)}
                  placeholder="mis. seragam ukuran M"
                  style={inputStyle}
                />
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit">
                  <Icon name="plus" />
                  Tambah item
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
