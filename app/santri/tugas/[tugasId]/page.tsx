import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, getTugasDetailUntukSantri } from "@/db/queries/santri";
import {
  SubmitFileForm,
  SubmitLinkForm,
  DeleteSubmissionButton,
  DeleteFileButton,
  RemoveLinkButton,
} from "./tugas-detail-client";
import { PreviewButton } from "@/components/shared/file-preview";
import { Icon } from "@/lib/icons";
import { tanggalWaktuIndo, sisaWaktu, masihBerjalan, ukuranFile } from "@/lib/format";
import { submissionStatusLabel } from "@/lib/status";

export const metadata: Metadata = {
  title: "Detail tugas",
  description: "Detail tugas dan formulir pengumpulan.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  dinilai: "success",
  terlambat: "warning",
  dikumpulkan: "neutral",
};

export default async function SantriTugasDetailPage({
  params,
}: {
  params: Promise<{ tugasId: string }>;
}) {
  const session = await requireRole("santri");
  const { tugasId } = await params;
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const tugas = await getTugasDetailUntukSantri(tugasId, profile.id, profile.kelasId);
  if (!tugas) notFound();

  const sisa = sisaWaktu(tugas.deadline);
  const sudahSubmit = Boolean(tugas.submissionId);
  const bisaEdit =
    sudahSubmit && masihBerjalan(tugas.deadline) && tugas.submissionStatus !== "dinilai";

  return (
    <>
      <PageHeading
        kicker="Belajar"
        title={tugas.judul}
        description={`${tugas.mapelNama} · kelas ${tugas.kelasNama} · deadline ${tanggalWaktuIndo(tugas.deadline)} (${sisa.text})`}
        actions={
          <Link className="button button-secondary" href="/santri/tugas">
            Kembali
          </Link>
        }
      />

      <div className="form-layout">
        <div className="task-detail-column">
          <Panel title="Instruksi tugas">
            <p className="task-description">{tugas.deskripsi}</p>
          </Panel>

          {tugas.lampiran.length > 0 ? (
            <Panel
              title="Lampiran dari guru"
              subtitle={`${tugas.lampiran.length} lampiran — dapat dipreview tanpa mengunduh`}
            >
              <ul className="file-list attachment-list">
                {tugas.lampiran.map((f) => (
                  <li key={f.id}>
                    {f.filePath ? (
                      <>
                        <Icon name="file" />
                        <span className="file-name">{f.namaAsli}</span>
                        <span className="file-size">{ukuranFile(f.size)}</span>
                        <PreviewButton href={`/api/files/${f.filePath}`} nama={f.namaAsli} />
                        <a
                          href={`/api/files/${f.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          unduh
                        </a>
                      </>
                    ) : (
                      <>
                        <Icon name="link" />
                        <span className="file-name">Link dari guru</span>
                        <a href={f.url ?? "#"} target="_blank" rel="noreferrer" className="file-link">
                          buka link
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Submission saya" subtitle="Status pengumpulan dan penilaian">
            {!sudahSubmit ? (
              <EmptyState>
                Anda belum mengumpulkan tugas ini. Gunakan formulir di panel sebelah.
              </EmptyState>
            ) : (
              <div className="table-shell">
                <table className="data-table submission-summary">
                  <tbody>
                    <tr>
                      <td>Status</td>
                      <td>
                        <StatusBadge variant={STATUS_VARIANT[tugas.submissionStatus ?? "dikumpulkan"] ?? "neutral"}>
                          {submissionStatusLabel(tugas.submissionStatus ?? "dikumpulkan")}
                        </StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>Dikumpulkan</td>
                      <td>{tanggalWaktuIndo(tugas.submittedAt)}</td>
                    </tr>
                    <tr>
                      <td>Link</td>
                      <td>
                        {tugas.url ? (
                          <span className="inline-actions">
                            <a href={tugas.url} target="_blank" rel="noreferrer" className="file-link">
                              {tugas.url}
                            </a>
                            {bisaEdit ? <RemoveLinkButton submissionId={tugas.submissionId!} /> : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Berkas</td>
                      <td>
                        {tugas.files.length > 0 ? (
                          <ul className="file-list">
                            {tugas.files.map((f) => (
                              <li key={f.id}>
                                <Icon name="file" />
                                <span className="file-name">{f.namaAsli}</span>
                                <span className="file-size">{ukuranFile(f.size)}</span>
                                <PreviewButton href={`/api/files/${f.filePath}`} nama={f.namaAsli} />
                                <a
                                  href={`/api/files/${f.filePath}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="file-link"
                                >
                                  unduh
                                </a>
                                {bisaEdit ? (
                                  <DeleteFileButton
                                    submissionId={tugas.submissionId!}
                                    fileId={f.id}
                                    nama={f.namaAsli}
                                  />
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Nilai</td>
                      <td>
                        {tugas.nilai ?? "—"}
                        {tugas.feedbackGuru ? (
                          <div className="feedback-note">
                            Feedback: {tugas.feedbackGuru}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {sudahSubmit ? (
              <div className="form-actions task-actions">
                {bisaEdit ? (
                  <>
                    <span className="panel-subtitle">
                      Submission masih bisa diubah/hapus sebelum deadline.
                    </span>
                    <DeleteSubmissionButton submissionId={tugas.submissionId!} />
                  </>
                ) : (
                  <span className="panel-subtitle">
                    {tugas.submissionStatus === "dinilai"
                      ? "Submission sudah dinilai guru dan tidak dapat diubah."
                      : "Deadline sudah terlewati — submission tidak dapat diubah."}
                  </span>
                )}
              </div>
            ) : null}
          </Panel>
        </div>

        <Panel title="Kumpulkan tugas" subtitle="Kirim file dan/atau link — keduanya dapat terkirim bersamaan">
          {sudahSubmit && !bisaEdit ? (
            <EmptyState>
              Submission sudah terkirim{" "}
              {!masihBerjalan(tugas.deadline) ? "dan deadline terlewati" : "sudah dinilai"}.
              Hubungi guru bila perlu perubahan.
            </EmptyState>
          ) : (
            <div className="submit-options">
              <div className="form-card">
                <h3 className="form-card-title">Upload file</h3>
                <p className="form-card-description">
                   PDF, dokumen Office, gambar, ZIP, dan file teks didukung — maksimum 10 MB per
                   file, hingga 10 file per tugas. Bisa dipadukan dengan link di bawah.
                </p>
                <SubmitFileForm tugasId={tugas.id} />
              </div>
              <div className="form-card">
                <h3 className="form-card-title">Kirim link</h3>
                <p className="form-card-description">
                  Google Drive / YouTube / tautan lain yang dapat diakses guru. Link tidak
                  menghapus file yang sudah diunggah.
                </p>
                <SubmitLinkForm tugasId={tugas.id} />
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
