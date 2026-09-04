import type { Metadata } from "next";
import { Icon, type IconName } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { AttendanceExplorer } from "@/components/attendance-explorer";

export const metadata: Metadata = {
  title: "Kehadiran Anak",
  description: "Pantau catatan kehadiran Aisyah Fitria pada semester berjalan.",
};

type Metric = {
  icon: IconName;
  tone?: "blue" | "gold" | "coral";
  label: string;
  value: string;
  note: string;
};

const METRICS: Metric[] = [
  { icon: "check-circle", label: "Hadir", value: "24", note: "96% pertemuan" },
  { icon: "clock", tone: "gold", label: "Izin", value: "1", note: "Dengan keterangan" },
  { icon: "users", tone: "blue", label: "Sakit", value: "0", note: "Tidak ada catatan" },
  { icon: "alert", tone: "coral", label: "Alpa", value: "0", note: "Tidak ada catatan" },
];

type Meeting = {
  date: string;
  subject: string;
  teacher: string;
  variant: "success" | "warning";
  status: string;
  note: string;
};

const MEETINGS: Meeting[] = [
  { date: "09 Feb 2026", subject: "Tahfidz Qur'an", teacher: "Ustz. Nisa Karimah", variant: "success", status: "Hadir", note: "-" },
  { date: "07 Feb 2026", subject: "Akhlak", teacher: "Ust. Hadi Santoso", variant: "success", status: "Hadir", note: "-" },
  { date: "05 Feb 2026", subject: "Matematika", teacher: "Ust. Farid Maulana", variant: "warning", status: "Izin", note: "Keperluan keluarga" },
  { date: "03 Feb 2026", subject: "Bahasa Arab", teacher: "Ustz. Salma Rahmi", variant: "success", status: "Hadir", note: "-" },
];

export default function WaliKehadiranPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Rekap presensi anak"
        title="Kehadiran anak"
        description="Pantau catatan kehadiran Aisyah Fitria pada semester berjalan."
        actions={
          <select className="select-control">
            <option>Aisyah Fitria</option>
            <option>Maya Salsabila</option>
          </select>
        }
      />

      <section className="child-switcher">
        <span className="avatar-sm gold">AF</span>
        <div className="child-switcher-copy">
          <span className="child-switcher-name">Aisyah Fitria</span>
          <span className="child-switcher-meta">NIS 20260124 · Ibtida A</span>
        </div>
        <span className="status-badge success">97,2% hadir</span>
      </section>

      <section className="metric-grid" style={{ marginTop: "15px" }} aria-label="Ringkasan kehadiran">
        {METRICS.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-icon${metric.tone ? ` ${metric.tone}` : ""}`}>
              <Icon name={metric.icon} />
            </span>
            <div className="metric-copy">
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-note">{metric.note}</span>
            </div>
          </article>
        ))}
      </section>

      <AttendanceExplorer variant="guardian" />

      <div className="content-grid">
        <Panel
          title="Kehadiran semester"
          subtitle="Target minimal kehadiran: 90%"
          bodyClassName="panel-body"
        >
          <div className="score-overview">
            <div className="score-ring">
              <strong>97,2%</strong>
            </div>
            <div>
              <div className="score-overview-title">Sangat baik</div>
              <div className="score-overview-text">Aisyah hadir konsisten dalam kegiatan belajar.</div>
            </div>
          </div>
          <div className="progress-row" style={{ marginTop: "18px" }}>
            <span>Hadir</span>
            <strong>24 / 25</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "97%" }} />
          </div>
        </Panel>

        <Panel
          title="Peringatan kehadiran"
          subtitle="Notifikasi untuk wali"
          bodyClassName="panel-body"
        >
          <div className="notice">
            <Icon name="check-circle" />
            <div>
              <strong>Tidak ada alpa berturut-turut</strong>
              Keadaan kehadiran Aisyah berada dalam kondisi baik.
            </div>
          </div>
          <div className="notice warning" style={{ marginTop: "10px" }}>
            <Icon name="clock" />
            <div>
              <strong>1 izin tercatat</strong>
              Keperluan keluarga pada 05 Februari 2026.
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Riwayat pertemuan"
        subtitle="Catatan dari guru pengampu"
        actions={
          <div className="toolbar-right">
            <select className="select-control">
              <option>Februari 2026</option>
              <option>Januari 2026</option>
            </select>
          </div>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Mapel</th>
                <th>Guru</th>
                <th>Status</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {MEETINGS.map((meeting) => (
                <tr key={meeting.date}>
                  <td>{meeting.date}</td>
                  <td>
                    <strong>{meeting.subject}</strong>
                  </td>
                  <td>{meeting.teacher}</td>
                  <td>
                    <StatusBadge variant={meeting.variant}>{meeting.status}</StatusBadge>
                  </td>
                  <td>{meeting.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Menampilkan 4 dari 25 pertemuan</span>
          <div className="pagination-buttons">
            <ToastButton className="pagination-button active" message="Halaman 1 aktif.">
              1
            </ToastButton>
            <ToastButton className="pagination-button" message="Halaman 2 siap dibuka.">
              2
            </ToastButton>
            <ToastButton className="pagination-button" message="Halaman berikutnya siap dibuka.">
              <Icon name="chevron-right" />
            </ToastButton>
          </div>
        </div>
      </Panel>

      <footer className="footer">
        <span className="footer-brand">
          <Icon name="mosque" />
          ELMS Pesantren · Prototype HTML
        </span>
        <span className="footer-note">Akses hanya tersedia untuk anak yang terhubung</span>
      </footer>
    </>
  );
}
