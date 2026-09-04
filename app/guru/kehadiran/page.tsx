import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { AttendanceExplorer } from "@/components/attendance-explorer";
import { MetricGrid } from "@/app/guru/metric-grid";
import {
  AttendancePanel,
  type AttendanceRow,
} from "@/app/guru/kehadiran/attendance-panel";

export const metadata: Metadata = {
  title: "Kehadiran",
  description: "Catat hadir, izin, sakit, atau alpa untuk kelas yang Anda ampu.",
};

const METRICS = [
  { icon: "check-circle", label: "Hadir hari ini", value: "112", note: "Dari 118 santri" },
  { icon: "clock", tone: "gold" as const, label: "Izin / sakit", value: "4", note: "Perlu bukti bila diperlukan" },
  { icon: "alert", tone: "coral" as const, label: "Alpa", value: "2", note: "Perlu tindak lanjut wali" },
  { icon: "chart", tone: "blue" as const, label: "Rata-rata pekan ini", value: "94,8%", note: "Naik 2,6% dari pekan lalu" },
];

const PRESENCE: AttendanceRow[] = [
  {
    id: "a1",
    no: "01",
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    nis: "NIS 20260124",
    status: "present",
    recap: "Hadir 24 · Alpa 0",
    choices: [
      { value: "present", label: "Hadir", className: "present" },
      { value: "permit", label: "Izin" },
      { value: "sick", label: "Sakit" },
      { value: "absent", label: "Alpa" },
    ],
  },
  {
    id: "a2",
    no: "02",
    initials: "FR",
    tone: "blue",
    name: "Fauzan Ramadhan",
    nis: "NIS 20260132",
    status: "present",
    recap: "Hadir 22 · Alpa 1",
    choices: [
      { value: "present", label: "Hadir", className: "present" },
      { value: "permit", label: "Izin" },
      { value: "sick", label: "Sakit" },
      { value: "absent", label: "Alpa" },
    ],
  },
  {
    id: "a3",
    no: "03",
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    nis: "NIS 20260147",
    status: "sick",
    note: "Surat izin diterima",
    recap: "Hadir 21 · Sakit 1",
    choices: [
      { value: "present", label: "Hadir", className: "present" },
      { value: "permit", label: "Izin" },
      { value: "sick", label: "Sakit", className: "sick" },
      { value: "absent", label: "Alpa" },
    ],
  },
];

export default function GuruKehadiranPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Presensi pertemuan"
        title="Kehadiran santri"
        description="Catat hadir, izin, sakit, atau alpa untuk kelas yang Anda ampu."
        actions={
          <>
            <ToastButton className="button button-secondary" message="Rekap kehadiran siap diekspor.">
              <Icon name="download" />
              Export rekap
            </ToastButton>
            <ToastButton className="button button-primary" message="Presensi berhasil disimpan.">
              <Icon name="check" />
              Simpan presensi
            </ToastButton>
          </>
        }
      />

      <MetricGrid items={METRICS} />

      <AttendanceExplorer variant="teacher" />

      <AttendancePanel rows={PRESENCE} />

      <PageFooter />
    </>
  );
}
