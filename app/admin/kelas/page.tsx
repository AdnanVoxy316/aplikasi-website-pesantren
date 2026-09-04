import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Kelas",
  description:
    "Bentuk struktur belajar pesantren sesuai tingkat, kelas, dan kekhasan mapel.",
};

const COURSES = [
  { name: "Ibtida A", meta: "28 santri · Wali: Ust. Hadi" },
  { name: "Tsanawiyah 1", meta: "31 santri · Wali: Ustz. Nisa" },
  { name: "Ulya B", meta: "30 santri · Wali: Ust. Farid" },
];

const POPULAR_SUBJECTS = [
  { label: "Tahfidz Qur'an", value: "18 kelas", width: 100 },
  { label: "Akhlak", value: "16 kelas", width: 88 },
  { label: "Bahasa Arab", value: "14 kelas", width: 78 },
  { label: "Matematika", value: "12 kelas", width: 67 },
];

type ClassRow = {
  name: string;
  level: string;
  homeroom: string;
  students: string;
  subjects: string;
};

const CLASSES: ClassRow[] = [
  {
    name: "Ibtida A",
    level: "Ibtida",
    homeroom: "Ust. Hadi Santoso",
    students: "28 santri",
    subjects: "12 mapel",
  },
  {
    name: "Ibtida B",
    level: "Ibtida",
    homeroom: "Ustz. Salma Rahmi",
    students: "27 santri",
    subjects: "12 mapel",
  },
  {
    name: "Tsanawiyah 1",
    level: "Tsanawiyah",
    homeroom: "Ustz. Nisa Karimah",
    students: "31 santri",
    subjects: "15 mapel",
  },
  {
    name: "Ulya B",
    level: "Ulya",
    homeroom: "Ust. Farid Maulana",
    students: "30 santri",
    subjects: "16 mapel",
  },
];

export default function AdminKelasPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Struktur akademik"
        title="Kelas & mapel"
        description="Bentuk struktur belajar pesantren sesuai tingkat, kelas, dan kekhasan mapel."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Form mapel baru siap digunakan."
            >
              <Icon name="plus" />
              Tambah mapel
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Form kelas baru siap digunakan."
            >
              <Icon name="plus" />
              Tambah kelas
            </ToastButton>
          </>
        }
      />
      <div className="summary-banner">
        <div>
          <div className="summary-banner-title">Tahun Ajaran 2026 / 2027</div>
          <div className="summary-banner-text">
            Semester Ganjil · Struktur akademik sedang aktif
          </div>
        </div>
        <ToastButton
          className="button button-secondary"
          message="Pengaturan tahun ajaran siap dibuka."
        >
          <Icon name="settings" />
          Atur tahun ajaran
        </ToastButton>
      </div>
      <div className="content-grid equal" style={{ marginTop: 15 }}>
        <Panel
          title="Kelas aktif"
          subtitle="18 kelas dengan 486 santri"
          actions={
            <ToastButton
              className="text-link"
              message="Daftar semua kelas siap dibuka."
            >
              Kelola kelas <Icon name="chevron-right" />
            </ToastButton>
          }
          bodyClassName="panel-body"
        >
          <div className="course-grid">
            {COURSES.map((course) => (
              <article className="course-card" key={course.name}>
                <div className="course-card-top">
                  <span className="course-icon">
                    <Icon name="book" />
                  </span>
                  <StatusBadge variant="success">Aktif</StatusBadge>
                </div>
                <div className="course-name">{course.name}</div>
                <div className="course-meta">{course.meta}</div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel
          title="Mapel terpopuler"
          subtitle="Mapel yang digunakan lintas kelas"
          actions={
            <Link href="/admin/mapel" className="text-link">
              Kelola mapel <Icon name="chevron-right" />
            </Link>
          }
          bodyClassName="panel-body"
        >
          {POPULAR_SUBJECTS.map((subject, index) => (
            <div key={subject.label}>
              <div
                className="progress-row"
                style={index > 0 ? { marginTop: 15 } : undefined}
              >
                <span>{subject.label}</span>
                <strong>{subject.value}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${subject.width}%` }}
                />
              </div>
            </div>
          ))}
        </Panel>
      </div>
      <Panel
        title="Daftar kelas dan wali kelas"
        subtitle="Atur tingkat, wali kelas, dan jumlah santri"
        actions={
          <div className="toolbar-right">
            <select className="select-control" aria-label="Filter tingkat">
              <option>Semua tingkat</option>
              <option>Ibtida</option>
              <option>Tsanawiyah</option>
              <option>Ulya</option>
            </select>
          </div>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama kelas</th>
                <th>Tingkat</th>
                <th>Wali kelas</th>
                <th>Santri</th>
                <th>Mapel</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((row) => (
                <tr key={row.name}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.level}</td>
                  <td>{row.homeroom}</td>
                  <td>{row.students}</td>
                  <td>{row.subjects}</td>
                  <td>
                    <StatusBadge variant="success">Aktif</StatusBadge>
                  </td>
                  <td>
                    <div className="table-actions">
                      <ToastButton
                        className="table-action"
                        message={`Detail kelas ${row.name} siap dibuka.`}
                        ariaLabel="Lihat kelas"
                      >
                        <Icon name="eye" />
                      </ToastButton>
                      <ToastButton
                        className="table-action"
                        message="Form edit kelas siap dibuka."
                        ariaLabel="Edit kelas"
                      >
                        <Icon name="edit" />
                      </ToastButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Menampilkan 4 dari 18 kelas</span>
          <div className="pagination-buttons">
            <ToastButton
              className="pagination-button active"
              message="Halaman 1 daftar kelas siap dibuka."
            >
              1
            </ToastButton>
            <ToastButton
              className="pagination-button"
              message="Halaman 2 daftar kelas siap dibuka."
            >
              2
            </ToastButton>
            <ToastButton
              className="pagination-button"
              message="Halaman berikutnya siap dibuka."
              ariaLabel="Halaman berikutnya"
            >
              <Icon name="chevron-right" />
            </ToastButton>
          </div>
        </div>
      </Panel>
      <PageFooter />
    </>
  );
}
