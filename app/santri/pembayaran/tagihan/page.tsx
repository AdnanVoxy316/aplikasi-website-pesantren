import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, listTagihanUntukSantri } from "@/db/queries/santri";
import { BayarButton } from "@/components/shared/bayar-button";
import { rupiah, labelPeriode, tanggalIndo } from "@/lib/format";
import { paymentStatusLabel, paymentStatusVariant } from "@/lib/status";

export const metadata: Metadata = {
  title: "Tagihan SPP",
  description: "Tagihan SPP Anda dan tombol pembayaran online via Mayar.",
};

export default async function SantriTagihanPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const rows = await listTagihanUntukSantri(profile.id);

  return (
    <>
      <PageHeading
        kicker="Keuangan"
        title="Tagihan SPP"
        description="Pembayaran diproses aman melalui Mayar (QRIS, transfer, e-wallet). Status lunas muncul otomatis setelah konfirmasi provider."
      />
      <Panel title="Daftar tagihan" subtitle={`${rows.length} tagihan`}>
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada tagihan SPP. Tagihan dibuat oleh admin pesantren per periode.
          </EmptyState>
        ) : (
          <div className="table-shell table-shell-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>No. tagihan</th>
                  <th>Total</th>
                  <th>Jatuh tempo</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const canPay = row.status === "unpaid" || row.status === "pending";
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{labelPeriode(row.periodeBulan, row.periodeTahun)}</strong>
                      </td>
                      <td className="invoice-number-small">{row.nomorTagihan}</td>
                      <td>{rupiah(row.totalTagihan)}</td>
                      <td>{tanggalIndo(row.jatuhTempo)}</td>
                      <td>
                        <span className={`status-badge ${paymentStatusVariant(row.status)}`}>
                          {paymentStatusLabel(row.status)}
                        </span>
                      </td>
                      <td>
                        {canPay ? (
                          <BayarButton tagihanId={row.id} />
                        ) : row.status === "paid" ? (
                          <span className="status-badge success">Lunas, alhamdulillah</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
