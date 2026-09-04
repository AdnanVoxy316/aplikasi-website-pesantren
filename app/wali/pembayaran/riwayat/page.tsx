import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Riwayat Pembayaran Anak",
  description: "Pantau pembayaran SPP untuk semua anak yang terhubung.",
};

type Metric = {
  icon: IconName;
  tone?: "blue" | "gold" | "coral";
  label: string;
  value: string;
  note: string;
};

const METRICS: Metric[] = [
  { icon: "check-circle", label: "Total dibayar", value: "Rp 4,2 jt", note: "12 periode dua anak" },
  { icon: "users", tone: "blue", label: "Anak terhubung", value: "2", note: "Aisyah & Maya" },
  { icon: "clock", tone: "gold", label: "Tagihan aktif", value: "2", note: "Belum dibayar bulan ini" },
  { icon: "download", tone: "coral", label: "Bukti tersedia", value: "12", note: "Siap diunduh" },
];

type Payment = {
  initials: string;
  tone: "gold" | "coral";
  name: string;
  className: string;
  period: string;
  invoice: string;
  date: string;
  amount: string;
  toast: string;
};

const PAYMENTS: Payment[] = [
  {
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    className: "Ibtida A",
    period: "Januari 2026",
    invoice: "#INV-0106",
    date: "08 Jan 2026",
    amount: "Rp 350.000",
    toast: "Bukti pembayaran Aisyah siap diunduh.",
  },
  {
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    className: "Tsanawiyah 1",
    period: "Januari 2026",
    invoice: "#INV-0107",
    date: "09 Jan 2026",
    amount: "Rp 350.000",
    toast: "Bukti pembayaran Maya siap diunduh.",
  },
  {
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    className: "Ibtida A",
    period: "Desember 2025",
    invoice: "#INV-1225",
    date: "08 Des 2025",
    amount: "Rp 350.000",
    toast: "Bukti pembayaran Aisyah siap diunduh.",
  },
  {
    initials: "MS",
    tone: "coral",
    name: "Maya Salsabila",
    className: "Tsanawiyah 1",
    period: "Desember 2025",
    invoice: "#INV-1226",
    date: "08 Des 2025",
    amount: "Rp 350.000",
    toast: "Bukti pembayaran Maya siap diunduh.",
  },
];

export default function WaliPembayaranRiwayatPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Bukti pembayaran keluarga"
        title="Riwayat pembayaran"
        description="Pantau pembayaran SPP untuk semua anak yang terhubung."
        actions={
          <Link className="button button-primary" href="/wali/pembayaran/tagihan">
            <Icon name="wallet" />
            Lihat tagihan aktif
          </Link>
        }
      />

      <section className="metric-grid" aria-label="Ringkasan pembayaran">
        {METRICS.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-icon${metric.tone ? ` ${metric.tone}` : ""}`}>
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
        title="Semua pembayaran anak"
        subtitle="Histori terkonfirmasi dari Mayar"
        actions={
          <div className="toolbar-right">
            <select className="select-control">
              <option>Semua anak</option>
              <option>Aisyah Fitria</option>
              <option>Maya Salsabila</option>
            </select>
            <select className="select-control">
              <option>Semua tahun</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
        }
      >
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Anak</th>
                <th>Periode</th>
                <th>Invoice</th>
                <th>Tanggal bayar</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Bukti</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((payment) => (
                <tr key={payment.invoice}>
                  <td>
                    <div className="person-cell">
                      <span className={`avatar-sm ${payment.tone}`}>{payment.initials}</span>
                      <div>
                        <span className="person-name">{payment.name}</span>
                        <span className="person-meta">{payment.className}</span>
                      </div>
                    </div>
                  </td>
                  <td>{payment.period}</td>
                  <td>{payment.invoice}</td>
                  <td>{payment.date}</td>
                  <td>{payment.amount}</td>
                  <td>
                    <StatusBadge variant="success">Paid</StatusBadge>
                  </td>
                  <td>
                    <ToastButton className="table-action" message={payment.toast} ariaLabel="Unduh bukti">
                      <Icon name="download" />
                    </ToastButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Menampilkan 4 dari 12 pembayaran</span>
          <div className="pagination-buttons">
            <ToastButton className="pagination-button active" message="Halaman 1 aktif.">
              1
            </ToastButton>
            <ToastButton className="pagination-button" message="Halaman 2 siap dibuka.">
              2
            </ToastButton>
            <ToastButton className="pagination-button" message="Halaman berikutnya siap dibuka.">
              <Icon name="chevron-right" />
            </ToastButton>
          </div>
        </div>
      </Panel>

      <footer className="footer">
        <span className="footer-brand">
          <Icon name="mosque" />
          ELMS Pesantren · Prototype HTML
        </span>
        <span className="footer-note">Wali hanya melihat histori pembayaran anak yang terhubung</span>
      </footer>
    </>
  );
}
