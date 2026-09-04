import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Rapor Saya",
  description:
    "Unduh rapor semester dan lihat ringkasan nilai serta kehadiran santri Ibtida A.",
};

const REPORT_ROWS = [
  { subject: "Tahfidz Qur'an", predicate: "Mumtaz", score: "94" },
  { subject: "Akhlak", predicate: "Jayyid", score: "88" },
  { subject: "Matematika", predicate: "Jayyid", score: "84" },
  { subject: "Bahasa Arab", predicate: "Jayyid", score: "88" },
];

const HIGHLIGHTS = [
  { name: "Rata-rata nilai", description: "Gabungan semua mapel", score: "88,4" },
  { name: "Kehadiran", description: "Hadir 24 dari 25", score: "97,2%" },
];

const PREVIOUS_REPORTS = [
  {
    title: "Rapor Semester Genap 2025 / 2026",
    meta: "Diterbitkan 28 Juni 2026",
  },
  {
    title: "Rapor Semester Ganjil 2025 / 2026",
    meta: "Diterbitkan 22 Desember 2025",
  },
];

export default function SantriRaporPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Hasil belajar"
        title="Rapor saya"
        description="Unduh rapor semester dan lihat ringkasan nilai serta kehadiran."
        actions={
          <ToastButton
            className="button button-primary"
            message="Rapor PDF sedang disiapkan."
          >
            <Icon name="download" />
            Unduh rapor PDF
          </ToastButton>
        }
      />

      <section className="summary-banner">
        <div>
          <div className="summary-banner-title">
            Rapor Semester Ganjil 2026 / 2027
          </div>
          <div className="summary-banner-text">
            Diterbitkan 08 Februari 2026 oleh wali kelas Ibtida A.
          </div>
        </div>
        <StatusBadge variant="success">Tersedia</StatusBadge>
      </section>

      <div className="content-grid" style={{ marginTop: 15 }}>
        <Panel
          title="Ringkasan nilai"
          subtitle="Snapshot saat rapor diterbitkan"
          bodyClassName="panel-body"
        >
          <div className="report-card-preview">
            <div className="report-head">
              <div>
                <div className="report-school">Pesantren Al-Hikmah</div>
                <div className="report-school-meta">
                  Aisyah Fitria · NIS 20260124 · Ibtida A
                </div>
              </div>
              <div className="report-label">Ganjil</div>
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
                    <td>{row.predicate}</td>
                    <td>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Catatan wali kelas"
          subtitle="Untuk perkembangan berikutnya"
          bodyClassName="panel-body"
        >
          <p className="report-note">
            Aisyah menunjukkan ketekunan yang baik dalam hafalan dan tugas
            harian. Pertahankan konsistensi murojaah serta keberanian bertanya
            di kelas.
          </p>
          <div className="setting-list" style={{ marginTop: 15 }}>
            {HIGHLIGHTS.map((item) => (
              <div className="setting-row" key={item.name}>
                <div>
                  <div className="setting-name">{item.name}</div>
                  <div className="setting-description">{item.description}</div>
                </div>
                <span className="grade-score">{item.score}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Rapor sebelumnya"
        subtitle="Histori rapor yang pernah diterbitkan"
        bodyClassName="panel-body"
      >
        {PREVIOUS_REPORTS.map((report) => (
          <div className="report-download" key={report.title}>
            <div>
              <div className="report-download-title">{report.title}</div>
              <div className="report-download-meta">{report.meta}</div>
            </div>
            <ToastButton
              className="button button-secondary"
              message="Rapor semester sebelumnya siap diunduh."
            >
              <Icon name="download" />
              PDF
            </ToastButton>
          </div>
        ))}
      </Panel>

      <PageFooter />
    </>
  );
}
