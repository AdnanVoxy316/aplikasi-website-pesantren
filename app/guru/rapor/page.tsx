import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, listPengajaranGuru, listRaporKelas } from "@/db/queries/guru";
import { getTahunAjaranAktif, getPesantrenSettings } from "@/db/queries/admin";
import { GenerateRaporClient } from "@/components/shared/generate-rapor-client";
import { listSantriOfKelas } from "@/db/queries/guru";
import { tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rapor",
  description: "Generate dan cetak rapor kelas yang diampu.",
};

export default async function GuruRaporPage() {
  const session = await requireRole("guru");
  const guru = await getGuruProfile(session.user.id);

  if (!guru) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil guru belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const [pengajaranRows, taAktif, settings] = await Promise.all([
    listPengajaranGuru(guru.id),
    getTahunAjaranAktif(),
    getPesantrenSettings(),
  ]);

  const kelasDiampu = Array.from(
    new Map(pengajaranRows.map((p) => [p.kelasId, p.kelasNama])).entries(),
  ).map(([id, nama]) => ({ id, nama }));

  if (!taAktif || kelasDiampu.length === 0) {
    return (
      <>
        <PageHeading kicker="Kegiatan mengajar" title="Rapor" />
        <Panel title="Generate rapor">
          <EmptyState>
            {kelasDiampu.length === 0
              ? "Anda belum ditugaskan mengajar di kelas mana pun."
              : "Belum ada tahun ajaran aktif. Hubungi admin."}
          </EmptyState>
        </Panel>
      </>
    );
  }

  const kelasGroups = await Promise.all(
    kelasDiampu.map(async (k) => ({
      id: k.id,
      nama: k.nama,
      santri: await listSantriOfKelas(k.id),
    })),
  );

  const raporRows = (
    await Promise.all(
      kelasDiampu.map((k) => listRaporKelas(k.id, taAktif.id)),
    )
  ).flat();

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Rapor"
        description={`Snapshot nilai + kehadiran untuk tahun ajaran ${taAktif.label}.`}
      />
      <GenerateRaporClient
        kelasGroups={kelasGroups}
        tahunAjaranId={taAktif.id}
        tahunAjaranLabel={taAktif.label}
        semesterAktif={settings?.settings.semesterAktif ?? "ganjil"}
      />

      <Panel title="Rapor kelas diampu" subtitle={`${raporRows.length} rapor`}>
        {raporRows.length === 0 ? (
          <EmptyState>
            Belum ada rapor untuk kelas Anda. Generate setelah nilai dan kehadiran terisi.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Semester</th>
                  <th>Digenerate</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {raporRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.santriNama}</strong> · {row.nis}
                    </td>
                    <td>{row.semester}</td>
                    <td>{tanggalWaktuIndo(row.generatedAt)}</td>
                    <td>{row.catatan ?? "—"}</td>
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
