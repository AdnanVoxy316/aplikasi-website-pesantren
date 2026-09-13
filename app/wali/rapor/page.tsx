import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { listRaporSantri } from "@/db/queries/santri";
import { getAnakUntukWali, AnakSwitcher } from "../wali-helpers";
import { RaporPdfButton } from "@/components/shared/rapor-pdf-button";
import { tanggalIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rapor anak",
  description: "Rapor snapshot anak per semester.",
};

type RingkasanNilai = { mapelId: string; nama: string; nilaiAkhir: number | null };
type RingkasanKehadiran = { hadir: number; izin: number; sakit: number; alpa: number; total: number };

export default async function WaliRaporPage({
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
        <PageHeading kicker="Pantau anak" title="Rapor anak" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>Akun wali Anda belum dihubungkan dengan santri mana pun.</EmptyState>
        </Panel>
      </>
    );
  }

  const rows = await listRaporSantri(selected.santriId);
  const identitas = `${selected.nama} · NIS ${selected.nis}${selected.kelasNama ? ` · ${selected.kelasNama}` : ""}`;

  return (
    <>
      <PageHeading
        kicker="Pantau anak"
        title="Rapor anak"
        description="Snapshot nilai & kehadiran per semester — dapat diunduh setelah diterbitkan."
      />
      <AnakSwitcher anakRows={anakRows} selectedId={selected.santriId} basePath="/wali/rapor" />
      {rows.length === 0 ? (
        <Panel title={selected.nama} subtitle={identitas}>
          <EmptyState>
            Rapor belum tersedia. Rapor terbit setelah wali kelas menggenerate akhir semester.
          </EmptyState>
        </Panel>
      ) : (
        rows.map((row) => {
          const nilai = JSON.parse(row.ringkasanNilai) as RingkasanNilai[];
          const kehadiran = JSON.parse(row.ringkasanKehadiran) as RingkasanKehadiran;
          return (
            <Panel
              key={row.id}
              title={`Semester ${row.semester === "ganjil" ? "Ganjil" : "Genap"} — ${row.tahunAjaranLabel}`}
              subtitle={`${identitas} · Diterbitkan ${tanggalIndo(row.generatedAt)}`}
              actions={<RaporPdfButton raporId={row.id} variant="button" />}
            >
              <div style={{ padding: "0 22px 22px" }}>
                <div className="kehadiran-chips" style={{ marginBottom: 14 }}>
                  <span className="kehadiran-chip"><i className="present" />Hadir <strong>{kehadiran.hadir}</strong></span>
                  <span className="kehadiran-chip"><i className="permit" />Izin <strong>{kehadiran.izin}</strong></span>
                  <span className="kehadiran-chip"><i className="sick" />Sakit <strong>{kehadiran.sakit}</strong></span>
                  <span className="kehadiran-chip"><i className="absent" />Alpa <strong>{kehadiran.alpa}</strong></span>
                </div>
                <div className="table-shell" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mapel</th>
                        <th style={{ textAlign: "right" }}>Nilai akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilai.map((n) => (
                        <tr key={n.mapelId}>
                          <td>
                            <strong>{n.nama}</strong>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <strong style={{ fontSize: 13 }}>{n.nilaiAkhir ?? "—"}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {row.catatan ? (
                  <div className="notice" style={{ marginTop: 14 }}>
                    <strong>Catatan wali kelas</strong>
                    {row.catatan}
                  </div>
                ) : null}
              </div>
            </Panel>
          );
        })
      )}
    </>
  );
}
