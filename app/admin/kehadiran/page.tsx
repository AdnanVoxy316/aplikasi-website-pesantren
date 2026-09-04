import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { AttendanceExplorer } from "@/components/attendance-explorer";

export const metadata: Metadata = {
  title: "Kehadiran Pesantren",
  description:
    "Lihat presensi lintas kelas, periode minggu atau bulan, dan status setiap santri.",
};

type PresenceRow = {
  className: string;
  students: string;
  present: string;
  permit: string;
  absent: string;
  percentage: string;
  status: { variant: "success" | "warning"; label: string };
};

const PRESENCE: PresenceRow[] = [
  {
    className: "Ibtida A",
    students: "28",
    present: "27",
    permit: "1",
    absent: "0",
    percentage: "96,4%",
    status: { variant: "success", label: "Baik" },
  },
  {
    className: "Tsanawiyah 1",
    students: "31",
    present: "28",
    permit: "1",
    absent: "2",
    percentage: "90,3%",
    status: { variant: "warning", label: "Perlu pantau" },
  },
  {
    className: "Ulya A",
    students: "30",
    present: "29",
    permit: "1",
    absent: "0",
    percentage: "96,7%",
    status: { variant: "success", label: "Baik" },
  },
];

export default function AdminKehadiranPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Rekap presensi pesantren"
        title="Kehadiran seluruh santri"
        description="Lihat presensi lintas kelas, periode minggu atau bulan, dan status setiap santri."
        actions={
          <ToastButton
            className="button button-primary"
            message="Rekap kehadiran siap diekspor."
          >
            <Icon name="download" />
            Export rekap
          </ToastButton>
        }
      />
      <section className="metric-grid">
        <MetricCard
          icon="users"
          label="Santri terpantau"
          value="486"
          note="18 kelas aktif"
        />
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="check-circle" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Kehadiran rata-rata</span>
            <strong className="metric-value">94,8%</strong>
            <span className="metric-note">Naik 2,6% pekan ini</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="clock" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Izin / sakit</span>
            <strong className="metric-value">3,1%</strong>
            <span className="metric-note">Perlu keterangan lengkap</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="alert" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Alpa</span>
            <strong className="metric-value">2,1%</strong>
            <span className="metric-note">14 santri perlu perhatian</span>
          </div>
        </article>
      </section>
      <AttendanceExplorer variant="self" />
      <Panel
        title="Presensi hari ini"
        subtitle="Senin, 09 Februari 2026 · Semua kelas"
        actions={
          <div className="toolbar-right">
            <select className="select-control" aria-label="Filter tingkat">
              <option>Semua tingkat</option>
              <option>Ibtida</option>
              <option>Tsanawiyah</option>
              <option>Ulya</option>
            </select>
            <ToastButton
              className="button button-secondary"
              message="Detail presensi kelas siap dibuka."
            >
              <Icon name="eye" />
              Detail
            </ToastButton>
          </div>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kelas</th>
                <th>Santri</th>
                <th>Hadir</th>
                <th>Izin / sakit</th>
                <th>Alpa</th>
                <th>Persentase</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PRESENCE.map((row) => (
                <tr key={row.className}>
                  <td>
                    <strong>{row.className}</strong>
                  </td>
                  <td>{row.students}</td>
                  <td>{row.present}</td>
                  <td>{row.permit}</td>
                  <td>{row.absent}</td>
                  <td>{row.percentage}</td>
                  <td>
                    <StatusBadge variant={row.status.variant}>
                      {row.status.label}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <PageFooter />
    </>
  );
}
