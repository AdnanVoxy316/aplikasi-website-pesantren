import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import {
  AssignmentsTable,
  type AssignmentRow,
} from "@/app/admin/penugasan-guru/assignments-table";

export const metadata: Metadata = {
  title: "Penugasan Guru",
  description:
    "Hubungkan guru dengan kelas dan mapel yang menjadi tanggung jawabnya.",
};

const ASSIGNMENTS: AssignmentRow[] = [
  {
    id: "nur-ibtida",
    initials: "NK",
    tone: "blue",
    name: "Nur Kholis",
    meta: "NIP 19870214 001",
    className: "Ibtida A",
    subject: "Tahfidz Qur'an",
    meetings: "2x / pekan",
  },
  {
    id: "siti-tsanawiyah",
    initials: "SN",
    tone: "gold",
    name: "Siti Nurbaya",
    meta: "NIP 19910608 014",
    className: "Tsanawiyah 1",
    subject: "Akhlak",
    meetings: "1x / pekan",
  },
  {
    id: "farid-ulya",
    initials: "FM",
    name: "Farid Maulana",
    meta: "NIP 19881022 009",
    className: "Ulya B",
    subject: "Matematika",
    meetings: "3x / pekan",
  },
];

export default function AdminPenugasanGuruPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Distribusi mengajar"
        title="Penugasan guru"
        description="Hubungkan guru dengan kelas dan mapel yang menjadi tanggung jawabnya."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Template penugasan siap diunduh."
            >
              <Icon name="download" />
              Export
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Penugasan guru berhasil ditambahkan."
            >
              <Icon name="plus" />
              Tambah penugasan
            </ToastButton>
          </>
        }
      />
      <div className="content-grid">
        <Panel
          title="Penugasan aktif"
          subtitle="Kombinasi guru, kelas, dan mapel semester ini"
        >
          <AssignmentsTable assignments={ASSIGNMENTS} />
        </Panel>
        <aside className="panel">
          <div className="form-card">
            <h2 className="form-card-title">Tambah penugasan</h2>
            <p className="form-card-description">
              Pilih guru, kelas, dan mapel yang akan diampu.
            </p>
            <DemoForm
              success="Penugasan guru berhasil disimpan."
              actions={
                <>
                  <button className="button button-secondary" type="reset">
                    Reset
                  </button>
                  <button className="button button-primary" type="submit">
                    Simpan penugasan
                  </button>
                </>
              }
            >
              <div className="form-grid single">
                <div className="field">
                  <label htmlFor="teacher">Guru pengampu</label>
                  <select id="teacher" required defaultValue="">
                    <option value="">Pilih guru</option>
                    <option>Nur Kholis</option>
                    <option>Siti Nurbaya</option>
                    <option>Farid Maulana</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="class">Kelas</label>
                  <select id="class" required defaultValue="">
                    <option value="">Pilih kelas</option>
                    <option>Ibtida A</option>
                    <option>Tsanawiyah 1</option>
                    <option>Ulya B</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="subject">Mata pelajaran</label>
                  <select id="subject" required defaultValue="">
                    <option value="">Pilih mapel</option>
                    <option>Tahfidz Qur&apos;an</option>
                    <option>Akhlak</option>
                    <option>Matematika</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="meeting">Pertemuan per pekan</label>
                  <select id="meeting">
                    <option>1 kali</option>
                    <option>2 kali</option>
                    <option>3 kali</option>
                  </select>
                </div>
              </div>
            </DemoForm>
          </div>
        </aside>
      </div>
      <PageFooter />
    </>
  );
}
