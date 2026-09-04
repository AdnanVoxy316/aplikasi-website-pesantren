import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, listRaporSantri } from "@/db/queries/santri";
import { tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rapor",
  description: "Rapor snapshot per semester.",
};

type RingkasanNilai = {
  mapelId: string;
  nama: string;
  kategori: string;
  nilaiAkhir: number | null;
};

type RingkasanKehadiran = {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
};

export default async function SantriRaporPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const rows = await listRaporSantri(profile.id);

  return (
    <>
      <PageHeading
        kicker="Belajar"
        title="Rapor"
        description="Snapshot nilai & kehadiran saat rapor digenerate — tidak berubah walau data mentah diedit."
      />
      {rows.length === 0 ? (
        <Panel title="Belum ada rapor">
          <EmptyState>
            Rapor belum digenerate. Rapor tersedia setelah guru/wali kelas menerbitkannya akhir
            semester.
          </EmptyState>
        </Panel>
      ) : (
        rows.map((row) => {
          const nilai = JSON.parse(row.ringkasanNilai) as RingkasanNilai[];
          const kehadiran = JSON.parse(row.ringkasanKehadiran) as RingkasanKehadiran;
          return (
            <Panel
              key={row.id}
              title={`Rapor ${row.tahunAjaranLabel} — Semester ${row.semester === "ganjil" ? "Ganjil" : "Genap"}`}
              subtitle={`Digenerate ${tanggalWaktuIndo(row.generatedAt)}`}
            >
              <div className="form-layout">
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mapel</th>
                        <th>Nilai akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilai.map((n) => (
                        <tr key={n.mapelId}>
                          <td>
                            <strong>{n.nama}</strong>
                          </td>
                          <td>{n.nilaiAkhir ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="check-list">
                    <div className="check-row">Hadir: {kehadiran.hadir}</div>
                    <div className="check-row">Izin: {kehadiran.izin}</div>
                    <div className="check-row">Sakit: {kehadiran.sakit}</div>
                    <div className="check-row">Alpa: {kehadiran.alpa}</div>
                  </div>
                  {row.catatan ? (
                    <div className="notice" style={{ marginTop: 12 }}>
                      <strong>Catatan wali kelas</strong>
                      {row.catatan}
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>
          );
        })
      )}
    </>
  );
}
