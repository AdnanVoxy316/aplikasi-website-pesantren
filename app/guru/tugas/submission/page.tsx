import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, listTugasGuru, listSubmissionsOfTugas, getTugasLampiran } from "@/db/queries/guru";
import {
  GradeForm,
  DeleteSubmissionFileButton,
  LampiranManager,
  DeleteLampiranButton,
} from "./submission-client";
import { PreviewButton } from "@/components/shared/file-preview";
import { Icon } from "@/lib/icons";
import { tanggalWaktuIndo, ukuranFile } from "@/lib/format";

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
  const [submissions, lampiran] = await Promise.all([
    listSubmissionsOfTugas(selected.id),
    getTugasLampiran(selected.id),
  ]);

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Submission santri"
        description="Beri nilai 0–100 dan feedback. Status berubah menjadi dinilai."
      />

      <div className="panel-toolbar submission-toolbar">
        <div className="toolbar-left">
          {tugasRows.slice(0, 8).map((t) => (
            <Link
              key={t.id}
              href={`/guru/tugas/submission?tugasId=${t.id}`}
              className={`task-selector${t.id === selected.id ? " active" : ""}`}
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
        <div className="attachment-manager-section">
          <h3 className="form-card-title attachment-heading">
            Lampiran tugas
          </h3>
          <p className="form-card-description attachment-description">
            File dan link yang dilampirkan guru untuk santri ({lampiran.length}/10 — semua jenis
            file, maks 10 MB per file, bisa dipadukan dengan link).
          </p>
          {lampiran.length > 0 ? (
            <ul className="file-list attachment-list">
              {lampiran.map((f) => (
                <li key={f.id}>
                  {f.filePath ? (
                    <>
                      <Icon name="file" />
                      <span className="file-name">{f.namaAsli}</span>
                      <span className="file-size">{ukuranFile(f.size)}</span>
                      <PreviewButton href={`/api/files/${f.filePath}`} nama={f.namaAsli} />
                      <a href={`/api/files/${f.filePath}`} target="_blank" rel="noreferrer" className="file-link">
                        unduh
                      </a>
                    </>
                  ) : (
                    <>
                      <Icon name="link" />
                      <span className="file-name">Link lampiran</span>
                      <a href={f.url ?? "#"} target="_blank" rel="noreferrer" className="file-link">
                        buka link
                      </a>
                    </>
                  )}
                  <DeleteLampiranButton lampiranId={f.id} nama={f.filePath ? f.namaAsli : "link lampiran"} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-subtitle attachment-empty">
              Belum ada lampiran.
            </p>
          )}
          <LampiranManager tugasId={selected.id} jumlahLampiran={lampiran.length} />
        </div>

        {submissions.length === 0 ? (
          <EmptyState>
            Belum ada santri yang mengumpulkan tugas ini. Submission muncul otomatis setelah santri
            submit.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table submission-table">
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
                      <div className="person-meta">NIS {s.nis}</div>
                    </td>
                    <td>{tanggalWaktuIndo(s.submittedAt)}</td>
                    <td>
                      {s.files.length > 0 ? (
                        <ul className="file-list">
                          {s.files.map((f) => (
                            <li key={f.id}>
                              <Icon name="file" />
                              <span className="file-name">{f.namaAsli}</span>
                                <span className="file-size">{ukuranFile(f.size)}</span>
                              <PreviewButton href={`/api/files/${f.filePath}`} nama={f.namaAsli} />
                              <a href={`/api/files/${f.filePath}`} target="_blank" rel="noreferrer" className="file-link">
                                unduh
                              </a>
                              <DeleteSubmissionFileButton fileId={f.id} nama={f.namaAsli} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="file-link">
                          <Icon name="link" /> buka link santri
                        </a>
                      ) : null}
                      {s.files.length === 0 && !s.url ? "—" : null}
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
