import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import {
  getSantriProfile,
  listTagihanUntukSantri,
  listPembayaranPaidSantri,
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
  title: "Tagihan",
  description: "Tagihan Anda dan tombol pembayaran online via Midtrans.",
};

export default async function SantriTagihanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tagihan?: string }>;
}) {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);
  const sp = await searchParams;

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const [rows, paidRows] = await Promise.all([
    listTagihanUntukSantri(profile.id),
    listPembayaranPaidSantri(profile.id),
  ]);
  const buktiPerTagihan = mapPembayaranPerTagihan(paidRows);
  const itemMap = mapItemTagihan(await listItemTagihan(rows.map((r) => r.id)));

  return (
    <>
      <PageHeading
        kicker="Keuangan"
        title="Tagihan"
        description="Pembayaran diproses aman melalui Midtrans (QRIS, transfer, e-wallet). Status lunas muncul otomatis setelah konfirmasi provider."
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
          <strong>Terima kasih!</strong> Pembayaran sedang dikonfirmasi. Status akan berubah
          menjadi <em>Lunas</em> otomatis setelah Midtrans mengirim notifikasi. Muat ulang
          halaman beberapa saat lagi.
        </div>
      ) : null}

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
                  const pembayaranId = buktiPerTagihan.get(row.id);
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
                            <span className="status-badge success">Lunas, alhamdulillah</span>
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
