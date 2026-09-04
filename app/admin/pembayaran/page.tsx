import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter, EmptyState } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { getPembayaranStats, listPembayaranTransaksi } from "@/db/queries/admin";
import { listTarifSpp } from "@/db/queries/pembayaran";
import { rupiah, tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard pembayaran",
  description: "Ringkasan tagihan dan transaksi SPP.",
};

export default async function AdminPembayaranPage() {
  const [stats, transaksi, tarif] = await Promise.all([
    getPembayaranStats(),
    listPembayaranTransaksi(),
    listTarifSpp(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Dashboard pembayaran"
        description="Ringkasan tagihan, pembayaran online via Mayar, dan transaksi manual."
        actions={
          <Link className="button button-primary" href="/admin/pembayaran/tagihan">
            Kelola tagihan
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard
          icon="file"
          tone="icon-blue"
          label="Total tagihan"
          value={String(stats.totalTagihan)}
          note={rupiah(stats.totalNominal)}
        />
        <StatCard
          icon="wallet"
          tone="icon-green"
          label="Sudah lunas"
          value={String(stats.lunas.jumlah)}
          note={rupiah(stats.lunas.total)}
        />
        <StatCard
          icon="clock"
          tone="icon-gold"
          label="Belum dibayar"
          value={String(stats.belumBayar.jumlah)}
          note={rupiah(stats.belumBayar.total)}
        />
        <StatCard
          icon="chart"
          tone="icon-coral"
          label="Menunggu pembayaran"
          value={String(stats.pending.jumlah)}
          note="Transaksi Mayar aktif"
        />
      </div>

      <div className="form-layout">
        <Panel title="Transaksi terbaru" subtitle={`${transaksi.length} transaksi terakhir`}>
          {transaksi.length === 0 ? (
            <EmptyState>
              Belum ada transaksi. Tagihan dibayar via menu Tagihan oleh santri/wali.
            </EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Santri</th>
                    <th>Provider</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.slice(0, 8).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.santriNama}</strong>
                      </td>
                      <td>{t.provider}</td>
                      <td>{rupiah(t.nominalDibayar)}</td>
                      <td>
                        <span className={`status-badge ${t.status === "paid" ? "success" : t.status === "pending" ? "warning" : "neutral"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{tanggalWaktuIndo(t.paidAt ?? t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Tarif aktif" subtitle={`${tarif.filter((t) => t.isActive).length} tarif aktif`}>
          {tarif.length === 0 ? (
            <EmptyState>Belum ada tarif SPP. Buat tarif pada menu Tarif SPP.</EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Nominal</th>
                    <th>Berlaku</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tarif.slice(0, 6).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.nama}</strong>
                      </td>
                      <td>{rupiah(t.nominal)}</td>
                      <td>
                        {t.berlakuMulai}
                        {t.berlakuSampai ? ` s/d ${t.berlakuSampai}` : " →"}
                      </td>
                      <td>
                        <span className={`status-badge ${t.isActive ? "success" : "neutral"}`}>
                          {t.isActive ? "aktif" : "nonaktif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
            <Link className="button button-secondary" href="/admin/pembayaran/tarif-spp">
              Kelola tarif
            </Link>
          </div>
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
