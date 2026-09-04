import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import { MetricGrid } from "@/app/guru/metric-grid";

export const metadata: Metadata = {
  title: "Rapor Kelas",
  description:
    "Review kelengkapan data sebelum generate snapshot rapor untuk kelas yang diampu.",
};

const METRICS = [
  { icon: "check-circle", label: "Rapor terbit", value: "86", note: "Dari 118 santri" },
  { icon: "clock", tone: "gold" as const, label: "Siap digenerate", value: "25", note: "Semua data lengkap" },
  { icon: "alert", tone: "coral" as const, label: "Data belum lengkap", value: "7", note: "Nilai atau presensi kosong" },
  { icon: "chart", tone: "blue" as const, label: "Rata-rata kelas", value: "86,7", note: "Semester Ganjil" },
];

const READINESS = [
  {
    name: "Ibtida A",
    description: "28 santri · Nilai lengkap 100% · Kehadiran lengkap 100%",
    badge: { variant: "success" as const, label: "Siap" },
    toast: "Rapor Ibtida A berhasil dibuat.",
    action: "Generate",
  },
  {
    name: "Tsanawiyah 1",
    description: "31 santri · Nilai lengkap 87% · Kehadiran lengkap 100%",
    badge: { variant: "warning" as const, label: "Review" },
    toast: "Detail data Tsanawiyah 1 siap dibuka.",
    action: "Review",
  },
  {
    name: "Ulya A",
    description: "30 santri · Nilai lengkap 100% · Kehadiran lengkap 100%",
    badge: { variant: "success" as const, label: "Siap" },
    toast: "Rapor Ulya A berhasil dibuat.",
    action: "Generate",
  },
];

const REPORT_ROWS = [
  { subject: "Tahfidz Qur'an", predikat: "Mumtaz", score: "94" },
  { subject: "Akhlak", predikat: "Jayyid", score: "88" },
  { subject: "Matematika", predikat: "Jayyid", score: "84" },
];

export default function GuruRaporPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Rapor otomatis"
        title="Rapor kelas"
        description="Review kelengkapan data sebelum generate snapshot rapor untuk kelas yang diampu."
        actions={
          <>
            <ToastButton className="button button-secondary" message="Rapor terpilih siap diunduh.">
              <Icon name="download" />
              Download
            </ToastButton>
            <ToastButton className="button button-primary" message="Generate rapor kelas dimulai.">
              <Icon name="file" />
              Generate rapor
            </ToastButton>
          </>
        }
      />

      <MetricGrid items={METRICS} />

      <Panel
        title="Kesiapan rapor per kelas"
        subtitle="Nilai, kehadiran, dan catatan wali kelas"
        actions={
          <select className="select-control">
            <option>Semester Ganjil 2026/2027</option>
            <option>Semester Genap 2025/2026</option>
          </select>
        }
        bodyClassName="panel-body"
      >
        <div className="setting-list">
          {READINESS.map((row) => (
            <div className="setting-row" key={row.name}>
              <div>
                <div className="setting-name">{row.name}</div>
                <div className="setting-description">{row.description}</div>
              </div>
              <div className="page-actions">
                <StatusBadge variant={row.badge.variant}>{row.badge.label}</StatusBadge>
                <ToastButton className="button button-secondary" message={row.toast}>
                  {row.action}
                </ToastButton>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="content-grid" style={{ marginTop: 15 }}>
        <Panel
          title="Preview rapor"
          subtitle="Snapshot contoh sebelum file PDF dibuat"
          actions={
            <ToastButton className="text-link" message="Preview rapor diperbesar.">
              Buka preview <Icon name="external" />
            </ToastButton>
          }
          bodyClassName="panel-body"
        >
          <div className="report-card-preview">
            <div className="report-head">
              <div>
                <div className="report-school">Pesantren Al-Hikmah</div>
                <div className="report-school-meta">
                  Rapor hasil belajar · Tahun Ajaran 2026/2027
                </div>
              </div>
              <div className="report-label">Semester ganjil</div>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Mapel</th>
                  <th>Predikat</th>
                  <th>Nilai</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_ROWS.map((row) => (
                  <tr key={row.subject}>
                    <td>{row.subject}</td>
                    <td>{row.predikat}</td>
                    <td>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Catatan wali kelas" subtitle="Ditambahkan sebelum generate">
          <div className="form-card">
            <DemoForm
              success="Catatan wali kelas berhasil disimpan."
              actions={
                <button className="button button-primary" type="submit">
                  Simpan catatan
                </button>
              }
            >
              <div className="field">
                <label htmlFor="reportNote">Catatan</label>
                <textarea id="reportNote" placeholder="Tulis perkembangan dan saran untuk santri..." />
              </div>
            </DemoForm>
          </div>
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
