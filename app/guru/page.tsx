import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { Icon } from "@/lib/icons";
import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { MetricGrid } from "@/app/guru/metric-grid";

export const metadata: Metadata = {
  title: "Dashboard Guru",
  description:
    "Ringkasan kelas, tugas, dan aktivitas penilaian yang perlu diselesaikan guru hari ini.",
};

type AvatarTone = "gold" | "blue" | "coral";

const METRICS = [
  { icon: "book", label: "Kelas diampu", value: "4", note: "Ibtida A hingga Ulya A" },
  { icon: "users", tone: "blue" as const, label: "Total santri", value: "118", note: "Dari semua kelas Anda" },
  { icon: "clipboard", tone: "gold" as const, label: "Tugas aktif", value: "12", note: "3 deadline minggu ini" },
  { icon: "chart", tone: "coral" as const, label: "Perlu dinilai", value: "17", note: "Submission menunggu review" },
];

const SCHEDULE = [
  {
    time: "07:30",
    subject: "Tahfidz Qur'an",
    meta: "Ibtida A · Ruang Tahfidz",
    badge: { variant: "success" as const, label: "Selesai" },
  },
  {
    time: "09:10",
    subject: "Akhlak",
    meta: "Tsanawiyah 1 · Kelas 2A",
    badge: { variant: "warning" as const, label: "Berikutnya" },
  },
  {
    time: "13:00",
    subject: "Bahasa Arab",
    meta: "Ulya A · Kelas 3B",
    badge: { variant: "neutral" as const, label: "Terjadwal" },
  },
];

const ATTENDANCE = [
  { label: "Ibtida A", value: "96,4%", width: 96 },
  { label: "Tsanawiyah 1", value: "93,8%", width: 94 },
  { label: "Ulya A", value: "95,2%", width: 95 },
];

const SUBMISSIONS: {
  name: string;
  kelas: string;
  initials: string;
  tone?: AvatarTone;
  task: string;
  submitted: string;
  badge: { variant: BadgeVariant; label: string };
  actionLabel: string;
}[] = [
  {
    name: "Aisyah Fitria",
    kelas: "Ibtida A",
    initials: "AF",
    tone: "gold",
    task: "Setoran hafalan Juz Amma",
    submitted: "09 Feb, 07:42",
    badge: { variant: "warning", label: "Perlu dinilai" },
    actionLabel: "Nilai submission",
  },
  {
    name: "Fauzan Ramadhan",
    kelas: "Tsanawiyah 1",
    initials: "FR",
    tone: "blue",
    task: "Ringkasan Kitab Ta'lim",
    submitted: "08 Feb, 20:16",
    badge: { variant: "warning", label: "Perlu dinilai" },
    actionLabel: "Nilai submission",
  },
  {
    name: "Maya Salsabila",
    kelas: "Tsanawiyah 1",
    initials: "MS",
    tone: "coral",
    task: "Ringkasan Kitab Ta'lim",
    submitted: "08 Feb, 19:54",
    badge: { variant: "success", label: "Dinilai" },
    actionLabel: "Lihat submission",
  },
];

export default function GuruDashboardPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Ruang kerja guru"
        title="Assalamu'alaikum, Ustadzah Nisa."
        description="Berikut ringkasan kelas, tugas, dan aktivitas penilaian yang perlu diselesaikan hari ini."
        actions={
          <>
            <RoleChip icon="book">4 kelas diampu</RoleChip>
            <Link className="button button-primary" href="/guru/tugas/baru">
              <Icon name="plus" />
              Buat tugas
            </Link>
          </>
        }
      />

      <MetricGrid items={METRICS} />

      <div className="content-grid">
        <Panel
          title="Jadwal mengajar hari ini"
          subtitle="Senin, 09 Februari 2026"
          actions={
            <Link className="text-link" href="/guru/kalender">
              Kalender <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          <div className="schedule-list">
            {SCHEDULE.map((item) => (
              <div className="schedule-item" key={item.time}>
                <span className="schedule-time">{item.time}</span>
                <div>
                  <div className="schedule-subject">{item.subject}</div>
                  <div className="schedule-meta">{item.meta}</div>
                </div>
                <StatusBadge variant={item.badge.variant}>{item.badge.label}</StatusBadge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Kehadiran kelas"
          subtitle="Rekap minggu berjalan"
          actions={
            <Link className="text-link" href="/guru/kehadiran">
              Input presensi <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          {ATTENDANCE.map((row, index) => (
            <Fragment key={row.label}>
              <div className="progress-row" style={index > 0 ? { marginTop: 15 } : undefined}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${row.width}%` }} />
              </div>
            </Fragment>
          ))}
          <div className="notice warning" style={{ marginTop: 18 }}>
            <Icon name="alert" />
            <div>
              <strong>2 santri perlu perhatian</strong>Alpa dua kali berturut-turut di Tsanawiyah 1.
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Submission terbaru"
        subtitle="Tugas yang belum selesai direview"
        actions={
          <Link className="text-link" href="/guru/tugas/submission">
            Lihat semua <Icon name="chevron-right" />
          </Link>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Santri</th>
                <th>Tugas</th>
                <th>Dikumpulkan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {SUBMISSIONS.map((row) => (
                <tr key={row.name}>
                  <td>
                    <div className="person-cell">
                      <span className={row.tone ? `avatar-sm ${row.tone}` : "avatar-sm"}>
                        {row.initials}
                      </span>
                      <div>
                        <span className="person-name">{row.name}</span>
                        <span className="person-meta">{row.kelas}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{row.task}</strong>
                  </td>
                  <td>{row.submitted}</td>
                  <td>
                    <StatusBadge variant={row.badge.variant}>{row.badge.label}</StatusBadge>
                  </td>
                  <td>
                    <Link
                      className="table-action"
                      href="/guru/tugas/submission"
                      aria-label={row.actionLabel}
                    >
                      <Icon name="eye" />
                    </Link>
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
