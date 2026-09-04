import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/lib/icons";
import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Dashboard Santri",
  description:
    "Ruang belajar santri ELMS Pesantren untuk memantau tugas, nilai, kehadiran, dan tagihan SPP.",
};

type DashboardTask = {
  id: string;
  icon: IconName;
  tone: "blue" | "coral" | "";
  title: string;
  meta: string;
  fill: string;
  percent: number;
  progress: string;
  badge: { variant: BadgeVariant; label: string };
};

const DASHBOARD_TASKS: DashboardTask[] = [
  {
    id: "setoran-hafalan-juz-amma",
    icon: "book",
    tone: "",
    title: "Setoran hafalan Juz Amma",
    meta: "Tahfidz Qur'an · Dikumpulkan sebelum 12 Feb 2026",
    fill: "gold",
    percent: 64,
    progress: "Belum dikumpulkan",
    badge: { variant: "warning", label: "2 hari lagi" },
  },
  {
    id: "ringkasan-kitab-talim",
    icon: "file",
    tone: "blue",
    title: "Ringkasan Kitab Ta'lim",
    meta: "Kitab Kuning · Dikumpulkan sebelum 15 Feb 2026",
    fill: "",
    percent: 100,
    progress: "Sudah dikumpulkan",
    badge: { variant: "success", label: "Terkirim" },
  },
  {
    id: "latihan-persamaan-linear",
    icon: "chart",
    tone: "coral",
    title: "Latihan persamaan linear",
    meta: "Matematika · Dikumpulkan sebelum 18 Feb 2026",
    fill: "",
    percent: 35,
    progress: "Belum dikumpulkan",
    badge: { variant: "neutral", label: "8 hari lagi" },
  },
];

const METRICS = [
  {
    icon: "clipboard" as const,
    tone: "",
    label: "Tugas belum selesai",
    value: "4",
    note: "1 deadline 2 hari lagi",
  },
  {
    icon: "chart" as const,
    tone: "blue",
    label: "Rata-rata nilai",
    value: "88,4",
    note: "Semester Ganjil",
  },
  {
    icon: "users" as const,
    tone: "gold",
    label: "Kehadiran",
    value: "97,2%",
    note: "Hadir 24 dari 25",
  },
  {
    icon: "wallet" as const,
    tone: "coral",
    label: "Tagihan SPP",
    value: "Rp 350 rb",
    note: "Jatuh tempo 10 Feb",
  },
];

const GRADES = [
  { name: "Tahfidz Qur'an", description: "Hafalan · 94", score: "Mumtaz", tone: "" },
  { name: "Akhlak", description: "Tugas · 88", score: "Jayyid", tone: "" },
  { name: "Matematika", description: "Ulangan · 84", score: "Jayyid", tone: "mid" },
];

export default function SantriDashboardPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Ruang belajar santri"
        title="Assalamu'alaikum, Aisyah."
        description="Tetap semangat belajar. Ada beberapa aktivitas yang menunggu diselesaikan hari ini."
        actions={
          <>
            <RoleChip icon="book">Ibtida A</RoleChip>
            <Link className="button button-primary" href="/santri/tugas">
              <Icon name="clipboard" />
              Lihat tugas
            </Link>
          </>
        }
      />

      <section className="profile-summary">
        <span className="avatar">AF</span>
        <div>
          <div className="profile-summary-name">Aisyah Fitria</div>
          <div className="profile-summary-meta">
            NIS 20260124 · Ibtida A · Tahun Ajaran 2026 / 2027
          </div>
        </div>
      </section>

      <section className="metric-grid" style={{ marginTop: 15 }} aria-label="Ringkasan aktivitas">
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

      <div className="content-grid">
        <Panel
          title="Tugas yang perlu diselesaikan"
          subtitle="Jangan lewatkan deadline tugasmu"
          actions={
            <Link className="text-link" href="/santri/tugas">
              Semua tugas <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          <div className="student-task-list">
            {DASHBOARD_TASKS.map((task) => (
              <Link
                className="student-task-card"
                href={`/santri/tugas/${task.id}`}
                key={task.id}
              >
                <span
                  className={task.tone ? `task-card-icon ${task.tone}` : "task-card-icon"}
                >
                  <Icon name={task.icon} />
                </span>
                <div className="task-card-copy">
                  <strong className="task-card-title">{task.title}</strong>
                  <span className="task-card-meta">{task.meta}</span>
                  <div className="progress-track">
                    <div
                      className={task.fill ? `progress-fill ${task.fill}` : "progress-fill"}
                      style={{ width: `${task.percent}%` }}
                    />
                  </div>
                  <span className="task-card-progress">{task.progress}</span>
                </div>
                <StatusBadge variant={task.badge.variant}>
                  {task.badge.label}
                </StatusBadge>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          title="Nilai terbaru"
          subtitle="Perkembangan belajarmu"
          actions={
            <Link className="text-link" href="/santri/nilai">
              Lihat semua <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          <div className="score-overview">
            <div className="score-ring">
              <strong>88,4</strong>
            </div>
            <div>
              <div className="score-overview-title">Rata-rata semester</div>
              <div className="score-overview-text">
                Naik 3,2 poin dari penilaian sebelumnya.
              </div>
            </div>
          </div>
          <div className="setting-list" style={{ marginTop: 9 }}>
            {GRADES.map((grade) => (
              <div className="setting-row" key={grade.name}>
                <div>
                  <div className="setting-name">{grade.name}</div>
                  <div className="setting-description">{grade.description}</div>
                </div>
                <span
                  className={grade.tone ? `grade-score ${grade.tone}` : "grade-score"}
                >
                  {grade.score}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel
          title="Tagihan SPP aktif"
          subtitle="Pembayaran online melalui Mayar"
          actions={
            <Link className="text-link" href="/santri/pembayaran/tagihan">
              Bayar sekarang <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          <div className="bill-row">
            <div>
              <div className="bill-period">SPP Februari 2026</div>
              <div className="bill-number">
                #BILL-0206 · Jatuh tempo 10 Feb 2026
              </div>
            </div>
            <strong className="bill-amount">Rp 350.000</strong>
            <StatusBadge variant="warning">Belum dibayar</StatusBadge>
          </div>
        </Panel>

        <Panel
          title="Pengumuman"
          subtitle="Informasi terbaru pesantren"
          actions={
            <Link className="text-link" href="/santri/pengumuman">
              Lihat semua <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          <div className="announcement-text-block">
            <strong>Jadwal ujian tengah semester</strong>
            <span>
              Ujian dilaksanakan 2-7 Maret 2026. Cek jadwal lengkap di kalender.
            </span>
            <time>Hari ini</time>
          </div>
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
