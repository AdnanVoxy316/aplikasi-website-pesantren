import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import {
  listAnakWali,
  listTagihanAnak,
  listPembayaranPaidAnak,
  mapPembayaranPerTagihan,
} from "@/db/queries/santri";
import { BayarButton } from "@/components/shared/bayar-button";
import { BuktiButton } from "@/components/shared/bukti-pembayaran";
import { BatalkanPembayaranButton } from "@/components/shared/batalkan-pembayaran-button";
import { RincianTagihanButton } from "@/components/shared/rincian-tagihan";
import { listItemTagihan, mapItemTagihan } from "@/db/queries/pembayaran";
import { rupiah, labelPeriode, tanggalIndo } from "@/lib/format";
import { paymentStatusLabel, paymentStatusVariant } from "@/lib/status";

export const metadata: Metadata = {
  title: "Tagihan anak",
  description: "Tagihan anak yang terhubung dengan akun Anda.",
};

export default async function WaliTagihanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tagihan?: string }>;
}) {
  const session = await requireRole("wali");
  const sp = await searchParams;
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
  const [rows, paidRows] = await Promise.all([
    listTagihanAnak(santriIds),
    listPembayaranPaidAnak(santriIds),
  ]);
  const buktiPerTagihan = mapPembayaranPerTagihan(paidRows);
  const itemMap = mapItemTagihan(await listItemTagihan(rows.map((r) => r.id)));

  return (
    <>
      <PageHeading
        kicker="Keuangan"
        title="Tagihan anak"
        description="Anda hanya dapat melihat dan membayar tagihan anak yang terhubung dengan akun Anda. Pembayaran online via Midtrans."
      />

      {sp.status === "finish" ? (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            marginBottom: 14,
            background: "var(--surface-soft)",
            border: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--ink-soft)",
          }}
        >
          <strong>Terima kasih!</strong> Pembayaran sedang dikonfirmasi Midtrans. Status
          berubah menjadi <em>Lunas</em> otomatis setelah notifikasi diterima. Muat ulang
          halaman beberapa saat lagi.
        </div>
      ) : null}
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
                  const pembayaranId = buktiPerTagihan.get(row.id);
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.santriNama}</strong>
                      </td>
                      <td>{labelPeriode(row.periodeBulan, row.periodeTahun)}</td>
                      <td>{rupiah(row.totalTagihan)}</td>
                      <td>{tanggalIndo(row.jatuhTempo)}</td>
                      <td>
                        <span className={`status-badge ${paymentStatusVariant(row.status)}`}>
                          {paymentStatusLabel(row.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {canPay ? (
                            <>
                              <BayarButton
                                tagihanId={row.id}
                                label={row.status === "pending" ? "Lanjutkan bayar" : "Bayar Sekarang"}
                              />
                              {row.status === "pending" ? (
                                <BatalkanPembayaranButton tagihanId={row.id} />
                              ) : null}
                            </>
                          ) : row.status === "paid" && pembayaranId ? (
                            <BuktiButton pembayaranId={pembayaranId} variant="button" label="Lihat bukti" />
                          ) : row.status === "paid" ? (
                            <span className="status-badge success">Lunas</span>
                          ) : null}
                          {(itemMap.get(row.id)?.length ?? 0) > 0 ? (
                            <RincianTagihanButton
                              items={itemMap.get(row.id)!}
                              nomorTagihan={row.nomorTagihan}
                              totalTagihan={row.totalTagihan}
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
    </>
  );
}
