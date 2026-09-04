import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { listNilaiSantri } from "@/db/queries/santri";
import { getTahunAjaranAktif, getPesantrenSettings } from "@/db/queries/admin";
import { getAnakUntukWali, AnakSwitcher } from "../wali-helpers";

export const metadata: Metadata = {
  title: "Nilai anak",
  description: "Nilai per mapel untuk anak Anda.",
};

export default async function WaliNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string }>;
}) {
  const session = await requireRole("wali");
  const params = await searchParams;
  const { anakRows, selected } = await getAnakUntukWali(session.user.id, params.anak);

  if (!selected) {
    return (
      <>
        <PageHeading kicker="Pantau anak" title="Nilai anak" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>Akun wali Anda belum dihubungkan dengan santri mana pun.</EmptyState>
        </Panel>
      </>
    );
  }

  const [taAktif, settings] = await Promise.all([getTahunAjaranAktif(), getPesantrenSettings()]);
  const semester = settings?.settings.semesterAktif ?? "ganjil";
  const rows = taAktif ? await listNilaiSantri(selected.santriId, taAktif.id, semester) : [];

  return (
    <>
      <PageHeading
        kicker="Pantau anak"
        title="Nilai anak"
        description={taAktif ? `Semester ${semester} · tahun ajaran ${taAktif.label}` : undefined}
      />
      <AnakSwitcher anakRows={anakRows} selectedId={selected.santriId} basePath="/wali/nilai" />
      <Panel
        title={selected.nama}
        subtitle={`NIS ${selected.nis}${selected.kelasNama ? ` · ${selected.kelasNama}` : ""}`}
      >
        {rows.length === 0 ? (
          <EmptyState>Belum ada nilai pada semester ini.</EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mapel</th>
                  <th>Detail nilai</th>
                  <th>Nilai akhir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.mapelId}>
                    <td>
                      <strong>{row.mapelNama}</strong>
                    </td>
                    <td>
                      {row.detail.map((d) => (
                        <div key={d.jenis} style={{ fontSize: 11 }}>
                          {d.jenis}: <strong>{d.nilai}</strong> (bobot {d.bobot})
                        </div>
                      ))}
                    </td>
                    <td>
                      <strong style={{ fontSize: 16 }}>{row.nilaiAkhir ?? "—"}</strong>
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
