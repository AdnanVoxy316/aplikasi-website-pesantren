import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { ToastButton } from "@/components/toast-button";
import {
  SubjectsTable,
  type SubjectRow,
} from "@/app/admin/mapel/subjects-table";

export const metadata: Metadata = {
  title: "Mapel",
  description:
    "Atur mapel umum dan pesantren beserta kategori serta bobot penilaiannya.",
};

const SUBJECTS: SubjectRow[] = [
  {
    id: "p-tfz",
    code: "P-TFZ",
    icon: "book",
    name: "Tahfidz Qur'an",
    filterText: "Tahfidz Quran tahfidz hafalan",
    category: { variant: "warning", label: "Pesantren" },
    description: "Hafalan dan murojaah",
    weight: "Hafalan 40%",
    classes: "18 kelas",
    status: "Aktif",
  },
  {
    id: "p-ktb",
    code: "P-KTB",
    icon: "file",
    name: "Kitab Kuning",
    filterText: "Kitab Kuning kitab ta lim",
    category: { variant: "warning", label: "Pesantren" },
    description: "Studi kitab dan pemahaman",
    weight: "Tugas 30%",
    classes: "14 kelas",
    status: "Aktif",
  },
  {
    id: "u-mtk",
    code: "U-MTK",
    icon: "chart",
    name: "Matematika",
    filterText: "Matematika matematika umum",
    category: { variant: "neutral", label: "Umum" },
    description: "Matematika dasar dan lanjutan",
    weight: "UAS 40%",
    classes: "12 kelas",
    status: "Aktif",
  },
  {
    id: "p-akh",
    code: "P-AKH",
    icon: "book",
    name: "Akhlak",
    filterText: "Akhlak adab karakter",
    category: { variant: "warning", label: "Pesantren" },
    description: "Pembiasaan adab dan karakter",
    weight: "Tugas 50%",
    classes: "16 kelas",
    status: "Aktif",
  },
];

export default function AdminMapelPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Kurikulum pesantren"
        title="Mata pelajaran"
        description="Atur mapel umum dan pesantren beserta kategori serta bobot penilaiannya."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Filter mapel siap digunakan."
            >
              <Icon name="filter" />
              Filter
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Form mapel baru siap digunakan."
            >
              <Icon name="plus" />
              Tambah mapel
            </ToastButton>
          </>
        }
      />
      <section className="metric-grid">
        <MetricCard
          icon="book"
          label="Total mapel"
          value="27"
          note="18 pesantren · 9 umum"
        />
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="sparkle" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Mapel pesantren</span>
            <strong className="metric-value">18</strong>
            <span className="metric-note">Tahfidz, kitab, akhlak</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="chart" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Mapel umum</span>
            <strong className="metric-value">9</strong>
            <span className="metric-note">Akademik dasar</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="users" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Guru pengampu</span>
            <strong className="metric-value">32</strong>
            <span className="metric-note">Penugasan terdata</span>
          </div>
        </article>
      </section>
      <SubjectsTable subjects={SUBJECTS} />
      <PageFooter />
    </>
  );
}
