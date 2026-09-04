import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { MetricGrid } from "@/app/guru/metric-grid";
import { TaskTable, type TaskRow } from "@/app/guru/tugas/task-table";

export const metadata: Metadata = {
  title: "Tugas Guru",
  description: "Buat tugas, pantau pengumpulan, dan berikan feedback kepada santri.",
};

const METRICS = [
  { icon: "clipboard", label: "Tugas aktif", value: "12", note: "4 kelas diampu" },
  { icon: "clock", tone: "gold" as const, label: "Deadline minggu ini", value: "3", note: "Perlu dipantau" },
  { icon: "upload", tone: "blue" as const, label: "Submission masuk", value: "102", note: "Dari 118 santri" },
  { icon: "chart", tone: "coral" as const, label: "Perlu dinilai", value: "17", note: "Belum ada feedback" },
];

const TASKS: TaskRow[] = [
  {
    id: "t1",
    title: "Setoran hafalan Juz Amma",
    created: "Dibuat 02 Feb 2026",
    mapel: "Tahfidz Qur'an",
    kelas: "Ibtida A",
    deadline: "12 Feb 2026",
    deadlineNote: "2 hari lagi",
    submissions: "18 / 28",
    badge: { variant: "warning", label: "Segera berakhir" },
    action: { kind: "view", ariaLabel: "Lihat submission" },
  },
  {
    id: "t2",
    title: "Ringkasan Kitab Ta'lim Muta'allim",
    created: "Dibuat 01 Feb 2026",
    mapel: "Kitab Kuning",
    kelas: "Tsanawiyah 1",
    deadline: "15 Feb 2026",
    deadlineNote: "5 hari lagi",
    submissions: "31 / 31",
    badge: { variant: "success", label: "Aktif" },
    action: { kind: "view", ariaLabel: "Lihat submission" },
  },
  {
    id: "t3",
    title: "Latihan persamaan linear",
    created: "Dibuat 31 Jan 2026",
    mapel: "Matematika",
    kelas: "Ulya B",
    deadline: "18 Feb 2026",
    deadlineNote: "8 hari lagi",
    submissions: "24 / 30",
    badge: { variant: "success", label: "Aktif" },
    action: { kind: "view", ariaLabel: "Lihat submission" },
  },
  {
    id: "t4",
    title: "Kuis adab menuntut ilmu",
    created: "Dibuat 20 Jan 2026",
    mapel: "Akhlak",
    kelas: "Tsanawiyah 1",
    deadline: "05 Feb 2026",
    deadlineNote: "Selesai",
    submissions: "31 / 31",
    badge: { variant: "neutral", label: "Selesai" },
    action: {
      kind: "export",
      message: "Feedback tugas siap diekspor.",
      ariaLabel: "Export feedback",
    },
  },
];

export default function GuruTugasPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Materi dan evaluasi"
        title="Tugas & submission"
        description="Buat tugas, pantau pengumpulan, dan berikan feedback kepada santri."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Daftar submission siap diekspor."
            >
              <Icon name="download" />
              Export
            </ToastButton>
            <Link className="button button-primary" href="/guru/tugas/baru">
              <Icon name="plus" />
              Tugas baru
            </Link>
          </>
        }
      />

      <MetricGrid items={METRICS} />

      <Panel
        title="Daftar tugas dibuat"
        subtitle="Tugas yang terlihat oleh kelas yang diampu"
        actions={
          <div className="toolbar-right">
            <select className="select-control">
              <option>Semua status</option>
              <option>Aktif</option>
              <option>Selesai</option>
            </select>
            <select className="select-control">
              <option>Semua mapel</option>
              <option>Tahfidz Qur&apos;an</option>
              <option>Akhlak</option>
            </select>
          </div>
        }
      >
        <TaskTable tasks={TASKS} total={12} />
      </Panel>

      <PageFooter />
    </>
  );
}
