import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { ToastButton } from "@/components/toast-button";
import { BillsTable, type BillRow } from "@/app/admin/pembayaran/tagihan/bills-table";

export const metadata: Metadata = {
  title: "Tagihan SPP",
  description:
    "Generate tagihan secara idempotent dan pantau snapshot nominal per santri.",
};

const BILLS: BillRow[] = [
  {
    id: "bill-0206",
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    filterText: "Aisyah Fitria",
    meta: "Ibtida A",
    number: "#BILL-0206",
    period: "Feb 2026",
    amount: "Rp 350.000",
    dueDate: "10 Feb 2026",
    status: { variant: "success", label: "Paid" },
    action: {
      icon: "eye",
      toast: "Detail tagihan siap dibuka.",
      ariaLabel: "Lihat tagihan",
    },
  },
  {
    id: "bill-0205",
    initials: "FR",
    tone: "blue",
    name: "Fauzan Ramadhan",
    filterText: "Fauzan Ramadhan",
    meta: "Tsanawiyah 1",
    number: "#BILL-0205",
    period: "Feb 2026",
    amount: "Rp 350.000",
    dueDate: "10 Feb 2026",
    status: { variant: "warning", label: "Unpaid" },
    action: {
      icon: "megaphone",
      toast: "Pengingat tagihan siap dikirim.",
      ariaLabel: "Kirim pengingat",
    },
  },
  {
    id: "bill-0204",
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    filterText: "Maya Salsabila",
    meta: "Tsanawiyah 1",
    number: "#BILL-0204",
    period: "Feb 2026",
    amount: "Rp 350.000",
    dueDate: "10 Feb 2026",
    status: { variant: "neutral", label: "Pending" },
    action: {
      icon: "refresh",
      toast: "Reconcile transaksi melalui provider.",
    },
  },
  {
    id: "bill-0203",
    initials: "IA",
    name: "Ilham Akbar",
    filterText: "Ilham Akbar",
    meta: "Ulya A",
    number: "#BILL-0203",
    period: "Feb 2026",
    amount: "Rp 425.000",
    dueDate: "05 Feb 2026",
    status: { variant: "danger", label: "Expired" },
    action: {
      icon: "external",
      toast: "Invoice baru dapat dibuat sesuai kebijakan.",
    },
  },
];

export default function AdminTagihanPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Kewajiban periode"
        title="Tagihan SPP"
        description="Generate tagihan secara idempotent dan pantau snapshot nominal per santri."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Tagihan terpilih siap diekspor."
            >
              <Icon name="download" />
              Export
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
      <section className="metric-grid">
        <MetricCard
          icon="file"
          label="Tagihan baru"
          value="486"
          note="Februari 2026"
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
            <Icon name="check-circle" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Sudah lunas</span>
            <strong className="metric-value">378</strong>
            <span className="metric-note">Snapshot konsisten</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="alert" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Lewat jatuh tempo</span>
            <strong className="metric-value">14</strong>
            <span className="metric-note">Perlu ditindaklanjuti</span>
          </div>
        </article>
      </section>
      <Panel
        title="Daftar tagihan"
        subtitle="Business key: santri + periode bulan + periode tahun"
        actions={
          <div className="toolbar-right">
            <select className="select-control" aria-label="Filter periode">
              <option>Februari 2026</option>
              <option>Januari 2026</option>
              <option>Maret 2026</option>
            </select>
            <select className="select-control" aria-label="Filter status tagihan">
              <option>Semua status</option>
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Pending</option>
            </select>
          </div>
        }
      >
        <BillsTable bills={BILLS} />
      </Panel>
      <PageFooter />
    </>
  );
}
