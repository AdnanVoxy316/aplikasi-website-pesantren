import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Tagihan SPP Anak",
  description: "Bayar tagihan anak yang terhubung melalui checkout Mayar.",
};

const STEPS = [
  { title: "Pilih tagihan anak", description: "Pastikan nama dan nomor tagihan sesuai." },
  { title: "Lanjut ke Mayar", description: "Pilih metode pembayaran yang tersedia." },
  { title: "Tunggu konfirmasi", description: "Status paid dikirim melalui webhook resmi." },
];

export default function WaliPembayaranTagihanPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Keuangan keluarga"
        title="Tagihan SPP anak"
        description="Bayar tagihan anak yang terhubung melalui checkout Mayar."
        actions={
          <Link className="button button-secondary" href="/wali/pembayaran/riwayat">
            <Icon name="clock" />
            Riwayat pembayaran
          </Link>
        }
      />

      <section className="child-switcher">
        <span className="avatar-sm gold">AF</span>
        <div className="child-switcher-copy">
          <span className="child-switcher-name">Tagihan Aisyah Fitria</span>
          <span className="child-switcher-meta">NIS 20260124 · Ibtida A</span>
        </div>
        <select className="select-control" aria-label="Pilih anak">
          <option>Aisyah Fitria</option>
          <option>Maya Salsabila</option>
        </select>
      </section>

      <section className="notice warning" style={{ marginTop: "15px" }}>
        <Icon name="clock" />
        <div>
          <strong>Tagihan Februari belum dibayar</strong>
          Jatuh tempo 10 Februari 2026. Pastikan membayar untuk anak yang tepat.
        </div>
      </section>

      <div className="content-grid" style={{ marginTop: "15px" }}>
        <Panel
          title="Tagihan aktif Aisyah"
          subtitle="Nominal tersimpan sebagai snapshot saat tagihan dibuat"
          bodyClassName="panel-body"
          actions={<StatusBadge variant="warning">Unpaid</StatusBadge>}
        >
          <div className="invoice-card">
            <div className="invoice-card-head">
              <div>
                <div className="invoice-label">Nomor tagihan</div>
                <strong className="invoice-number">#BILL-0206</strong>
              </div>
              <span className="invoice-period">Februari 2026</span>
            </div>
            <div className="invoice-line">
              <span>SPP Reguler</span>
              <strong>Rp 350.000</strong>
            </div>
            <div className="invoice-line">
              <span>Diskon</span>
              <strong>Rp 0</strong>
            </div>
            <div className="invoice-line total">
              <span>Total pembayaran</span>
              <strong>Rp 350.000</strong>
            </div>
            <ToastButton className="button button-primary invoice-button" message="Checkout Mayar akan dibuka pada versi produksi.">
              <Icon name="wallet" />
              Bayar sekarang <Icon name="external" />
            </ToastButton>
          </div>
        </Panel>

        <Panel
          title="Keamanan pembayaran"
          subtitle="Akses wali berdasarkan relasi anak"
          bodyClassName="panel-body"
        >
          <div className="notice">
            <Icon name="shield" />
            <div>
              <strong>Akun terhubung</strong>
              Anda hanya dapat membayar dan melihat tagihan anak yang terdaftar di akun wali.
            </div>
          </div>
          <div className="step-list" style={{ marginTop: "12px" }}>
            {STEPS.map((step, index) => (
              <div className="step-item" key={step.title}>
                <span className="step-number">{index + 1}</span>
                <div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Tagihan anak lainnya"
        subtitle="Switch anak untuk melihat detail"
        bodyClassName="panel-body"
      >
        <div className="bill-list">
          <div className="bill-row">
            <div>
              <div className="bill-period">Maya Salsabila · Februari 2026</div>
              <div className="bill-number">#BILL-0207 · Tsanawiyah 1 · Jatuh tempo 10 Feb</div>
            </div>
            <strong className="bill-amount">Rp 350.000</strong>
            <StatusBadge variant="warning">Belum dibayar</StatusBadge>
          </div>
        </div>
      </Panel>

      <footer className="footer">
        <span className="footer-brand">
          <Icon name="mosque" />
          ELMS Pesantren · Prototype HTML
        </span>
        <span className="footer-note">Wali dapat membayar tagihan setiap anak yang terhubung</span>
      </footer>
    </>
  );
}
