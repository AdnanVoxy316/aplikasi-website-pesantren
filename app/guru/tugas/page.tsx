import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, listTugasGuru } from "@/db/queries/guru";
import { DeleteTugasButton } from "./tugas-client";
import { tanggalIndo, sisaWaktu } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tugas & submission",
  description: "Daftar tugas yang dibuat dan status submission santri.",
};

export default async function GuruTugasPage() {
  const session = await requireRole("guru");
  const guru = await getGuruProfile(session.user.id);

  if (!guru) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil guru belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const rows = await listTugasGuru(guru.id);

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Tugas & submission"
        description="Tugas otomatis muncul di dashboard santri di kelas tujuan."
        actions={
          <Link className="button button-primary" href="/guru/tugas/baru">
            Buat tugas baru
          </Link>
        }
      />
      <Panel title="Daftar tugas" subtitle={`${rows.length} tugas`}>
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada tugas. Klik &quot;Buat tugas baru&quot; untuk memberi tugas ke kelas Anda.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kelas · Mapel</th>
                  <th>Deadline</th>
                  <th>Submission</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sisa = sisaWaktu(row.deadline);
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.judul}</strong>
                      </td>
                      <td>
                        {row.kelasNama} · {row.mapelNama}
                      </td>
                      <td>
                        {tanggalIndo(row.deadline)}
                        <div>
                          <StatusBadge variant={sisa.urgent ? "warning" : "neutral"}>
                            {sisa.text}
                          </StatusBadge>
                        </div>
                      </td>
                      <td>
                        {row.totalSubmission}/{row.totalSantri} dikumpulkan
                        <div style={{ fontSize: 10 }}>{row.totalDinilai} dinilai</div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            className="table-action"
                            href={`/guru/tugas/submission?tugasId=${row.id}`}
                            title="Lihat submission"
                          >
                            <Icon name="file" />
                          </Link>
                          <DeleteTugasButton tugasId={row.id} judul={row.judul} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
