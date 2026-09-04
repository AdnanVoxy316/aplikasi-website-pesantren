import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Rapor Anak",
  description: "Lihat dan unduh rapor Aisyah Fitria yang telah diterbitkan.",
};

const REPORT_ROWS = [
  { subject: "Tahfidz Qur'an", predicate: "Mumtaz", score: "94" },
  { subject: "Akhlak", predicate: "Jayyid", score: "88" },
  { subject: "Matematika", predicate: "Jayyid", score: "84" },
  { subject: "Bahasa Arab", predicate: "Jayyid", score: "88" },
];

const SUMMARY_ROWS = [
  { name: "Rata-rata nilai", description: "Gabungan semua mapel", score: "88,4" },
  { name: "Kehadiran", description: "Hadir 24 dari 25", score: "97,2%" },
];

const PREVIOUS_REPORTS = [
  { title: "Rapor Semester Genap 2025 / 2026", meta: "Diterbitkan 28 Juni 2026" },
  { title: "Rapor Semester Ganjil 2025 / 2026", meta: "Diterbitkan 22 Desember 2025" },
];

export default function WaliRaporPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Dokumen hasil belajar"
        title="Rapor anak"
        description="Lihat dan unduh rapor Aisyah Fitria yang telah diterbitkan."
        actions={
          <>
            <select className="select-control">
              <option>Aisyah Fitria</option>
              <option>Maya Salsabila</option>
            </select>
            <ToastButton className="button button-primary" message="Rapor PDF sedang disiapkan.">
              <Icon name="download" />
              Unduh PDF
            </ToastButton>
          </>
        }
      />

      <section className="child-switcher">
        <span className="avatar-sm gold">AF</span>
        <div className="child-switcher-copy">
          <span className="child-switcher-name">Aisyah Fitria</span>
          <span className="child-switcher-meta">NIS 20260124 · Ibtida A</span>
        </div>
        <span className="status-badge success">Rapor tersedia</span>
      </section>

      <section className="summary-banner" style={{ marginTop: "15px" }}>
        <div>
          <div className="summary-banner-title">Rapor Semester Ganjil 2026 / 2027</div>
          <div className="summary-banner-text">Diterbitkan 08 Februari 2026 oleh wali kelas Ibtida A.</div>
        </div>
        <StatusBadge variant="success">Snapshot</StatusBadge>
      </section>

      <div className="content-grid" style={{ marginTop: "15px" }}>
        <Panel
          title="Ringkasan nilai Aisyah"
          subtitle="Snapshot nilai saat rapor diterbitkan"
          bodyClassName="panel-body"
        >
          <div className="report-card-preview">
            <div className="report-head">
              <div>
                <div className="report-school">Pesantren Al-Hikmah</div>
                <div className="report-school-meta">Aisyah Fitria · NIS 20260124 · Ibtida A</div>
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
          subtitle="Dapat menjadi bahan pendampingan"
          bodyClassName="panel-body"
        >
          <p className="report-note">
            Aisyah menunjukkan ketekunan yang baik dalam hafalan dan tugas harian. Pertahankan konsistensi
            murojaah serta keberanian bertanya di kelas.
          </p>
          <div className="setting-list" style={{ marginTop: "15px" }}>
            {SUMMARY_ROWS.map((row) => (
              <div className="setting-row" key={row.name}>
                <div>
                  <div className="setting-name">{row.name}</div>
                  <div className="setting-description">{row.description}</div>
                </div>
                <span className="grade-score">{row.score}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Rapor sebelumnya"
        subtitle="Dokumen histori anak"
        bodyClassName="panel-body"
      >
        {PREVIOUS_REPORTS.map((report) => (
          <div className="report-download" key={report.title}>
            <div>
              <div className="report-download-title">{report.title}</div>
              <div className="report-download-meta">{report.meta}</div>
            </div>
            <ToastButton className="button button-secondary" message="Rapor semester sebelumnya siap diunduh.">
              <Icon name="download" />
              PDF
            </ToastButton>
          </div>
        ))}
      </Panel>

      <footer className="footer">
        <span className="footer-brand">
          <Icon name="mosque" />
          ELMS Pesantren · Prototype HTML
        </span>
        <span className="footer-note">Wali santri memiliki akses baca saja</span>
      </footer>
    </>
  );
}
