import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import {
  listKelasDetail,
  getTahunAjaranAktif,
  listRaporRekap,
  getPesantrenSettings,
} from "@/db/queries/admin";
import { listSantriOfKelas } from "@/db/queries/guru";
import { tanggalWaktuIndo } from "@/lib/format";
import { GenerateRaporClient } from "@/components/shared/generate-rapor-client";

export const metadata: Metadata = {
  title: "Rapor",
  description: "Rekap dan cetak rapor lintas kelas.",
};

export default async function AdminRaporPage() {
  const [taAktif, kelasRows, raporRows, settings] = await Promise.all([
    getTahunAjaranAktif(),
    listKelasDetail(),
    listRaporRekap(),
    getPesantrenSettings(),
  ]);

  const kelasAktif = taAktif ? kelasRows.filter((k) => k.tahunAjaranId === taAktif.id) : [];
  const kelasGroups = await Promise.all(
    kelasAktif.map(async (k) => ({
      id: k.id,
      nama: k.nama,
      santri: await listSantriOfKelas(k.id),
    })),
  );

  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Rapor"
        description="Generate dan pantau rapor seluruh santri lintas kelas."
      />
      {taAktif ? (
        <GenerateRaporClient
          kelasGroups={kelasGroups}
          tahunAjaranId={taAktif.id}
          tahunAjaranLabel={taAktif.label}
          semesterAktif={settings?.settings.semesterAktif ?? "ganjil"}
        />
      ) : (
        <Panel title="Generate rapor">
          <EmptyState>
            Belum ada tahun ajaran aktif. Aktifkan tahun ajaran pada menu Pengaturan.
          </EmptyState>
        </Panel>
      )}

      <Panel title="Rapor tersedia" subtitle={`${raporRows.length} rapor digenerate`}>
        {raporRows.length === 0 ? (
          <EmptyState>
            Belum ada rapor. Generate rapor setelah guru menginput nilai dan kehadiran.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Kelas</th>
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
                    <td>{row.kelasNama}</td>
                    <td>
                      {row.semester === "ganjil" ? "Ganjil" : "Genap"} · {row.tahunAjaranLabel}
                    </td>
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
