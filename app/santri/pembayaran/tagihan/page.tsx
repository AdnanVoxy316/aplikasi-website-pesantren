import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

export const metadata: Metadata = {
  title: "Tagihan SPP Saya",
  description:
    "Lihat tagihan aktif dan lanjutkan pembayaran SPP secara aman melalui Mayar.",
};

const STEPS = [
  {
    number: 1,
    complete: true,
    title: "Pilih Bayar sekarang",
    description: "Sistem membuat invoice pembayaran.",
  },
  {
    number: 2,
    complete: false,
    title: "Lanjut ke checkout Mayar",
    description: "Pilih metode pembayaran yang tersedia.",
  },
  {
    number: 3,
    complete: false,
    title: "Tunggu konfirmasi",
    description: "Status berubah setelah webhook terverifikasi.",
  },
];

export default function SantriTagihanPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Keuangan santri"
        title="Pembayaran SPP"
        description="Lihat tagihan aktif dan lanjutkan pembayaran secara aman melalui Mayar."
        actions={
          <Link className="button button-secondary" href="/santri/pembayaran/riwayat">
            <Icon name="clock" />
            Riwayat pembayaran
          </Link>
        }
      />

      <section className="notice warning">
        <Icon name="clock" />
        <div>
          <strong>Tagihan Februari belum dibayar</strong>
          Jatuh tempo 10 Februari 2026. Bayar sebelum tanggal tersebut untuk
          menghindari status expired.
        </div>
      </section>

      <section className="bill-summary" style={{ marginTop: 15 }}>
        <div className="bill-summary-card">
          <strong>Rp 350.000</strong>
          <span>Total tagihan aktif</span>
        </div>
        <div className="bill-summary-card">
          <strong>10 Feb 2026</strong>
          <span>Jatuh tempo</span>
        </div>
        <div className="bill-summary-card">
          <strong>Mayar</strong>
          <span>Provider pembayaran online</span>
        </div>
      </section>

      <div className="content-grid" style={{ marginTop: 0 }}>
        <Panel
          title="Tagihan aktif"
          subtitle="Nominal adalah snapshot saat tagihan dibuat"
          actions={<StatusBadge variant="warning">Unpaid</StatusBadge>}
          bodyClassName="panel-body"
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
            <ToastButton
              className="button button-primary invoice-button"
              message="Checkout Mayar akan dibuka pada versi produksi."
            >
              <Icon name="wallet" />
              Bayar sekarang <Icon name="external" />
            </ToastButton>
          </div>
        </Panel>

        <Panel
          title="Cara pembayaran"
          subtitle="Selesaikan dalam beberapa langkah"
          bodyClassName="panel-body"
        >
          <div className="step-list">
            {STEPS.map((step) => (
              <div
                className={step.complete ? "step-item complete" : "step-item"}
                key={step.number}
              >
                <span className="step-number">
                  {step.complete ? <Icon name="check" /> : step.number}
                </span>
                <div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="notice" style={{ marginTop: 15 }}>
            <Icon name="shield" />
            <div>
              <strong>Pembayaran aman</strong>
              Jangan menganggap redirect browser sebagai bukti pembayaran
              final.
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Riwayat singkat"
        subtitle="Pembayaran terakhir"
        actions={
          <Link className="text-link" href="/santri/pembayaran/riwayat">
            Lihat semua <Icon name="chevron-right" />
          </Link>
        }
        bodyClassName="panel-body"
      >
        <div className="bill-list">
          <div className="bill-row">
            <div>
              <div className="bill-period">Januari 2026</div>
              <div className="bill-number">#BILL-0106 · Dibayar 08 Jan 2026</div>
            </div>
            <strong className="bill-amount">Rp 350.000</strong>
            <StatusBadge variant="success">Paid</StatusBadge>
          </div>
        </div>
      </Panel>

      <PageFooter />
    </>
  );
}
