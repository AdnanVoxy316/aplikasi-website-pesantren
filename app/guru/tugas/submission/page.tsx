import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, listTugasGuru, listSubmissionsOfTugas } from "@/db/queries/guru";
import { GradeForm } from "./submission-client";
import { tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Submission santri",
  description: "Tinjau dan nilai submission tugas santri.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  dinilai: "success",
  terlambat: "warning",
  dikumpulkan: "neutral",
};

export default async function GuruSubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ tugasId?: string }>;
}) {
  const session = await requireRole("guru");
  const params = await searchParams;
  const guru = await getGuruProfile(session.user.id);

  if (!guru) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil guru belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const tugasRows = await listTugasGuru(guru.id);
  if (tugasRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Kegiatan mengajar" title="Submission santri" />
        <Panel title="Belum ada tugas">
          <EmptyState>
            Belum ada tugas yang dibuat. <Link href="/guru/tugas/baru">Buat tugas baru</Link>.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const selected = tugasRows.find((t) => t.id === params.tugasId) ?? tugasRows[0];
  const submissions = await listSubmissionsOfTugas(selected.id);

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Submission santri"
        description="Beri nilai 0–100 dan feedback. Status berubah menjadi dinilai."
      />

      <div className="panel-toolbar" style={{ padding: "0 0 14px" }}>
        <div className="toolbar-left">
          {tugasRows.slice(0, 8).map((t) => (
            <Link
              key={t.id}
              href={`/guru/tugas/submission?tugasId=${t.id}`}
              className="table-button"
              style={{
                marginRight: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: t.id === selected.id ? "var(--brand)" : "var(--surface)",
                color: t.id === selected.id ? "#fff" : "inherit",
              }}
            >
              {t.judul}
            </Link>
          ))}
        </div>
      </div>

      <Panel
        title={selected.judul}
        subtitle={`${selected.kelasNama} · ${selected.mapelNama} · ${submissions.length}/${selected.totalSantri} dikumpulkan`}
      >
        {submissions.length === 0 ? (
          <EmptyState>
            Belum ada santri yang mengumpulkan tugas ini. Submission muncul otomatis setelah santri
            submit.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Submit</th>
                  <th>Berkas</th>
                  <th>Status</th>
                  <th>Nilai & feedback</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.santriNama}</strong>
                      <div style={{ fontSize: 10 }}>NIS {s.nis}</div>
                    </td>
                    <td>{tanggalWaktuIndo(s.submittedAt)}</td>
                    <td>
                      {s.tipe === "file" ? (
                        s.fileNamaAsli ?? "file"
                      ) : (
                        <a href={s.url ?? "#"} target="_blank" rel="noreferrer" className="table-action">
                          buka link
                        </a>
                      )}
                    </td>
                    <td>
                      <StatusBadge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status}</StatusBadge>
                    </td>
                    <td>
                      <GradeForm
                        submissionId={s.id}
                        existingNilai={s.nilai}
                        existingFeedback={s.feedbackGuru}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
