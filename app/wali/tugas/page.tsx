import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { listAnakWali, listTugasAnakWali, getTugasDetailUntukWali } from "@/db/queries/santri";
import { PreviewButton } from "@/components/shared/file-preview";
import { Icon } from "@/lib/icons";
import { tanggalIndo, sisaWaktu, ukuranFile } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tugas anak",
  description: "Pantau tugas dari guru dan pengumpulan tugas anak (hanya lihat).",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  dinilai: "success",
  terlambat: "warning",
  dikumpulkan: "neutral",
};

export default async function WaliTugasPage({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string; tugas?: string }>;
}) {
  const session = await requireRole("wali");
  const params = await searchParams;
  const anakRows = await listAnakWali(session.user.id);

  if (anakRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Pantau anak" title="Tugas anak" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>
            Akun wali Anda belum dihubungkan dengan santri mana pun. Hubungi admin pesantren.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const selectedAnak =
    anakRows.find((a) => a.santriId === params.anak) ?? anakRows[0];
  const tugasRows = await listTugasAnakWali(session.user.id, selectedAnak.santriId);
  const selectedTugas = params.tugas
    ? (tugasRows.find((t) => t.tugasId === params.tugas) ?? null)
    : null;
  const detail = selectedTugas
    ? await getTugasDetailUntukWali(selectedTugas.tugasId, session.user.id, selectedAnak.santriId)
    : null;

  return (
    <>
      <PageHeading
        kicker="Pantau anak"
        title="Tugas anak"
        description="Tugas dari guru dan pengumpulan tugas anak — mode lihat saja, wali tidak dapat mengunggah."
      />

      {anakRows.length > 1 ? (
        <div className="panel-toolbar" style={{ padding: "0 0 14px" }}>
          <div className="toolbar-left">
            {anakRows.map((a) => (
              <Link
                key={a.santriId}
                href={`/wali/tugas?anak=${a.santriId}`}
                className="table-button"
                style={{
                  marginRight: 6,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  background: a.santriId === selectedAnak.santriId ? "var(--brand)" : "var(--surface)",
                  color: a.santriId === selectedAnak.santriId ? "#fff" : "inherit",
                }}
              >
                {a.nama}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <Panel
        title={`Tugas — ${selectedAnak.nama}`}
        subtitle={`NIS ${selectedAnak.nis}${selectedAnak.kelasNama ? ` · Kelas ${selectedAnak.kelasNama}` : ""} · ${tugasRows.length} tugas`}
      >
        {tugasRows.length === 0 ? (
          <EmptyState>Belum ada tugas untuk kelas anak Anda.</EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Mapel</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Nilai</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tugasRows.map((t) => {
                  const sisa = sisaWaktu(t.deadline);
                  return (
                    <tr key={t.tugasId}>
                      <td>
                        <strong>{t.judul}</strong>
                      </td>
                      <td>{t.mapelNama}</td>
                      <td>
                        {tanggalIndo(t.deadline)}
                        <div>
                          <StatusBadge variant={sisa.urgent ? "warning" : "neutral"}>
                            {sisa.text}
                          </StatusBadge>
                        </div>
                      </td>
                      <td>
                        <StatusBadge variant={STATUS_VARIANT[t.submissionStatus ?? ""] ?? "neutral"}>
                          {t.submissionId ? t.submissionStatus : "belum dikumpulkan"}
                        </StatusBadge>
                      </td>
                      <td>{t.nilai ?? "—"}</td>
                      <td>
                        <Link
                          className="table-action"
                          href={`/wali/tugas?anak=${selectedAnak.santriId}&tugas=${t.tugasId}`}
                        >
                          detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {detail ? (
        <>
          <Panel
            title={detail.judul}
            subtitle={`${detail.mapelNama} · kelas ${detail.kelasNama} · deadline ${tanggalIndo(detail.deadline)}`}
            actions={
              <Link className="button button-secondary" href={`/wali/tugas?anak=${selectedAnak.santriId}`}>
                Tutup detail
              </Link>
            }
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <h3 className="form-card-title">Instruksi tugas</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7 }}>{detail.deskripsi}</p>
              </div>

              <div>
                <h3 className="form-card-title">Lampiran dari guru</h3>
                {detail.lampiran.length === 0 ? (
                  <p className="panel-subtitle">Tidak ada lampiran.</p>
                ) : (
                  <ul className="file-list">
                    {detail.lampiran.map((f) => (
                      <li key={f.id}>
                        {f.filePath ? (
                          <>
                            <Icon name="file" />
                            <span className="file-name">{f.namaAsli}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{ukuranFile(f.size)}</span>
                            <PreviewButton href={`/api/files/${f.filePath}`} nama={f.namaAsli} />
                            <a href={`/api/files/${f.filePath}`} target="_blank" rel="noreferrer" className="file-link">
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
                )}
              </div>

              <div>
                <h3 className="form-card-title">Pengumpulan {selectedAnak.nama}</h3>
                {!detail.anakSubmission ? (
                  <p className="panel-subtitle">Belum mengumpulkan tugas ini.</p>
                ) : (
                  <div className="table-shell" style={{ margin: 0 }}>
                    <table className="data-table">
                      <tbody>
                        <tr>
                          <td>Status</td>
                          <td>
                            <StatusBadge
                              variant={STATUS_VARIANT[detail.anakSubmission.status ?? "dikumpulkan"] ?? "neutral"}
                            >
                              {detail.anakSubmission.status}
                            </StatusBadge>
                          </td>
                        </tr>
                        <tr>
                          <td>Nilai</td>
                          <td>
                            {detail.anakSubmission.nilai ?? "—"}
                            {detail.anakSubmission.feedbackGuru ? (
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                Feedback: {detail.anakSubmission.feedbackGuru}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                        <tr>
                          <td>File</td>
                          <td>
                            {detail.anakSubmission.files.length > 0 ? (
                              <ul className="file-list">
                                {detail.anakSubmission.files.map((f) => (
                                  <li key={f.id}>
                                    <Icon name="file" />
                                    <span className="file-name">{f.namaAsli}</span>
                                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                      {ukuranFile(f.size)}
                                    </span>
                                    <PreviewButton href={`/api/files/${f.filePath}`} nama={f.namaAsli} />
                                    <a href={`/api/files/${f.filePath}`} target="_blank" rel="noreferrer" className="file-link">
                                      unduh
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>Link</td>
                          <td>
                            {detail.anakSubmission.url ? (
                              <a href={detail.anakSubmission.url} target="_blank" rel="noreferrer" className="file-link">
                                {detail.anakSubmission.url}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="panel-subtitle" style={{ marginTop: 12 }}>
                  Wali santri hanya dapat melihat. Pengunggahan hanya dilakukan oleh santri melalui
                  akunnya sendiri.
                </p>
              </div>
            </div>
          </Panel>
        </>
      ) : null}
    </>
  );
}
