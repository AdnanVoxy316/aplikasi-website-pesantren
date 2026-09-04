import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Pembayaran SPP",
  description:
    "Pantau tagihan, transaksi Mayar, dan penerimaan SPP periode berjalan.",
};

type TransactionRow = {
  id: string;
  initials: string;
  tone?: "blue" | "gold" | "coral";
  name: string;
  meta: string;
  invoice: string;
  amount: string;
  method: string;
  time: string;
  status: { variant: "success" | "warning"; label: string };
};

const TRANSACTIONS: TransactionRow[] = [
  {
    id: "inv-0206",
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    meta: "Ibtida A",
    invoice: "#INV-0206",
    amount: "Rp 300.000",
    method: "QRIS",
    time: "09 Feb, 08:31",
    status: { variant: "success", label: "Paid" },
  },
  {
    id: "inv-0205",
    initials: "FR",
    tone: "blue",
    name: "Fauzan Ramadhan",
    meta: "Tsanawiyah 1",
    invoice: "#INV-0205",
    amount: "Rp 350.000",
    method: "Virtual account",
    time: "09 Feb, 07:52",
    status: { variant: "success", label: "Paid" },
  },
  {
    id: "inv-0204",
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    meta: "Tsanawiyah 1",
    invoice: "#INV-0204",
    amount: "Rp 350.000",
    method: "Link Mayar",
    time: "09 Feb, 07:24",
    status: { variant: "warning", label: "Pending" },
  },
];

const SIDE_STATS = [
  { label: "Sudah lunas", value: "78%" },
  { label: "Pending", value: "22" },
  { label: "Overdue", value: "14" },
];

export default function AdminPembayaranPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Keuangan pesantren"
        title="Dashboard pembayaran"
        description="Pantau tagihan, transaksi Mayar, dan penerimaan SPP periode berjalan."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Laporan pembayaran siap diekspor."
            >
              <Icon name="download" />
              Export laporan
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Wizard generate tagihan siap digunakan."
            >
              <Icon name="plus" />
              Generate tagihan
            </ToastButton>
          </>
        }
      />
      <div className="payment-hero">
        <div className="payment-total">
          <span className="payment-total-label">
            Total pembayaran berhasil · Februari 2026
          </span>
          <strong className="payment-total-value">Rp 128.400.000</strong>
          <span className="payment-total-note">
            378 transaksi berhasil dari 486 tagihan pada periode ini.
          </span>
          <ToastButton
            className="button button-secondary"
            message="Monitoring transaksi Mayar siap dibuka."
          >
            Lihat transaksi <Icon name="chevron-right" />
          </ToastButton>
        </div>
        <div className="payment-side-stat">
          {SIDE_STATS.map((stat) => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <section className="metric-grid" style={{ marginTop: 15 }}>
        <MetricCard
          icon="file"
          label="Total tagihan"
          value="486"
          note="Periode Februari 2026"
        />
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="clock" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Belum dibayar</span>
            <strong className="metric-value">86</strong>
            <span className="metric-note">Rp 29.400.000</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="refresh" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Menunggu</span>
            <strong className="metric-value">22</strong>
            <span className="metric-note">Menanti konfirmasi Mayar</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="alert" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Jatuh tempo lewat</span>
            <strong className="metric-value">14</strong>
            <span className="metric-note">Perlu pengingat wali</span>
          </div>
        </article>
      </section>
      <Panel
        title="Transaksi terbaru"
        subtitle="Status diperbarui dari webhook Mayar yang tervalidasi"
        actions={
          <Link href="/admin/pembayaran/transaksi" className="text-link">
            Semua transaksi <Icon name="chevron-right" />
          </Link>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Santri</th>
                <th>Invoice</th>
                <th>Nominal</th>
                <th>Metode</th>
                <th>Waktu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="person-cell">
                      <span
                        className={
                          row.tone ? `avatar-sm ${row.tone}` : "avatar-sm"
                        }
                      >
                        {row.initials}
                      </span>
                      <div>
                        <span className="person-name">{row.name}</span>
                        <span className="person-meta">{row.meta}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{row.invoice}</strong>
                  </td>
                  <td>{row.amount}</td>
                  <td>{row.method}</td>
                  <td>{row.time}</td>
                  <td>
                    <StatusBadge variant={row.status.variant}>
                      {row.status.label}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <PageFooter />
    </>
  );
}
