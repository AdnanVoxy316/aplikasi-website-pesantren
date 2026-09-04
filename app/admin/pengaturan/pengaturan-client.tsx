"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  updatePengaturanForm,
  createTahunAjaranForm,
  activateTahunAjaranForm,
  createJenisNilaiForm,
  deleteJenisNilaiForm,
} from "@/actions/forms";

export type TaRow = { id: string; label: string; isActive: boolean; tanggalMulai: string; tanggalSelesai: string };
export type JenisRow = { id: string; nama: string; bobot: number };
export type SettingsRow = {
  namaPesantren: string;
  alamat: string | null;
  deskripsi: string | null;
  logoUrl: string | null;
  semesterAktif: string;
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

export function PengaturanClient({
  settings,
  taRows,
  jenisRows,
}: {
  settings: SettingsRow | null;
  taRows: TaRow[];
  jenisRows: JenisRow[];
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
    <div className="detail-layout" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 15, alignItems: "start" }}>
      <section className="panel form-card">
        <h2 className="form-card-title">Pengaturan situs</h2>
        <p className="form-card-description">
          Identitas pesantren — dipakai di seluruh aplikasi, jangan hard-code di komponen.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            run(() => updatePengaturanForm(fd));
          }}
        >
          <div className="field">
            <label htmlFor="s-nama">Nama pesantren</label>
            <input id="s-nama" name="namaPesantren" required defaultValue={settings?.namaPesantren ?? ""} style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="s-alamat">Alamat</label>
            <input id="s-alamat" name="alamat" defaultValue={settings?.alamat ?? ""} style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="s-deskripsi">Deskripsi singkat</label>
            <textarea
              id="s-deskripsi"
              name="deskripsi"
              defaultValue={settings?.deskripsi ?? ""}
              style={{ ...inputStyle, minHeight: 70 }}
            />
          </div>
          <div className="field">
            <label htmlFor="s-logo">
              Logo URL <span className="optional">(opsional)</span>
            </label>
            <input id="s-logo" name="logoUrl" type="url" defaultValue={settings?.logoUrl ?? ""} style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="s-semester">Semester aktif</label>
            <select id="s-semester" name="semesterAktif" defaultValue={settings?.semesterAktif ?? "ganjil"} style={inputStyle}>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Simpan pengaturan
            </button>
          </div>
        </form>
      </section>

      <div style={{ display: "grid", gap: 15 }}>
        <section className="panel form-card">
          <h2 className="form-card-title">Tahun ajaran</h2>
          <p className="form-card-description">Aktifkan satu tahun ajaran sebagai acuan data berjalan.</p>
          <div style={{ marginBottom: 12 }}>
            {taRows.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "var(--surface-soft)",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12 }}>
                  <strong>{t.label}</strong> · {t.tanggalMulai} s/d {t.tanggalSelesai}{" "}
                  {t.isActive ? <StatusBadge variant="success">Aktif</StatusBadge> : null}
                </span>
                {!t.isActive ? (
                  <button
                    className="table-button"
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("id", t.id);
                      run(() => activateTahunAjaranForm(fd));
                    }}
                  >
                    Aktifkan
                  </button>
                ) : null}
              </div>
            ))}
            {taRows.length === 0 ? <p className="panel-subtitle">Belum ada tahun ajaran.</p> : null}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const fd = new FormData(form);
              run(() => createTahunAjaranForm(fd));
              form.reset();
            }}
          >
            <div className="form-grid">
              <div className="field">
                <label htmlFor="ta-label">Label</label>
                <input id="ta-label" name="label" required placeholder="2027/2028" style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="ta-mulai">Mulai</label>
                <input id="ta-mulai" name="tanggalMulai" type="date" required style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="ta-selesai">Selesai</label>
                <input id="ta-selesai" name="tanggalSelesai" type="date" required style={inputStyle} />
              </div>
            </div>
            <div className="form-actions">
              <button className="button button-secondary" type="submit" disabled={pending}>
                Tambah tahun ajaran
              </button>
            </div>
          </form>
        </section>

        <section className="panel form-card">
          <h2 className="form-card-title">Jenis nilai & bobot</h2>
          <p className="form-card-description">
            Bobot dipakai menghitung nilai akhir (misal Tugas 0.3 + UTS 0.3 + UAS 0.4).
          </p>
          <div style={{ marginBottom: 12 }}>
            {jenisRows.map((j) => (
              <div
                key={j.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  borderRadius: 10,
                  background: "var(--surface-soft)",
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                <span>
                  <strong>{j.nama}</strong> · bobot {j.bobot}
                </span>
                <button
                  className="table-action danger"
                  type="button"
                  title="Hapus"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`Hapus jenis nilai ${j.nama}?`)) return;
                    const fd = new FormData();
                    fd.set("id", j.id);
                    run(() => deleteJenisNilaiForm(fd));
                  }}
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))}
            {jenisRows.length === 0 ? <p className="panel-subtitle">Belum ada jenis nilai.</p> : null}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const fd = new FormData(form);
              run(() => createJenisNilaiForm(fd));
              form.reset();
            }}
          >
            <div className="form-grid">
              <div className="field">
                <label htmlFor="jn-nama">Nama</label>
                <input id="jn-nama" name="nama" required placeholder="misal Hafalan" style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="jn-bobot">Bobot</label>
                <input id="jn-bobot" name="bobot" type="number" step="0.05" min="0" defaultValue="1" required style={inputStyle} />
              </div>
            </div>
            <div className="form-actions">
              <button className="button button-secondary" type="submit" disabled={pending}>
                Tambah jenis nilai
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
