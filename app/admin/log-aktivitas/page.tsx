import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import {
  ActivityLogList,
  type ActivityEntry,
} from "@/app/admin/log-aktivitas/activity-log-list";

export const metadata: Metadata = {
  title: "Log Aktivitas",
  description:
    "Jejak perubahan data sensitif untuk menjaga transparansi dan keamanan operasional.",
};

const ACTIVITIES: ActivityEntry[] = [
  {
    id: "nilai-aisyah",
    action: "Ahmad Fauzi memperbarui nilai Aisyah Fitria",
    filterText: "Ahmad Fauzi update nilai Aisyah Fitria",
    meta: "Entitas: nilai · NIS 20260124 · Nilai Tahfidz 92 menjadi 94",
    date: "5 menit lalu",
  },
  {
    id: "tugas-hafalan",
    action: "Nur Kholis membuat tugas baru",
    filterText: "Nur Kholis membuat tugas hafalan",
    meta: "Entitas: tugas · Setoran hafalan Juz Amma · Ibtida A",
    date: "32 menit lalu",
  },
  {
    id: "mayar-inv",
    action: "Webhook Mayar memperbarui pembayaran",
    filterText: "Mayar pembayaran INV 0206",
    meta: "Entitas: pembayaran_spp · #INV-0206 · Status paid",
    date: "1 jam lalu",
  },
  {
    id: "akun-maya",
    action: "Ahmad Fauzi menonaktifkan akun",
    filterText: "Ahmad Fauzi menonaktifkan akun",
    meta: "Entitas: user · Maya Salsabila · Menunggu verifikasi",
    date: "Kemarin",
  },
  {
    id: "kehadiran-tsn",
    action: "Siti Nurbaya mencatat kehadiran kelas",
    filterText: "Siti Nurbaya input kehadiran",
    meta: "Entitas: kehadiran · Tsanawiyah 1 · 31 santri",
    date: "Kemarin",
  },
];

const RETENTION = [
  { label: "Perubahan nilai", value: "438" },
  { label: "Aksi pembayaran", value: "386" },
  { label: "Perubahan akun", value: "217" },
];

export default function AdminLogAktivitasPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Akuntabilitas sistem"
        title="Log aktivitas"
        description="Jejak perubahan data sensitif untuk menjaga transparansi dan keamanan operasional."
        actions={
          <ToastButton
            className="button button-secondary"
            message="Log aktivitas siap diekspor."
          >
            <Icon name="download" />
            Export log
          </ToastButton>
        }
      />
      <div className="content-grid">
        <Panel
          title="Aktivitas terbaru"
          subtitle="Semua perubahan penting dicatat otomatis"
          actions={
            <span className="role-chip">
              <Icon name="shield" />
              Audit aktif
            </span>
          }
        >
          <ActivityLogList activities={ACTIVITIES} />
        </Panel>
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Retensi log</h2>
              <p className="panel-subtitle">Ringkasan keamanan data</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="progress-row">
              <span>Log tersimpan</span>
              <strong>1.284</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "72%" }} />
            </div>
            {RETENTION.map((item) => (
              <div
                className="progress-row"
                key={item.label}
                style={{ marginTop: 17 }}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
            <div className="notice" style={{ marginTop: 19 }}>
              <Icon name="shield" />
              <div>
                <strong>Audit trail wajib</strong>
                Setiap aksi administratif sensitif menyimpan waktu, pengguna,
                dan entitas yang berubah.
              </div>
            </div>
          </div>
        </aside>
      </div>
      <PageFooter />
    </>
  );
}
