import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { TaskSelect } from "@/components/ui/task-select";
import { requireRole } from "@/lib/auth/session";
import {
  getGuruProfile,
  listPengajaranGuru,
  listKehadiranTanggal,
  listKehadiranKelasMapel,
  listRiwayatKehadiranKelas,
} from "@/db/queries/guru";
import { KehadiranClient } from "./kehadiran-client";
import { RiwayatKehadiran } from "./riwayat-modal";
import { ExportKehadiran } from "./export-kehadiran";
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

  const [santri, existingMap, riwayat, kehadiranSemua] = await Promise.all([
    import("@/db/queries/guru").then((m) => m.listSantriOfKelas(selected.kelasId)),
    listKehadiranTanggal(selected.kelasId, selected.mapelId, tanggal),
    listRiwayatKehadiranKelas(selected.kelasId, selected.mapelId),
    listKehadiranKelasMapel(selected.kelasId, selected.mapelId),
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

      <div className="panel-toolbar selection-toolbar">
        <div className="toolbar-left">
          {pengajaranRows.map((p) => (
            <Link
              key={p.id}
              href={`/guru/kehadiran?pengajaranId=${p.id}`}
              className={`task-selector${p.id === selected.id ? " active" : ""}`}
            >
              {p.kelasNama} · {p.mapelNama}
            </Link>
          ))}
          <TaskSelect
            basePath="/guru/kehadiran"
            selectedId={selected.id}
            options={pengajaranRows.map((p) => ({
              id: p.id,
              label: `${p.kelasNama} · ${p.mapelNama}`,
            }))}
          />
        </div>
        <div className="toolbar-right">
          <form method="get" className="date-filter-form">
            <input type="hidden" name="pengajaranId" value={selected.id} />
            <label htmlFor="tanggal" className="date-filter-label">
              Tanggal
            </label>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              defaultValue={tanggal}
              className="date-input"
              aria-label="Tanggal"
            />
            <button className="button button-secondary" type="submit">
              Tampilkan
            </button>
          </form>
          <ExportKehadiran
            santri={santri}
            kehadiran={kehadiranSemua}
            namaKelas={selected.kelasNama}
            namaMapel={selected.mapelNama}
            tanggalAwal={tanggal}
          />
          <RiwayatKehadiran riwayat={riwayat} />
        </div>
      </div>

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
    </>
  );
}
