import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Riwayat Pembayaran",
  description:
    "Lihat seluruh pembayaran SPP yang sudah dikonfirmasi oleh provider Mayar.",
};

const METRICS = [
  {
    icon: "check-circle" as const,
    tone: "",
    label: "Total dibayar",
    value: "Rp 2,1 jt",
    note: "6 periode lunas",
  },
  {
    icon: "file" as const,
    tone: "blue",
    label: "Invoice lunas",
    value: "6",
    note: "Semua via Mayar",
  },
  {
    icon: "clock" as const,
    tone: "gold",
    label: "Pending",
    value: "0",
    note: "Tidak ada transaksi tertunda",
  },
  {
    icon: "download" as const,
    tone: "coral",
    label: "Bukti tersedia",
    value: "6",
    note: "Siap diunduh",
  },
];

const PAYMENTS = [
  {
    period: "Januari 2026",
    invoice: "#INV-0106",
    date: "08 Jan 2026",
    method: "QRIS",
    total: "Rp 350.000",
  },
  {
    period: "Desember 2025",
    invoice: "#INV-1225",
    date: "08 Des 2025",
    method: "Virtual account",
    total: "Rp 350.000",
  },
  {
    period: "November 2025",
    invoice: "#INV-1125",
    date: "09 Nov 2025",
    method: "QRIS",
    total: "Rp 350.000",
  },
  {
    period: "Oktober 2025",
    invoice: "#INV-1025",
    date: "10 Okt 2025",
    method: "Link Mayar",
    total: "Rp 350.000",
  },
];

export default function SantriRiwayatPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Bukti pembayaran"
        title="Riwayat pembayaran"
        description="Lihat seluruh pembayaran SPP yang sudah dikonfirmasi oleh provider."
        actions={
          <Link className="button button-primary" href="/santri/pembayaran/tagihan">
            <Icon name="wallet" />
            Lihat tagihan aktif
          </Link>
        }
      />

      <section className="metric-grid" aria-label="Ringkasan pembayaran">
        {METRICS.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span
              className={metric.tone ? `metric-icon ${metric.tone}` : "metric-icon"}
            >
              <Icon name={metric.icon} />
            </span>
            <div className="metric-copy">
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-note">{metric.note}</span>
            </div>
          </article>
        ))}
      </section>

      <Panel
        title="Semua pembayaran"
        subtitle="Histori berdasarkan santri dan periode tagihan"
        actions={
          <select className="select-control" aria-label="Filter tahun">
            <option>Semua tahun</option>
            <option>2026</option>
            <option>2025</option>
          </select>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Nomor invoice</th>
                <th>Tanggal bayar</th>
                <th>Metode</th>
                <th>Total dibayar</th>
                <th>Status</th>
                <th>Bukti</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((payment) => (
                <tr key={payment.invoice}>
                  <td>
                    <strong>{payment.period}</strong>
                  </td>
                  <td>{payment.invoice}</td>
                  <td>{payment.date}</td>
                  <td>{payment.method}</td>
                  <td>{payment.total}</td>
                  <td>
                    <span className="status-badge success">Paid</span>
                  </td>
                  <td>
                    <ToastButton
                      className="table-action"
                      message={`Bukti pembayaran ${payment.period.split(" ")[0]} siap diunduh.`}
                      ariaLabel={`Unduh bukti ${payment.period.split(" ")[0]}`}
                    >
                      <Icon name="download" />
                    </ToastButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Menampilkan 4 dari 6 pembayaran</span>
          <div className="pagination-buttons">
            <ToastButton
              className="pagination-button active"
              message="Halaman 1 sedang ditampilkan."
            >
              1
            </ToastButton>
            <ToastButton
              className="pagination-button"
              ariaLabel="Halaman berikutnya"
              message="Navigasi halaman tersedia pada versi aplikasi berikutnya."
            >
              <Icon name="chevron-right" />
            </ToastButton>
          </div>
        </div>
      </Panel>

      <PageFooter />
    </>
  );
}
