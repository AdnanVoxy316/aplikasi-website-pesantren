import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState, PageFooter } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRow } from "@/components/ui/lists";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import {
  getSantriProfile,
  getRekapKehadiranSantri,
  listRiwayatKehadiranSantri,
} from "@/db/queries/santri";
import { getTahunAjaranAktif } from "@/db/queries/admin";
import { persenHadir } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kehadiran",
  description: "Rekap dan riwayat kehadiran.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  hadir: "success",
  izin: "warning",
  sakit: "warning",
  alpa: "danger",
};

export default async function SantriKehadiranPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const taAktif = await getTahunAjaranAktif();
  const [rekap, riwayat] = await Promise.all([
    getRekapKehadiranSantri(profile.id, taAktif?.id),
    listRiwayatKehadiranSantri(profile.id),
  ]);

  return (
    <>
      <PageHeading
        kicker="Belajar"
        title="Kehadiran"
        description={taAktif ? `Rekap tahun ajaran ${taAktif.label}.` : "Rekap kehadiran."}
      />

      <div className="stats-grid">
        <StatCard
          icon="users"
          tone="icon-green"
          label="Persentase hadir"
          value={`${persenHadir(rekap.hadir, rekap.total)}%`}
          note={`${rekap.hadir} dari ${rekap.total} catatan`}
        />
        <StatCard icon="check-circle" tone="icon-blue" label="Hadir" value={String(rekap.hadir)} note="pertemuan" />
        <StatCard icon="clock" tone="icon-gold" label="Izin / sakit" value={String(rekap.izin + rekap.sakit)} note={`${rekap.izin} izin · ${rekap.sakit} sakit`} />
        <StatCard icon="alert" tone="icon-coral" label="Alpa" value={String(rekap.alpa)} note="tanpa keterangan" />
      </div>

      <div className="form-layout">
        <Panel title="Komposisi kehadiran">
          {rekap.total === 0 ? (
            <EmptyState>Belum ada catatan kehadiran dari guru.</EmptyState>
          ) : (
            <div>
              <ProgressRow label="Hadir" value={String(rekap.hadir)} percent={persenHadir(rekap.hadir, rekap.total)} />
              <ProgressRow label="Izin" value={String(rekap.izin)} percent={persenHadir(rekap.izin, rekap.total)} />
              <ProgressRow label="Sakit" value={String(rekap.sakit)} percent={persenHadir(rekap.sakit, rekap.total)} />
              <ProgressRow label="Alpa" value={String(rekap.alpa)} percent={persenHadir(rekap.alpa, rekap.total)} />
            </div>
          )}
        </Panel>

        <Panel title="Riwayat terakhir" subtitle={`${riwayat.length} catatan`}>
          {riwayat.length === 0 ? (
            <EmptyState>Belum ada riwayat kehadiran.</EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Mapel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{r.tanggal}</strong>
                      </td>
                      <td>{r.mapelNama ?? "Harian"}</td>
                      <td>
                        <StatusBadge variant={STATUS_VARIANT[r.status] ?? "neutral"}>
                          {r.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
