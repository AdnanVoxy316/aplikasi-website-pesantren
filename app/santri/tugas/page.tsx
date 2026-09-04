import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, listTugasUntukSantri } from "@/db/queries/santri";
import { tanggalIndo, sisaWaktu, masihBerjalan } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tugas saya",
  description: "Daftar tugas kelas Anda beserta status pengumpulan.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  dinilai: "success",
  terlambat: "warning",
  dikumpulkan: "neutral",
};

export default async function SantriTugasPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const rows = await listTugasUntukSantri(profile.id, profile.kelasId);

  return (
    <>
      <PageHeading
        kicker="Belajar"
        title="Tugas saya"
        description="Kumpulkan tugas dalam bentuk file atau link sebelum deadline."
      />
      <Panel title="Semua tugas kelas Anda" subtitle={`${rows.length} tugas`}>
        {rows.length === 0 ? (
          <EmptyState>
            {profile.kelasId
              ? "Belum ada tugas untuk kelas Anda. Tugas dari guru akan muncul di sini."
              : "Anda belum ditempatkan di kelas mana pun. Hubungi admin."}
          </EmptyState>
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
                {rows.map((row) => {
                  const sisa = sisaWaktu(row.deadline);
                  const belumSubmit = !row.submissionId;
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.judul}</strong>
                      </td>
                      <td>{row.mapelNama}</td>
                      <td>
                        {tanggalIndo(row.deadline)}
                        <div>
                          <StatusBadge variant={sisa.urgent ? "warning" : "neutral"}>
                            {sisa.text}
                          </StatusBadge>
                        </div>
                      </td>
                      <td>
                        {belumSubmit ? (
                          masihBerjalan(row.deadline) ? (
                            <StatusBadge variant="danger">Belum dikumpulkan</StatusBadge>
                          ) : (
                            <StatusBadge variant="danger">Terlewat</StatusBadge>
                          )
                        ) : (
                          <StatusBadge variant={STATUS_VARIANT[row.submissionStatus ?? "dikumpulkan"] ?? "neutral"}>
                            {row.submissionStatus}
                          </StatusBadge>
                        )}
                      </td>
                      <td>{row.submissionNilai ?? "—"}</td>
                      <td>
                        <Link
                          className="table-action"
                          href={`/santri/tugas/${row.id}`}
                          title="Detail & kumpulkan"
                        >
                          <Icon name="external" />
                          buka
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
    </>
  );
}
