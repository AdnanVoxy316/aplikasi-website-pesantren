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
} from "./tugas-detail-client";
import { tanggalWaktuIndo, sisaWaktu, masihBerjalan } from "@/lib/format";

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
        <div style={{ display: "grid", gap: 15 }}>
          <Panel title="Instruksi tugas">
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>{tugas.deskripsi}</p>
          </Panel>

          <Panel title="Submission saya" subtitle="Status pengumpulan dan penilaian">
            {!sudahSubmit ? (
              <EmptyState>
                Anda belum mengumpulkan tugas ini. Gunakan formulir di panel sebelah.
              </EmptyState>
            ) : (
              <div className="table-shell">
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td>Status</td>
                      <td>
                        <StatusBadge variant={STATUS_VARIANT[tugas.submissionStatus ?? "dikumpulkan"] ?? "neutral"}>
                          {tugas.submissionStatus}
                        </StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>Dikumpulkan</td>
                      <td>{tanggalWaktuIndo(tugas.submittedAt)}</td>
                    </tr>
                    <tr>
                      <td>Berkas</td>
                      <td>
                        {tugas.submissionTipe === "file" ? (
                          <>
                            {tugas.fileNamaAsli}
                            {tugas.fileSize
                              ? ` (${Math.round(tugas.fileSize / 1024)} KB)`
                              : ""}
                          </>
                        ) : (
                          <a href={tugas.url ?? "#"} target="_blank" rel="noreferrer" className="table-action">
                            {tugas.url}
                          </a>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Nilai</td>
                      <td>
                        {tugas.nilai ?? "—"}
                        {tugas.feedbackGuru ? (
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
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
              <div className="form-actions" style={{ justifyContent: "flex-start" }}>
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

        <Panel title="Kumpulkan tugas" subtitle="Pilih file atau link">
          {sudahSubmit && !bisaEdit ? (
            <EmptyState>
              Submission sudah terkirim{" "}
              {!masihBerjalan(tugas.deadline) ? "dan deadline terlewati" : "sudah dinilai"}.
              Hubungi guru bila perlu perubahan.
            </EmptyState>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="form-card">
                <h3 className="form-card-title">Upload file</h3>
                <p className="form-card-description">
                  .doc/.docx/.pdf/.jpg/.png — maksimum 10 MB, divalidasi server.
                </p>
                <SubmitFileForm tugasId={tugas.id} />
              </div>
              <div className="form-card">
                <h3 className="form-card-title">Kirim link</h3>
                <p className="form-card-description">
                  Google Drive / YouTube / tautan lain yang dapat diakses guru.
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
