import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import {
  getRekapKehadiranSantri,
  listRiwayatKehadiranSantri,
} from "@/db/queries/santri";
import { getTahunAjaranAktif } from "@/db/queries/admin";
import { getAnakUntukWali, AnakSwitcher } from "../wali-helpers";
import { persenHadir } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kehadiran anak",
  description: "Rekap kehadiran anak Anda.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  hadir: "success",
  izin: "warning",
  sakit: "warning",
  alpa: "danger",
};

export default async function WaliKehadiranPage({
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
        <PageHeading kicker="Pantau anak" title="Kehadiran anak" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>Akun wali Anda belum dihubungkan dengan santri mana pun.</EmptyState>
        </Panel>
      </>
    );
  }

  const taAktif = await getTahunAjaranAktif();
  const [rekap, riwayat] = await Promise.all([
    getRekapKehadiranSantri(selected.santriId, taAktif?.id),
    listRiwayatKehadiranSantri(selected.santriId),
  ]);

  return (
    <>
      <PageHeading
        kicker="Pantau anak"
        title="Kehadiran anak"
        description={taAktif ? `Tahun ajaran ${taAktif.label}` : undefined}
      />
      <AnakSwitcher anakRows={anakRows} selectedId={selected.santriId} basePath="/wali/kehadiran" />
      <Panel
        title={selected.nama}
        subtitle={`NIS ${selected.nis}${selected.kelasNama ? ` · ${selected.kelasNama}` : ""}`}
      >
        <div className="stats-grid">
          <StatCard
            icon="users"
            tone="icon-green"
            label="Persentase hadir"
            value={`${persenHadir(rekap.hadir, rekap.total)}%`}
            note={`${rekap.hadir} dari ${rekap.total} catatan`}
          />
          <StatCard icon="clock" tone="icon-gold" label="Izin / sakit" value={String(rekap.izin + rekap.sakit)} note={`${rekap.izin} izin · ${rekap.sakit} sakit`} />
          <StatCard icon="alert" tone="icon-coral" label="Alpa" value={String(rekap.alpa)} note="tanpa keterangan" />
        </div>
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
                      <StatusBadge variant={STATUS_VARIANT[r.status] ?? "neutral"}>{r.status}</StatusBadge>
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
