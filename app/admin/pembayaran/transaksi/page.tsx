import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { ToastButton } from "@/components/toast-button";
import {
  TransactionsTable,
  type TransactionRow,
} from "@/app/admin/pembayaran/transaksi/transactions-table";

export const metadata: Metadata = {
  title: "Transaksi SPP",
  description:
    "Lihat status internal, reference Mayar, metode, webhook terakhir, dan waktu pembayaran.",
};

const TRANSACTIONS: TransactionRow[] = [
  {
    id: "inv-0206",
    invoice: "#INV-0206",
    filterText: "#INV-0206 Aisyah Fitria",
    reference: "pay_8f21a9 · Mayar",
    name: "Aisyah Fitria",
    meta: "Ibtida A",
    amount: "Rp 350.000",
    method: "QRIS",
    webhook: "09 Feb, 08:31",
    status: { variant: "success", label: "Paid" },
    action: {
      icon: "eye",
      toast: "Payload webhook tersimpan untuk audit.",
      ariaLabel: "Lihat detail transaksi",
    },
  },
  {
    id: "inv-0205",
    invoice: "#INV-0205",
    filterText: "#INV-0205 Fauzan Ramadhan",
    reference: "pay_8f20d1 · Mayar",
    name: "Fauzan Ramadhan",
    meta: "Tsanawiyah 1",
    amount: "Rp 350.000",
    method: "Virtual account",
    webhook: "09 Feb, 07:52",
    status: { variant: "success", label: "Paid" },
    action: {
      icon: "eye",
      toast: "Payload webhook tersimpan untuk audit.",
      ariaLabel: "Lihat detail transaksi",
    },
  },
  {
    id: "inv-0204",
    invoice: "#INV-0204",
    filterText: "#INV-0204 Maya Salsabila",
    reference: "pay_8f1f2e · Mayar",
    name: "Maya Salsabila",
    meta: "Tsanawiyah 1",
    amount: "Rp 350.000",
    method: "Link Mayar",
    webhook: "09 Feb, 07:24",
    status: { variant: "warning", label: "Pending" },
    action: {
      icon: "refresh",
      toast: "Reconciliation mengambil status sah dari provider.",
      ariaLabel: "Reconcile transaksi",
    },
  },
  {
    id: "inv-0202",
    invoice: "#INV-0202",
    filterText: "#INV-0202 Ilham Akbar",
    reference: "pay_8f1a02 · Mayar",
    name: "Ilham Akbar",
    meta: "Ulya A",
    amount: "Rp 425.000",
    method: "Transfer",
    webhook: "08 Feb, 22:17",
    status: { variant: "danger", label: "Failed" },
    action: {
      icon: "alert",
      toast: "Detail error webhook siap dibuka.",
      ariaLabel: "Lihat error transaksi",
    },
  },
];

export default function AdminTransaksiPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Monitoring provider"
        title="Transaksi pembayaran"
        description="Lihat status internal, reference Mayar, metode, webhook terakhir, dan waktu pembayaran."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Data transaksi siap diekspor."
            >
              <Icon name="download" />
              Export transaksi
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Reconciliation dimulai dari status provider."
            >
              <Icon name="refresh" />
              Reconcile
            </ToastButton>
          </>
        }
      />
      <section className="metric-grid">
        <MetricCard
          icon="check-circle"
          label="Berhasil"
          value="378"
          note="Rp 128.400.000"
        />
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="clock" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Processing</span>
            <strong className="metric-value">22</strong>
            <span className="metric-note">Menunggu webhook</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="refresh" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Webhook diterima</span>
            <strong className="metric-value">402</strong>
            <span className="metric-note">99,2% diproses otomatis</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="alert" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Perlu dicek</span>
            <strong className="metric-value">3</strong>
            <span className="metric-note">Event gagal diproses</span>
          </div>
        </article>
      </section>
      <Panel
        title="Semua transaksi"
        subtitle="Provider: Mayar · Status terminal tidak dapat mundur sembarangan"
      >
        <TransactionsTable transactions={TRANSACTIONS} />
      </Panel>
      <PageFooter />
    </>
  );
}
