import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { listPembayaranTransaksi } from "@/db/queries/admin";
import { ExportExcelPanel } from "@/components/shared/export-excel-panel";
import { BuktiButton } from "@/components/shared/bukti-pembayaran";
import { SimulasiPembayaranButton } from "@/components/shared/simulasi-pembayaran-button";
import { BatalkanPembayaranButton } from "@/components/shared/batalkan-pembayaran-button";
import { QrPembayaranButton } from "@/components/shared/qr-pembayaran-button";
import { labelMetode, labelProvider } from "@/lib/bukti";
import { rupiah, tanggalWaktuIndo, labelPeriode } from "@/lib/format";
import { paymentStatusLabel, paymentStatusVariant } from "@/lib/status";

export const metadata: Metadata = {
  title: "Transaksi pembayaran",
  description: "Histori transaksi pembayaran SPP via Midtrans dan catatan manual admin.",
};

export default async function AdminTransaksiPage() {
  const rows = await listPembayaranTransaksi();
  const sandbox = process.env.MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() !== "true";

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Transaksi"
        description="Pantau transaksi Midtrans, pembayaran tunai/transfer yang dicatat admin, dan status webhook."
      />

      <ExportExcelPanel />

      <Panel title="Semua transaksi" subtitle={`${rows.length} transaksi`}>
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada transaksi. Transaksi muncul saat santri/wali menekan tombol Bayar Sekarang
            atau admin mencatat pembayaran manual.
          </EmptyState>
        ) : (
          <div className="table-shell table-shell-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Periode</th>
                  <th>Provider</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Dibayar</th>
                  <th>Dicatat oleh</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const lunas = row.status === "paid";
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.santriNama}</strong>
                        <div className="invoice-number-small">{row.tagihanNomor}</div>
                      </td>
                      <td>{labelPeriode(row.periodeBulan, row.periodeTahun)}</td>
                      <td>{labelProvider(row.provider)}</td>
                      <td>{labelMetode(row.provider, row.paymentMethod)}</td>
                      <td>{rupiah(row.nominalDibayar ?? row.totalTagihan)}</td>
                      <td>
                        <span className={`status-badge ${paymentStatusVariant(row.status)}`}>
                          {paymentStatusLabel(row.status)}
                        </span>
                      </td>
                      <td>{tanggalWaktuIndo(row.paidAt)}</td>
                      <td>
                        {row.dicatatOlehNama ?? "—"}
                        {row.catatan ? (
                          <div className="invoice-number-small">{row.catatan}</div>
                        ) : null}
                      </td>
                      <td>
                        <div className="table-actions">
                          {lunas ? <BuktiButton pembayaranId={row.id} /> : null}
                          {!lunas && row.checkoutUrl ? (
                            <a
                              className="table-action"
                              href={row.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka halaman pembayaran"
                            >
                              buka
                            </a>
                          ) : null}
                          {!lunas && row.provider === "midtrans" ? (
                            <QrPembayaranButton pembayaranId={row.id} />
                          ) : null}
                          {!lunas && sandbox && row.provider === "midtrans" ? (
                            <SimulasiPembayaranButton pembayaranId={row.id} />
                          ) : null}
                          {!lunas && row.provider === "midtrans" ? (
                            <BatalkanPembayaranButton
                              tagihanId={row.tagihanId}
                              variant="icon"
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {sandbox ? (
        <p className="panel-subtitle" style={{ marginTop: 10 }}>
          Mode sandbox aktif — tombol <strong>QR</strong> menampilkan QRIS & URL gambar QR untuk
          ditempel ke Simulator QRIS Midtrans, tombol <strong>simulasi lunas</strong> untuk uji
          cepat tanpa webhook. Matikan dengan MIDTRANS_IS_PRODUCTION=true.
        </p>
      ) : null}
    </>
  );
}
