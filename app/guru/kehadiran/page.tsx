import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import {
  getGuruProfile,
  listPengajaranGuru,
  listKehadiranTanggal,
  listRiwayatKehadiranKelas,
} from "@/db/queries/guru";
import { KehadiranClient } from "./kehadiran-client";
import { tanggalIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kehadiran",
  description: "Catat kehadiran hadir/izin/sakit/alpa per pertemuan.",
};

export default async function GuruKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<{ pengajaranId?: string; tanggal?: string }>;
}) {
  const session = await requireRole("guru");
  const params = await searchParams;
  const guru = await getGuruProfile(session.user.id);

  if (!guru) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil guru belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const pengajaranRows = await listPengajaranGuru(guru.id);
  if (pengajaranRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Kegiatan mengajar" title="Kehadiran" />
        <Panel title="Belum ada penugasan">
          <EmptyState>Anda belum ditugaskan ke kelas/mapel mana pun.</EmptyState>
        </Panel>
      </>
    );
  }

  const selected =
    pengajaranRows.find((p) => p.id === params.pengajaranId) ?? pengajaranRows[0];
  const tanggal = params.tanggal ?? new Date().toISOString().slice(0, 10);

  const [santri, existingMap, riwayat] = await Promise.all([
    import("@/db/queries/guru").then((m) => m.listSantriOfKelas(selected.kelasId)),
    listKehadiranTanggal(selected.kelasId, selected.mapelId, tanggal),
    listRiwayatKehadiranKelas(selected.kelasId, selected.mapelId, 10),
  ]);

  const existing: Record<string, string> = {};
  for (const [santriId, status] of existingMap) existing[santriId] = status;

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Kehadiran"
        description="Catat hadir/izin/sakit/alpa per pertemuan. Data tersimpan per santri per tanggal."
      />

      <div className="panel-toolbar" style={{ padding: "0 0 14px" }}>
        <div className="toolbar-left">
          {pengajaranRows.map((p) => (
            <Link
              key={p.id}
              href={`/guru/kehadiran?pengajaranId=${p.id}`}
              className="table-button"
              style={{
                marginRight: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: p.id === selected.id ? "var(--brand)" : "var(--surface)",
                color: p.id === selected.id ? "#fff" : "inherit",
              }}
            >
              {p.kelasNama} · {p.mapelNama}
            </Link>
          ))}
        </div>
        <div className="toolbar-right">
          <form method="get" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="hidden" name="pengajaranId" value={selected.id} />
            <label htmlFor="tanggal" style={{ fontSize: 11, fontWeight: 700 }}>
              Tanggal
            </label>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              defaultValue={tanggal}
              className="date-input"
            />
            <button className="button button-secondary" type="submit">
              Tampilkan
            </button>
          </form>
        </div>
      </div>

      <div className="form-layout">
        <Panel
          title={`${selected.kelasNama} — ${selected.mapelNama}`}
          subtitle={`Pertemuan ${tanggalIndo(new Date(tanggal))}`}
        >
          <KehadiranClient
            kelasId={selected.kelasId}
            mapelId={selected.mapelId}
            tahunAjaranId={selected.tahunAjaranId}
            tanggal={tanggal}
            santri={santri}
            existing={existing}
          />
        </Panel>

        <Panel title="Riwayat pertemuan" subtitle="10 pertemuan terakhir">
          {riwayat.length === 0 ? (
            <EmptyState>Belum ada catatan kehadiran untuk kelas & mapel ini.</EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>H</th>
                    <th>I</th>
                    <th>S</th>
                    <th>A</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r) => (
                    <tr key={r.tanggal}>
                      <td>
                        <strong>{r.tanggal}</strong>
                      </td>
                      <td>{r.hadir}</td>
                      <td>{r.izin}</td>
                      <td>{r.sakit}</td>
                      <td>{r.alpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
