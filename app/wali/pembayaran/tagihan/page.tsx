import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { listAnakWali, listTagihanAnak } from "@/db/queries/santri";
import { BayarButton } from "@/components/shared/bayar-button";
import { rupiah, labelPeriode, tanggalIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tagihan anak",
  description: "Tagihan SPP anak yang terhubung dengan akun Anda.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  paid: "success",
  pending: "warning",
  processing: "warning",
  unpaid: "neutral",
  draft: "neutral",
  cancelled: "danger",
  expired: "danger",
  failed: "danger",
};

export default async function WaliTagihanPage() {
  const session = await requireRole("wali");
  const anakRows = await listAnakWali(session.user.id);

  if (anakRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Keuangan" title="Tagihan anak" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>Akun wali Anda belum dihubungkan dengan santri mana pun.</EmptyState>
        </Panel>
      </>
    );
  }

  const santriIds = anakRows.map((a) => a.santriId);
  const rows = await listTagihanAnak(santriIds);

  return (
    <>
      <PageHeading
        kicker="Keuangan"
        title="Tagihan anak"
        description="Anda hanya dapat melihat dan membayar tagihan anak yang terhubung dengan akun Anda."
      />
      <Panel title="Semua tagihan" subtitle={`${rows.length} tagihan`}>
        {rows.length === 0 ? (
          <EmptyState>Belum ada tagihan SPP untuk anak Anda.</EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Anak</th>
                  <th>Periode</th>
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
                        <strong>{row.santriNama}</strong>
                      </td>
                      <td>{labelPeriode(row.periodeBulan, row.periodeTahun)}</td>
                      <td>{rupiah(row.totalTagihan)}</td>
                      <td>{tanggalIndo(row.jatuhTempo)}</td>
                      <td>
                        <span className={`status-badge ${STATUS_VARIANT[row.status] ?? "neutral"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        {canPay ? (
                          <BayarButton tagihanId={row.id} />
                        ) : row.status === "paid" ? (
                          <span className="status-badge success">Lunas</span>
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
