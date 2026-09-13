"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import {
  createJenisPembayaranForm,
  updateJenisPembayaranForm,
  setJenisPembayaranAktifForm,
} from "@/actions/forms";
import { rupiah } from "@/lib/format";

export type JenisPembayaranRow = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  keterangan: string | null;
  tarif: number;
  urutan: number;
  isActive: boolean;
};

const KATEGORI_LABEL: Record<string, string> = {
  bulanan: "Bulanan (rutin)",
  sekali: "Sekali (per santri)",
  insidental: "Insidental",
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

export function JenisPembayaranClient({ rows }: { rows: JenisPembayaranRow[] }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState<JenisPembayaranRow | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
      if (result.ok) setEdit(null);
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
            <h2 className="panel-title">Daftar jenis pembayaran</h2>
            <p className="panel-subtitle">
              {rows.length} jenis · dipakai saat menyusun tagihan santri.
            </p>
          </div>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kode</th>
                <th>Kategori</th>
                <th>Tarif bawaan</th>
                <th>Urutan</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.nama}</strong>
                    {row.keterangan ? (
                      <div className="invoice-number-small">{row.keterangan}</div>
                    ) : null}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 10 }}>{row.kode}</td>
                  <td>{KATEGORI_LABEL[row.kategori] ?? row.kategori}</td>
                  <td>{row.tarif > 0 ? rupiah(row.tarif) : "—"}</td>
                  <td>{row.urutan}</td>
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
                        title="Ubah"
                        disabled={pending}
                        onClick={() => setEdit(row)}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="table-action"
                        type="button"
                        title={row.isActive ? "Nonaktifkan" : "Aktifkan"}
                        disabled={pending}
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("id", row.id);
                          fd.set("isActive", row.isActive ? "false" : "true");
                          run(() => setJenisPembayaranAktifForm(fd));
                        }}
                      >
                        <Icon name={row.isActive ? "close" : "check"} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="panel-subtitle" style={{ padding: 14 }}>
              Belum ada jenis pembayaran.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">
          {edit ? `Ubah: ${edit.nama}` : "Tambah jenis pembayaran"}
        </h2>
        <p className="form-card-description">
          Kode dipakai sistem (huruf kecil), nama tampil ke wali/santri.
        </p>
        <form
          key={edit?.id ?? "baru"}
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            run(() => (edit ? updateJenisPembayaranForm(fd) : createJenisPembayaranForm(fd)));
          }}
        >
          {edit ? <input type="hidden" name="id" value={edit.id} /> : null}
          <div className="field">
            <label htmlFor="jp-nama">Nama</label>
            <input
              id="jp-nama"
              name="nama"
              required
              defaultValue={edit?.nama ?? ""}
              placeholder="mis. Seragam Santri"
              style={inputStyle}
            />
          </div>
          <div className="field">
            <label htmlFor="jp-kode">Kode</label>
            <input
              id="jp-kode"
              name="kode"
              required
              defaultValue={edit?.kode ?? ""}
              placeholder="mis. seragam"
              style={inputStyle}
            />
          </div>
          <div className="field">
            <label htmlFor="jp-kategori">Kategori</label>
            <select
              id="jp-kategori"
              name="kategori"
              defaultValue={edit?.kategori ?? "sekali"}
              style={inputStyle}
            >
              <option value="bulanan">Bulanan (rutin)</option>
              <option value="sekali">Sekali (per santri)</option>
              <option value="insidental">Insidental</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="jp-tarif">
              Tarif bawaan <span className="optional">(opsional)</span>
            </label>
            <input
              id="jp-tarif"
              name="tarif"
              type="number"
              min={0}
              step={500}
              defaultValue={edit?.tarif ?? 0}
              style={inputStyle}
            />
            <small>
              Otomatis mengisi nominal saat jenis ini dipilih di form buat tagihan. Kosongkan bila
              nominal selalu diisi manual.
            </small>
          </div>
          <div className="field">
            <label htmlFor="jp-keterangan">
              Keterangan <span className="optional">(opsional)</span>
            </label>
            <input
              id="jp-keterangan"
              name="keterangan"
              defaultValue={edit?.keterangan ?? ""}
              style={inputStyle}
            />
          </div>
          <div className="field">
            <label htmlFor="jp-urutan">Urutan tampil</label>
            <input
              id="jp-urutan"
              name="urutan"
              type="number"
              min={0}
              defaultValue={edit?.urutan ?? 10}
              style={inputStyle}
            />
          </div>
          <div className="form-actions">
            {edit ? (
              <button className="button button-secondary" type="button" onClick={() => setEdit(null)}>
                Batal
              </button>
            ) : null}
            <button className="button button-primary" type="submit" disabled={pending}>
              {edit ? "Simpan perubahan" : "Tambah"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
