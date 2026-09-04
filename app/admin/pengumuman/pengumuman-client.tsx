"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { createPengumumanForm, deletePengumumanForm } from "@/actions/forms";
import { tanggalWaktuIndo } from "@/lib/format";

export type PengumumanRow = {
  id: string;
  judul: string;
  isi: string;
  targetRole: string;
  targetKelasNama: string | null;
  dibuatOlehNama: string | null;
  createdAt: Date;
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

export function PengumumanClient({
  rows,
  kelasOptions,
}: {
  rows: PengumumanRow[];
  kelasOptions: KelasOption[];
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
            <h2 className="panel-title">Pengumuman terbit</h2>
            <p className="panel-subtitle">{rows.length} pengumuman</p>
          </div>
        </div>
        <div className="announcement-list" style={{ padding: "0 22px 18px" }}>
          {rows.map((row) => (
            <article className="announcement" key={row.id} style={{ alignItems: "flex-start" }}>
              <span className="announcement-icon">
                <Icon name="megaphone" />
              </span>
              <div style={{ flex: 1 }}>
                <div className="announcement-title">{row.judul}</div>
                <div className="announcement-text">{row.isi}</div>
                <div className="announcement-date">
                  {tanggalWaktuIndo(row.createdAt)} · target:{" "}
                  {row.targetKelasNama ?? row.targetRole}
                </div>
              </div>
              <button
                className="table-action danger"
                type="button"
                title="Hapus"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Hapus pengumuman "${row.judul}"?`)) return;
                  const fd = new FormData();
                  fd.set("id", row.id);
                  run(() => deletePengumumanForm(fd));
                }}
              >
                <Icon name="trash" />
              </button>
            </article>
          ))}
          {rows.length === 0 ? (
            <p className="panel-subtitle">Belum ada pengumuman. Buat yang pertama di panel sebelah.</p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">Pengumuman baru</h2>
        <p className="form-card-description">
          Broadcast ke semua role atau target tertentu. Notifikasi in-app dikirim otomatis.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            run(() => createPengumumanForm(fd));
            form.reset();
          }}
        >
          <div className="field">
            <label htmlFor="pg-judul">Judul</label>
            <input id="pg-judul" name="judul" required style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="pg-isi">Isi pengumuman</label>
            <textarea id="pg-isi" name="isi" required style={{ ...inputStyle, minHeight: 90 }} />
          </div>
          <div className="field">
            <label htmlFor="pg-target">Target penerima</label>
            <select id="pg-target" name="targetRole" defaultValue="semua" style={inputStyle}>
              <option value="semua">Semua role</option>
              <option value="guru">Guru saja</option>
              <option value="santri">Santri saja</option>
              <option value="wali_santri">Wali santri saja</option>
              <option value="admin">Admin saja</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pg-kelas">
              Kelas khusus <span className="optional">(hanya bila target santri)</span>
            </label>
            <select id="pg-kelas" name="targetKelasId" defaultValue="" style={inputStyle}>
              <option value="">— semua kelas —</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Terbitkan pengumuman
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
