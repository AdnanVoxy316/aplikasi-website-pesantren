import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { listRaporSantri } from "@/db/queries/santri";
import { getAnakUntukWali, AnakSwitcher } from "../wali-helpers";
import { tanggalWaktuIndo } from "@/lib/format";

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

  return (
    <>
      <PageHeading
        kicker="Pantau anak"
        title="Rapor anak"
        description="Snapshot nilai & kehadiran per semester — dapat diunduh setelah diterbitkan."
      />
      <AnakSwitcher anakRows={anakRows} selectedId={selected.santriId} basePath="/wali/rapor" />
      <Panel
        title={selected.nama}
        subtitle={`NIS ${selected.nis}${selected.kelasNama ? ` · ${selected.kelasNama}` : ""}`}
      >
        {rows.length === 0 ? (
          <EmptyState>
            Rapor belum tersedia. Rapor terbit setelah wali kelas menggenerate akhir semester.
          </EmptyState>
        ) : (
          rows.map((row) => {
            const nilai = JSON.parse(row.ringkasanNilai) as RingkasanNilai[];
            const kehadiran = JSON.parse(row.ringkasanKehadiran) as RingkasanKehadiran;
            return (
              <div key={row.id} style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, marginBottom: 8 }}>
                  {row.tahunAjaranLabel} — Semester {row.semester === "ganjil" ? "Ganjil" : "Genap"}{" "}
                  <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                    ({tanggalWaktuIndo(row.generatedAt)})
                  </span>
                </h3>
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mapel</th>
                        <th>Nilai akhir</th>
                        <th>Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilai.map((n) => (
                        <tr key={n.mapelId}>
                          <td>
                            <strong>{n.nama}</strong>
                          </td>
                          <td>{n.nilaiAkhir ?? "—"}</td>
                          <td rowSpan={nilai.length} style={{ verticalAlign: "top" }}>
                            H {kehadiran.hadir} · I {kehadiran.izin} · S {kehadiran.sakit} · A{" "}
                            {kehadiran.alpa}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {row.catatan ? (
                  <div className="notice" style={{ marginTop: 10 }}>
                    <strong>Catatan wali kelas</strong>
                    {row.catatan}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </Panel>
    </>
  );
}
