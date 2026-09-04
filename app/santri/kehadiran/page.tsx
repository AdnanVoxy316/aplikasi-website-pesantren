import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { AttendanceExplorer } from "@/components/attendance-explorer";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Kehadiran Saya",
  description:
    "Pantau catatan kehadiran pada seluruh kegiatan belajar semester ini.",
};

const METRICS = [
  {
    icon: "check-circle" as const,
    tone: "",
    label: "Hadir",
    value: "24",
    note: "96% dari pertemuan",
  },
  {
    icon: "clock" as const,
    tone: "gold",
    label: "Izin",
    value: "1",
    note: "Dengan keterangan",
  },
  {
    icon: "users" as const,
    tone: "blue",
    label: "Sakit",
    value: "0",
    note: "Tidak ada catatan",
  },
  {
    icon: "alert" as const,
    tone: "coral",
    label: "Alpa",
    value: "0",
    note: "Pertahankan konsistensi",
  },
];

const HISTORY = [
  {
    date: "09 Feb 2026",
    subject: "Tahfidz Qur'an",
    teacher: "Ustz. Nisa Karimah",
    status: { variant: "success" as const, label: "Hadir" },
    note: "-",
  },
  {
    date: "07 Feb 2026",
    subject: "Akhlak",
    teacher: "Ust. Hadi Santoso",
    status: { variant: "success" as const, label: "Hadir" },
    note: "-",
  },
  {
    date: "05 Feb 2026",
    subject: "Matematika",
    teacher: "Ust. Farid Maulana",
    status: { variant: "warning" as const, label: "Izin" },
    note: "Keperluan keluarga",
  },
  {
    date: "03 Feb 2026",
    subject: "Bahasa Arab",
    teacher: "Ustz. Salma Rahmi",
    status: { variant: "success" as const, label: "Hadir" },
    note: "-",
  },
];

export default function SantriKehadiranPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Rekap presensi"
        title="Kehadiran saya"
        description="Pantau catatan kehadiran pada seluruh kegiatan belajar semester ini."
        actions={
          <select className="select-control" aria-label="Pilih semester">
            <option>Semester Ganjil 2026/2027</option>
            <option>Semester Genap 2025/2026</option>
          </select>
        }
      />

      <section className="metric-grid" aria-label="Ringkasan kehadiran">
        {METRICS.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span
              className={metric.tone ? `metric-icon ${metric.tone}` : "metric-icon"}
            >
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

      <AttendanceExplorer variant="self" />

      <div className="content-grid">
        <Panel
          title="Persentase kehadiran"
          subtitle="Target minimal pesantren: 90%"
          actions={<RoleChip icon="check-circle">97,2% baik</RoleChip>}
          bodyClassName="panel-body"
        >
          <div className="score-overview">
            <div className="score-ring high">
              <strong>97,2%</strong>
            </div>
            <div>
              <div className="score-overview-title">Kehadiran sangat baik</div>
              <div className="score-overview-text">
                Kamu hadir di 24 dari 25 pertemuan.
              </div>
            </div>
          </div>
          <div className="progress-row" style={{ marginTop: 18 }}>
            <span>Kehadiran saat ini</span>
            <strong>97,2%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "97%" }} />
          </div>
        </Panel>

        <Panel
          title="Catatan penting"
          subtitle="Keterangan dari wali kelas"
          bodyClassName="panel-body"
        >
          <div className="notice">
            <Icon name="check-circle" />
            <div>
              <strong>Terus pertahankan</strong>
              Belum ada catatan alpa. Kehadiranmu membantu proses belajar
              berjalan baik.
            </div>
          </div>
          <div className="notice warning" style={{ marginTop: 10 }}>
            <Icon name="clock" />
            <div>
              <strong>1 izin tercatat</strong>
              Pastikan keterangan izin tersimpan untuk setiap pertemuan.
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Riwayat kehadiran"
        subtitle="Pertemuan terbaru yang tercatat"
        actions={
          <div className="toolbar-right">
            <select className="select-control" aria-label="Filter status kehadiran">
              <option>Semua status</option>
              <option>Hadir</option>
              <option>Izin</option>
              <option>Sakit</option>
              <option>Alpa</option>
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
              {HISTORY.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>
                    <strong>{row.subject}</strong>
                  </td>
                  <td>{row.teacher}</td>
                  <td>
                    <span className={`status-badge ${row.status.variant}`}>
                      {row.status.label}
                    </span>
                  </td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Menampilkan 4 dari 25 pertemuan</span>
          <div className="pagination-buttons">
            <ToastButton
              className="pagination-button active"
              message="Halaman 1 sedang ditampilkan."
            >
              1
            </ToastButton>
            <ToastButton
              className="pagination-button"
              message="Halaman 2 tersedia pada versi aplikasi berikutnya."
            >
              2
            </ToastButton>
            <ToastButton
              className="pagination-button"
              ariaLabel="Halaman berikutnya"
              message="Navigasi halaman tersedia pada versi aplikasi berikutnya."
            >
              <Icon name="chevron-right" />
            </ToastButton>
          </div>
        </div>
      </Panel>

      <PageFooter />
    </>
  );
}
