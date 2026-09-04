import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";

export const metadata: Metadata = {
  title: "Submission Tugas",
  description:
    "Daftar submission santri untuk tugas Setoran hafalan Juz Amma pada kelas Ibtida A.",
};

type AvatarTone = "gold" | "blue" | "coral";

const SUBMISSIONS: {
  name: string;
  nis: string;
  initials: string;
  tone?: AvatarTone;
  sentAt: string;
  fileIcon: IconName;
  fileName: string;
  score: string;
  scoreTone?: "mid" | "low";
  badge: { variant: BadgeVariant; label: string };
  actionIcon: IconName;
  toast: string;
  actionLabel: string;
}[] = [
  {
    name: "Aisyah Fitria",
    nis: "NIS 20260124",
    initials: "AF",
    tone: "gold",
    sentAt: "09 Feb, 07:42",
    fileIcon: "file",
    fileName: "hafalan-aisyah.mp3",
    score: "-",
    badge: { variant: "warning", label: "Perlu dinilai" },
    actionIcon: "eye",
    toast: "Panel penilaian Aisyah Fitria siap dibuka.",
    actionLabel: "Nilai Aisyah Fitria",
  },
  {
    name: "Fauzan Ramadhan",
    nis: "NIS 20260132",
    initials: "FR",
    tone: "blue",
    sentAt: "08 Feb, 20:16",
    fileIcon: "link",
    fileName: "drive.google.com",
    score: "-",
    badge: { variant: "warning", label: "Perlu dinilai" },
    actionIcon: "eye",
    toast: "Panel penilaian Fauzan Ramadhan siap dibuka.",
    actionLabel: "Nilai Fauzan Ramadhan",
  },
  {
    name: "Maya Salsabila",
    nis: "NIS 20260147",
    initials: "MS",
    tone: "coral",
    sentAt: "08 Feb, 19:54",
    fileIcon: "file",
    fileName: "setoran-maya.pdf",
    score: "88",
    badge: { variant: "success", label: "Dinilai" },
    actionIcon: "edit",
    toast: "Feedback Maya Salsabila siap diedit.",
    actionLabel: "Edit penilaian Maya Salsabila",
  },
  {
    name: "Ilham Akbar",
    nis: "NIS 20260151",
    initials: "IA",
    sentAt: "13 Feb, 08:14",
    fileIcon: "file",
    fileName: "ilham.jpg",
    score: "-",
    scoreTone: "mid",
    badge: { variant: "danger", label: "Terlambat" },
    actionIcon: "eye",
    toast: "Kebijakan penilaian terlambat perlu ditinjau.",
    actionLabel: "Nilai Ilham Akbar",
  },
];

export default function GuruSubmissionPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Review tugas"
        title="Submission santri"
        description="Setoran hafalan Juz Amma · Tahfidz Qur'an · Ibtida A"
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Daftar submission siap diekspor."
            >
              <Icon name="download" />
              Export
            </ToastButton>
            <Link className="button button-primary" href="/guru/tugas">
              <Icon name="arrow-left" />
              Kembali ke tugas
            </Link>
          </>
        }
      />

      <section className="summary-banner">
        <div>
          <div className="summary-banner-title">Setoran hafalan Juz Amma</div>
          <div className="summary-banner-text">
            Deadline 12 Februari 2026, 23:59 · 18 dari 28 santri sudah mengumpulkan
          </div>
        </div>
        <StatusBadge variant="warning">12 perlu dinilai</StatusBadge>
      </section>

      <div className="content-grid" style={{ marginTop: 15 }}>
        <Panel
          title="Daftar submission"
          subtitle="Klik santri untuk melihat file atau link yang dikirim"
          actions={
            <div className="toolbar-right">
              <select className="select-control">
                <option>Semua status</option>
                <option>Perlu dinilai</option>
                <option>Dinilai</option>
                <option>Terlambat</option>
              </select>
            </div>
          }
        >
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Waktu kirim</th>
                  <th>File / link</th>
                  <th>Nilai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {SUBMISSIONS.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <div className="person-cell">
                        <span className={row.tone ? `avatar-sm ${row.tone}` : "avatar-sm"}>
                          {row.initials}
                        </span>
                        <div>
                          <span className="person-name">{row.name}</span>
                          <span className="person-meta">{row.nis}</span>
                        </div>
                      </div>
                    </td>
                    <td>{row.sentAt}</td>
                    <td>
                      <span className="file-type">
                        <Icon name={row.fileIcon} />
                        {row.fileName}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          row.scoreTone ? `grade-score ${row.scoreTone}` : "grade-score"
                        }
                      >
                        {row.score}
                      </span>
                    </td>
                    <td>
                      <StatusBadge variant={row.badge.variant}>{row.badge.label}</StatusBadge>
                    </td>
                    <td>
                      <ToastButton
                        className="table-action"
                        message={row.toast}
                        ariaLabel={row.actionLabel}
                      >
                        <Icon name={row.actionIcon} />
                      </ToastButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Menampilkan 4 dari 28 submission</span>
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

        <aside className="panel">
          <div className="form-card">
            <h2 className="form-card-title">Beri nilai & feedback</h2>
            <p className="form-card-description">
              Pilih submission dari daftar untuk mulai menilai.
            </p>
            <DemoForm
              success="Nilai dan feedback berhasil disimpan."
              actions={
                <>
                  <ToastButton
                    className="button button-secondary"
                    message="Submission dibuka pada preview file."
                  >
                    <Icon name="eye" />
                    Lihat file
                  </ToastButton>
                  <button className="button button-primary" type="submit">
                    Simpan penilaian
                  </button>
                </>
              }
            >
              <div className="form-grid single">
                <div className="field">
                  <label htmlFor="selectedStudent">Santri</label>
                  <select id="selectedStudent">
                    <option>Aisyah Fitria</option>
                    <option>Fauzan Ramadhan</option>
                    <option>Maya Salsabila</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="submissionScore">Nilai</label>
                  <input
                    id="submissionScore"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0 - 100"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="feedback">Feedback guru</label>
                  <textarea id="feedback" placeholder="Tulis catatan yang membantu santri berkembang..." />
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
