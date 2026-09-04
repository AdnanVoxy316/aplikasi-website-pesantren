import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { GradeTable, type GradeRow } from "@/app/guru/nilai/grade-table";

export const metadata: Metadata = {
  title: "Input Nilai",
  description: "Masukkan nilai santri per kelas, mapel, dan jenis penilaian.",
};

const GRADES: GradeRow[] = [
  {
    id: "g1",
    no: "01",
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    nis: "NIS 20260124",
    score: "94",
    predikat: "Mumtaz",
    note: "Lancar dan tartil",
    updated: "09 Feb, 08:10",
  },
  {
    id: "g2",
    no: "02",
    initials: "FR",
    tone: "blue",
    name: "Fauzan Ramadhan",
    nis: "NIS 20260132",
    score: "88",
    predikat: "Jayyid",
    note: "Perlu murojaah surat pendek",
    updated: "08 Feb, 16:42",
  },
  {
    id: "g3",
    no: "03",
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    nis: "NIS 20260147",
    score: "79",
    predikat: "Jayyid",
    predikatTone: "mid",
    note: "Tambah jadwal setoran",
    updated: "07 Feb, 14:03",
  },
  {
    id: "g4",
    no: "04",
    initials: "IA",
    name: "Ilham Akbar",
    nis: "NIS 20260151",
    score: "91",
    predikat: "Mumtaz",
    note: "Pertahankan konsistensi",
    updated: "07 Feb, 13:20",
  },
];

export default function GuruNilaiPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Penilaian akademik"
        title="Input nilai"
        description="Masukkan nilai santri per kelas, mapel, dan jenis penilaian."
        actions={
          <>
            <ToastButton className="button button-secondary" message="Template nilai siap diunduh.">
              <Icon name="download" />
              Export
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Nilai berhasil disimpan pada prototype."
            >
              <Icon name="check" />
              Simpan nilai
            </ToastButton>
          </>
        }
      />

      <div className="notice" style={{ marginBottom: 15 }}>
        <Icon name="shield" />
        <div>
          <strong>
            Ruang lingkup akses
          </strong>
          Anda melihat kelas dan mapel yang ditugaskan: Ibtida A · Tahfidz Qur&apos;an.
        </div>
      </div>

      <Panel
        title="Nilai Tahfidz Qur'an"
        subtitle="Ibtida A · Semester Ganjil · 28 santri"
        actions={
          <div className="toolbar-right">
            <select className="select-control">
              <option>Ibtida A</option>
              <option>Tsanawiyah 1</option>
              <option>Ulya A</option>
            </select>
            <select className="select-control">
              <option>Tahfidz Qur&apos;an</option>
              <option>Akhlak</option>
              <option>Bahasa Arab</option>
            </select>
            <select className="select-control">
              <option>Hafalan</option>
              <option>Tugas</option>
              <option>Ujian</option>
            </select>
          </div>
        }
      >
        <GradeTable rows={GRADES} />
        <div className="pagination">
          <span>Menampilkan 4 dari 28 santri</span>
          <div className="pagination-buttons">
            <button className="pagination-button active" type="button">
              1
            </button>
            <button className="pagination-button" type="button">
              2
            </button>
            <button className="pagination-button" type="button">
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>
      </Panel>

      <PageFooter />
    </>
  );
}
