import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import {
  getSantriProfile,
  listNilaiSantri,
} from "@/db/queries/santri";
import { getTahunAjaranAktif, getPesantrenSettings } from "@/db/queries/admin";

export const metadata: Metadata = {
  title: "Nilai",
  description: "Nilai per mapel beserta nilai akhir berbobot.",
};

export default async function SantriNilaiPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const [taAktif, settings] = await Promise.all([getTahunAjaranAktif(), getPesantrenSettings()]);
  const semester = settings?.settings.semesterAktif ?? "ganjil";
  const rows = taAktif
    ? await listNilaiSantri(profile.id, taAktif.id, semester)
    : [];

  return (
    <>
      <PageHeading
        kicker="Belajar"
        title="Nilai"
        description={`Nilai per mapel — semester ${semester}${taAktif ? ` · tahun ajaran ${taAktif.label}` : ""}. Nilai akhir dihitung dari bobot jenis nilai.`}
      />
      <Panel title="Rekap nilai per mapel" subtitle={`${rows.length} mapel`}>
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada nilai pada semester ini. Nilai muncul setelah guru menginput.
          </EmptyState>
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
                      <div style={{ fontSize: 10 }}>kategori {row.kategori}</div>
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
