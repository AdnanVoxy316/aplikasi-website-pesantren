import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { DemoForm } from "@/components/demo-form";

export const metadata: Metadata = {
  title: "Buat Tugas",
  description:
    "Tugas akan langsung terlihat oleh santri pada kelas tujuan setelah diterbitkan.",
};

const STEPS = [
  {
    number: <Icon name="check" />,
    complete: true,
    title: "Pilih kelas dan mapel",
    description: "Santri hanya melihat tugas dari kelasnya.",
  },
  {
    number: "2",
    complete: false,
    title: "Tetapkan deadline",
    description: "Submission setelah batas waktu ditandai terlambat.",
  },
  {
    number: "3",
    complete: false,
    title: "Berikan feedback",
    description: "Nilai dan catatan dapat diberikan di halaman submission.",
  },
];

export default function GuruTugasBaruPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Kegiatan mengajar"
        title="Buat tugas baru"
        description="Tugas akan langsung terlihat oleh santri pada kelas tujuan setelah diterbitkan."
        actions={
          <Link className="button button-secondary" href="/guru/tugas">
            <Icon name="arrow-left" />
            Kembali ke tugas
          </Link>
        }
      />

      <div className="form-layout">
        <Panel>
          <div className="form-card">
            <h2 className="form-card-title">Detail tugas</h2>
            <p className="form-card-description">
              Isi informasi dengan jelas agar santri memahami instruksi dan batas waktu.
            </p>
            <DemoForm
              success="Tugas berhasil diterbitkan ke kelas tujuan."
              actions={
                <>
                  <Link className="button button-secondary" href="/guru/tugas">
                    Simpan sebagai draft
                  </Link>
                  <button className="button button-primary" type="submit">
                    Terbitkan tugas
                  </button>
                </>
              }
            >
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="taskTitle">Judul tugas</label>
                  <input
                    id="taskTitle"
                    placeholder="Contoh: Setoran hafalan surat pendek"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="taskSubject">Mata pelajaran</label>
                  <select id="taskSubject" required>
                    <option value="">Pilih mapel</option>
                    <option>Tahfidz Qur&apos;an</option>
                    <option>Akhlak</option>
                    <option>Kitab Kuning</option>
                    <option>Bahasa Arab</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="taskClass">Kelas tujuan</label>
                  <select id="taskClass" required>
                    <option value="">Pilih kelas</option>
                    <option>Ibtida A</option>
                    <option>Tsanawiyah 1</option>
                    <option>Ulya A</option>
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="taskDescription">Instruksi tugas</label>
                  <textarea id="taskDescription" placeholder="Jelaskan tujuan, langkah pengerjaan, dan kriteria penilaian..." />
                </div>
                <div className="field">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    id="deadline"
                    type="datetime-local"
                    defaultValue="2026-02-12T23:59"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="scoreType">Jenis penilaian</label>
                  <select id="scoreType">
                    <option>Tugas</option>
                    <option>Hafalan</option>
                    <option>Proyek</option>
                    <option>Ujian</option>
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="attachment">
                    Lampiran <span className="optional">(opsional)</span>
                  </label>
                  <input id="attachment" type="file" />
                  <small>Format yang didukung: .pdf, .doc, .docx, .jpg, .png.</small>
                </div>
              </div>
            </DemoForm>
          </div>
        </Panel>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Sebelum menerbitkan</h2>
              <p className="panel-subtitle">Checklist tugas yang baik</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="step-list">
              {STEPS.map((step) => (
                <div className={step.complete ? "step-item complete" : "step-item"} key={step.title}>
                  <span className="step-number">{step.number}</span>
                  <div>
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="notice" style={{ marginTop: 17 }}>
              <Icon name="shield" />
              <div>
                <strong>Data aman</strong>Hanya santri pada kelas tujuan yang dapat mengakses tugas ini.
              </div>
            </div>
          </div>
        </aside>
      </div>

      <PageFooter />
    </>
  );
}
