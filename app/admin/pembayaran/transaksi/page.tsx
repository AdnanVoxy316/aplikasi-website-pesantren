import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { listPembayaranTransaksi } from "@/db/queries/admin";
import { rupiah, tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Transaksi pembayaran",
  description: "Histori transaksi pembayaran SPP via Mayar dan manual.",
};

export default async function AdminTransaksiPage() {
  const rows = await listPembayaranTransaksi();
  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Transaksi"
        description="Monitor transaksi Mayar, pembayaran manual, dan status sinkronisasi webhook."
      />
      <Panel title="Semua transaksi" subtitle={`${rows.length} transaksi`}>
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada transaksi. Transaksi muncul saat santri/wali menekan tombol Bayar Sekarang.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>No. tagihan</th>
                  <th>Provider</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Dibayar</th>
                  <th>Checkout</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.santriNama}</strong>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 10 }}>{row.tagihanNomor}</td>
                    <td>{row.provider}</td>
                    <td>{row.paymentMethod ?? "—"}</td>
                    <td>{rupiah(row.nominalDibayar)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          row.status === "paid"
                            ? "success"
                            : row.status === "pending" || row.status === "processing"
                              ? "warning"
                              : "danger"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{tanggalWaktuIndo(row.paidAt)}</td>
                    <td>
                      {row.checkoutUrl ? (
                        <a className="table-action" href={row.checkoutUrl} target="_blank" rel="noreferrer">
                          buka
                        </a>
                      ) : (
                        "—"
                      )}
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
