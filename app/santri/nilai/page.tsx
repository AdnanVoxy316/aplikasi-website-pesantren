import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Nilai Saya",
  description:
    "Lihat nilai per mapel dan feedback guru pada semester berjalan di kelas Ibtida A.",
};

const LEGEND = [
  { name: "Mumtaz", range: "90 - 100", score: "A", tone: "" },
  { name: "Jayyid", range: "75 - 89", score: "B", tone: "mid" },
  { name: "Perlu bimbingan", range: "Di bawah 75", score: "C", tone: "low" },
];

const SUBJECTS = [
  {
    subject: "Tahfidz Qur'an",
    category: "Pesantren",
    teacher: "Ustz. Nisa Karimah",
    assignment: "92",
    exam: "96",
    score: "94",
    scoreTone: "",
  },
  {
    subject: "Akhlak",
    category: "Pesantren",
    teacher: "Ust. Hadi Santoso",
    assignment: "88",
    exam: "87",
    score: "88",
    scoreTone: "",
  },
  {
    subject: "Matematika",
    category: "Umum",
    teacher: "Ust. Farid Maulana",
    assignment: "86",
    exam: "82",
    score: "84",
    scoreTone: "mid",
  },
  {
    subject: "Bahasa Arab",
    category: "Pesantren",
    teacher: "Ustz. Salma Rahmi",
    assignment: "89",
    exam: "87",
    score: "88",
    scoreTone: "",
  },
];

export default function SantriNilaiPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Perkembangan akademik"
        title="Nilai saya"
        description="Lihat nilai per mapel dan feedback guru pada semester berjalan."
        actions={
          <select className="select-control" aria-label="Pilih semester">
            <option>Semester Ganjil 2026/2027</option>
            <option>Semester Genap 2025/2026</option>
          </select>
        }
      />

      <div className="content-grid">
        <Panel
          title="Ringkasan nilai"
          subtitle="Rata-rata gabungan semua mapel"
          bodyClassName="panel-body"
        >
          <div className="score-overview">
            <div className="score-ring">
              <strong>88,4</strong>
            </div>
            <div>
              <div className="score-overview-title">Predikat sangat baik</div>
              <div className="score-overview-text">
                Nilai meningkat 3,2 poin sejak penilaian terakhir.
              </div>
            </div>
          </div>
          <div className="progress-row" style={{ marginTop: 18 }}>
            <span>Mapel pesantren</span>
            <strong>90,1</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "90%" }} />
          </div>
          <div className="progress-row" style={{ marginTop: 14 }}>
            <span>Mapel umum</span>
            <strong>85,7</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill blue" style={{ width: "86%" }} />
          </div>
        </Panel>

        <Panel
          title="Legenda predikat"
          subtitle="Skala penilaian pesantren"
          bodyClassName="panel-body"
        >
          <div className="setting-list">
            {LEGEND.map((item) => (
              <div className="setting-row" key={item.name}>
                <div>
                  <div className="setting-name">{item.name}</div>
                  <div className="setting-description">{item.range}</div>
                </div>
                <span
                  className={item.tone ? `grade-score ${item.tone}` : "grade-score"}
                >
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Nilai per mata pelajaran"
        subtitle="Semester Ganjil 2026 / 2027"
        actions={
          <Link className="text-link" href="/santri/rapor">
            Lihat rapor <Icon name="chevron-right" />
          </Link>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mata pelajaran</th>
                <th>Guru</th>
                <th>Tugas</th>
                <th>Ujian</th>
                <th>Nilai akhir</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((row) => (
                <tr key={row.subject}>
                  <td>
                    <strong>{row.subject}</strong>
                    <span className="person-meta">{row.category}</span>
                  </td>
                  <td>{row.teacher}</td>
                  <td>{row.assignment}</td>
                  <td>{row.exam}</td>
                  <td>
                    <span
                      className={
                        row.scoreTone
                          ? `grade-score ${row.scoreTone}`
                          : "grade-score"
                      }
                    >
                      {row.score}
                    </span>
                  </td>
                  <td>
                    <ToastButton
                      className="table-action"
                      message={`Feedback ${row.subject} tersedia.`}
                      ariaLabel="Lihat feedback"
                    >
                      <Icon name="eye" />
                    </ToastButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <PageFooter />
    </>
  );
}
