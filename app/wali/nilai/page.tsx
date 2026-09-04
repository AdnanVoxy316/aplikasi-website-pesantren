import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = {
  title: "Nilai Anak",
  description: "Lihat nilai Aisyah Fitria pada semester berjalan secara read-only.",
};

type Grade = {
  subject: string;
  category: string;
  teacher: string;
  components: string;
  score: string;
  mid: boolean;
  predicate: string;
};

const GRADES: Grade[] = [
  {
    subject: "Tahfidz Qur'an",
    category: "Pesantren",
    teacher: "Ustz. Nisa Karimah",
    components: "Hafalan 94 · Tugas 92",
    score: "94",
    mid: false,
    predicate: "Mumtaz",
  },
  {
    subject: "Akhlak",
    category: "Pesantren",
    teacher: "Ust. Hadi Santoso",
    components: "Tugas 88 · Ujian 87",
    score: "88",
    mid: false,
    predicate: "Jayyid",
  },
  {
    subject: "Matematika",
    category: "Umum",
    teacher: "Ust. Farid Maulana",
    components: "Tugas 86 · Ujian 82",
    score: "84",
    mid: true,
    predicate: "Jayyid",
  },
  {
    subject: "Bahasa Arab",
    category: "Pesantren",
    teacher: "Ustz. Salma Rahmi",
    components: "Tugas 89 · Ujian 87",
    score: "88",
    mid: false,
    predicate: "Jayyid",
  },
];

export default function WaliNilaiPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Perkembangan akademik"
        title="Nilai anak"
        description="Lihat nilai Aisyah Fitria pada semester berjalan secara read-only."
        actions={
          <>
            <select className="select-control">
              <option>Aisyah Fitria</option>
              <option>Maya Salsabila</option>
            </select>
            <select className="select-control">
              <option>Semester Ganjil 2026/2027</option>
              <option>Semester Genap 2025/2026</option>
            </select>
          </>
        }
      />

      <section className="child-switcher">
        <span className="avatar-sm gold">AF</span>
        <div className="child-switcher-copy">
          <span className="child-switcher-name">Aisyah Fitria</span>
          <span className="child-switcher-meta">NIS 20260124 · Ibtida A · Anak terhubung</span>
        </div>
        <span className="status-badge success">Read-only</span>
      </section>

      <div className="content-grid" style={{ marginTop: "15px" }}>
        <Panel
          title="Ringkasan nilai"
          subtitle="Rata-rata gabungan semester ganjil"
          bodyClassName="panel-body"
        >
          <div className="score-overview">
            <div className="score-ring">
              <strong>88,4</strong>
            </div>
            <div>
              <div className="score-overview-title">Predikat sangat baik</div>
              <div className="score-overview-text">Nilai terakhir diperbarui oleh guru pengampu.</div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Perbandingan kategori"
          subtitle="Pesantren dan umum"
          bodyClassName="panel-body"
        >
          <div className="progress-row">
            <span>Mapel pesantren</span>
            <strong>90,1</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "90%" }} />
          </div>
          <div className="progress-row" style={{ marginTop: "15px" }}>
            <span>Mapel umum</span>
            <strong>85,7</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "86%" }} />
          </div>
        </Panel>
      </div>

      <Panel
        title="Nilai per mata pelajaran"
        subtitle="Data hanya dapat diubah oleh guru yang ditugaskan"
        actions={
          <Link className="text-link" href="/wali/rapor">
            Lihat rapor <Icon name="chevron-right" />
          </Link>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mapel</th>
                <th>Guru</th>
                <th>Komponen nilai</th>
                <th>Nilai akhir</th>
                <th>Predikat</th>
              </tr>
            </thead>
            <tbody>
              {GRADES.map((grade) => (
                <tr key={grade.subject}>
                  <td>
                    <strong>{grade.subject}</strong>
                    <span className="person-meta">{grade.category}</span>
                  </td>
                  <td>{grade.teacher}</td>
                  <td>{grade.components}</td>
                  <td>
                    <span className={grade.mid ? "grade-score mid" : "grade-score"}>{grade.score}</span>
                  </td>
                  <td>{grade.predicate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <footer className="footer">
        <span className="footer-brand">
          <Icon name="mosque" />
          ELMS Pesantren · Prototype HTML
        </span>
        <span className="footer-note">Wali santri memiliki akses baca saja</span>
      </footer>
    </>
  );
}
