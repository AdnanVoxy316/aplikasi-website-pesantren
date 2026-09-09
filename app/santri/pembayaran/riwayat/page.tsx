import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, listRiwayatPembayaranSantri } from "@/db/queries/santri";
import { rupiah, labelPeriode, tanggalWaktuIndo } from "@/lib/format";
import { paymentStatusLabel, paymentStatusVariant } from "@/lib/status";

export const metadata: Metadata = {
  title: "Riwayat pembayaran",
  description: "Histori pembayaran SPP Anda.",
};

export default async function SantriRiwayatPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const rows = await listRiwayatPembayaranSantri(profile.id);

  return (
    <>
      <PageHeading
        kicker="Keuangan"
        title="Riwayat pembayaran"
        description="Semua transaksi pembayaran SPP — online via Mayar maupun catatan manual dari admin."
      />
      <Panel title="Histori transaksi" subtitle={`${rows.length} transaksi`}>
        {rows.length === 0 ? (
          <EmptyState>Belum ada transaksi pembayaran.</EmptyState>
        ) : (
          <div className="table-shell table-shell-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Provider</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{labelPeriode(row.periodeBulan, row.periodeTahun)}</strong>
                      <div className="invoice-number-small">{row.nomorTagihan}</div>
                    </td>
                    <td>{row.provider}</td>
                    <td>{row.paymentMethod ?? "—"}</td>
                    <td>{rupiah(row.nominalDibayar)}</td>
                    <td>
                        <span className={`status-badge ${paymentStatusVariant(row.status)}`}>
                          {paymentStatusLabel(row.status)}
                      </span>
                    </td>
                    <td>{tanggalWaktuIndo(row.paidAt ?? row.createdAt)}</td>
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
