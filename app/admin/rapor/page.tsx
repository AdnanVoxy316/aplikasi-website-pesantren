import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { ToastButton } from "@/components/toast-button";
import { ReportsTable, type ReportRow } from "@/app/admin/rapor/reports-table";

export const metadata: Metadata = {
  title: "Rapor",
  description:
    "Generate dan pantau snapshot nilai serta kehadiran seluruh santri.",
};

const REPORTS: ReportRow[] = [
  {
    id: "aisyah",
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    filterText: "Aisyah Fitria 20260124",
    meta: "NIS 20260124",
    className: "Ibtida A",
    score: "88,4",
    attendance: "97,2%",
    published: "08 Feb 2026",
    status: { variant: "success", label: "Terbit" },
    action: {
      icon: "download",
      toast: "Rapor Aisyah Fitria siap diunduh.",
      ariaLabel: "Unduh rapor",
    },
  },
  {
    id: "fauzan",
    initials: "FR",
    tone: "blue",
    name: "Fauzan Ramadhan",
    filterText: "Fauzan Ramadhan 20260132",
    meta: "NIS 20260132",
    className: "Tsanawiyah 1",
    score: "84,8",
    attendance: "95,6%",
    published: "07 Feb 2026",
    status: { variant: "success", label: "Terbit" },
    action: {
      icon: "download",
      toast: "Rapor Fauzan Ramadhan siap diunduh.",
      ariaLabel: "Unduh rapor",
    },
  },
  {
    id: "maya",
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    filterText: "Maya Salsabila 20260147",
    meta: "NIS 20260147",
    className: "Tsanawiyah 1",
    score: "78,1",
    scoreMid: true,
    attendance: "91,3%",
    published: "Belum ada",
    status: { variant: "warning", label: "Menunggu" },
    action: {
      icon: "eye",
      toast: "Detail kelengkapan rapor siap dibuka.",
      ariaLabel: "Lihat detail",
    },
  },
  {
    id: "ilham",
    initials: "IA",
    name: "Ilham Akbar",
    filterText: "Ilham Akbar 20260151",
    meta: "NIS 20260151",
    className: "Ulya A",
    score: "90,2",
    attendance: "96,7%",
    published: "08 Feb 2026",
    status: { variant: "success", label: "Terbit" },
    action: {
      icon: "download",
      toast: "Rapor Ilham Akbar siap diunduh.",
      ariaLabel: "Unduh rapor",
    },
  },
];

export default function AdminRaporPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Rekap akademik"
        title="Rapor santri"
        description="Generate dan pantau snapshot nilai serta kehadiran seluruh santri."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Rapor terpilih siap diunduh."
            >
              <Icon name="download" />
              Download terpilih
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Proses generate rapor dimulai."
            >
              <Icon name="file" />
              Generate rapor
            </ToastButton>
          </>
        }
      />
      <section className="metric-grid">
        <MetricCard
          icon="check-circle"
          label="Sudah terbit"
          value="412"
          note="84,8% dari total santri"
        />
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="clock" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Menunggu generate</span>
            <strong className="metric-value">74</strong>
            <span className="metric-note">Perlu data nilai lengkap</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="book" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Kelas selesai</span>
            <strong className="metric-value">14 / 18</strong>
            <span className="metric-note">Wali kelas sudah review</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="alert" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Data belum lengkap</span>
            <strong className="metric-value">8</strong>
            <span className="metric-note">Perlu tindak lanjut guru</span>
          </div>
        </article>
      </section>
      <Panel
        title="Status rapor semester ganjil"
        subtitle="Snapshot nilai + kehadiran · Idempotency aktif"
        actions={
          <span className="role-chip">
            <Icon name="shield" />
            Data tersnapshot
          </span>
        }
      >
        <ReportsTable reports={REPORTS} />
      </Panel>
      <PageFooter />
    </>
  );
}
