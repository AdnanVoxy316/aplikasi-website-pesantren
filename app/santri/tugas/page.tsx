import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { PageFooter } from "@/components/ui/panel";
import { SantriTaskTable } from "./santri-task-table";
import { santriTasks } from "./tasks";

export const metadata: Metadata = {
  title: "Tugas Saya",
  description:
    "Lihat deadline, status pengumpulan, dan feedback dari guru untuk seluruh tugas di kelas Ibtida A.",
};

const METRICS = [
  {
    icon: "clock" as const,
    tone: "coral",
    label: "Belum dikumpulkan",
    value: "4",
    note: "Perlu diselesaikan",
  },
  {
    icon: "upload" as const,
    tone: "gold",
    label: "Sudah dikumpulkan",
    value: "8",
    note: "Menunggu penilaian",
  },
  {
    icon: "check-circle" as const,
    tone: "",
    label: "Sudah dinilai",
    value: "15",
    note: "Feedback tersedia",
  },
  {
    icon: "clipboard" as const,
    tone: "blue",
    label: "Total semester ini",
    value: "27",
    note: "Dari semua mapel",
  },
];

export default function SantriTugasPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Daftar aktivitas"
        title="Tugas saya"
        description="Lihat deadline, status pengumpulan, dan feedback dari guru."
        actions={<RoleChip icon="book">Ibtida A</RoleChip>}
      />

      <section className="metric-grid" aria-label="Ringkasan tugas">
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

      <SantriTaskTable tasks={santriTasks} />

      <PageFooter />
    </>
  );
}
