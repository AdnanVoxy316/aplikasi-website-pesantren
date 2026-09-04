import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import { SwitchField } from "@/components/switch-field";

export const metadata: Metadata = {
  title: "Pengaturan Pembayaran",
  description:
    "Kelola koneksi Mayar, endpoint webhook, dan perilaku pembayaran.",
};

export default function AdminPengaturanPembayaranPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Provider dan webhook"
        title="Pengaturan pembayaran"
        description="Kelola koneksi Mayar, endpoint webhook, dan perilaku pengingat pembayaran."
        actions={
          <span className="role-chip">
            <Icon name="shield" />
            Konfigurasi aman
          </span>
        }
      />
      <div className="form-layout">
        <section className="panel">
          <div className="form-card">
            <h2 className="form-card-title">Koneksi Mayar</h2>
            <p className="form-card-description">
              Secret di bawah hanya ditampilkan sebagai masked field pada
              prototype.
            </p>
            <DemoForm
              success="Pengaturan pembayaran berhasil disimpan."
              actions={
                <>
                  <button className="button button-secondary" type="reset">
                    Batalkan
                  </button>
                  <button className="button button-primary" type="submit">
                    Simpan pengaturan
                  </button>
                </>
              }
            >
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="provider">Provider pembayaran</label>
                  <select id="provider">
                    <option>Mayar</option>
                    <option>Provider lain (belum aktif)</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="environment">Environment</label>
                  <select id="environment">
                    <option>Sandbox / testing</option>
                    <option>Production</option>
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="apiKey">
                    API key <span className="optional">(masked)</span>
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    defaultValue="mayar_demo_key_masked"
                  />
                </div>
                <div className="field full">
                  <label htmlFor="webhookSecret">
                    Webhook secret <span className="optional">(masked)</span>
                  </label>
                  <input
                    id="webhookSecret"
                    type="password"
                    defaultValue="webhook_secret_masked"
                  />
                </div>
                <div className="field full">
                  <label htmlFor="webhookUrl">Webhook URL</label>
                  <input
                    id="webhookUrl"
                    defaultValue="https://domain-pesantren.com/api/webhooks/mayar"
                  />
                  <small>
                    Development dapat memakai WEBHOOK_PUBLIC_URL dari
                    environment, bukan URL yang di-hard-code.
                  </small>
                </div>
              </div>
              <div className="form-divider" />
              <h3 className="form-card-title">Perilaku pembayaran</h3>
              <div className="setting-list">
                <SwitchField
                  name="dueDateReminder"
                  label="Pengingat jatuh tempo"
                  description="Beri notifikasi saat tagihan mendekati jatuh tempo."
                  defaultChecked
                />
                <SwitchField
                  name="reconcilePending"
                  label="Reconcile transaksi tertunda"
                  description="Tandai transaksi yang perlu diperiksa ulang oleh admin."
                  defaultChecked
                />
                <SwitchField
                  name="manualPayment"
                  label="Pembayaran manual"
                  description="Izinkan pencatatan cash atau transfer dengan audit trail."
                />
              </div>
            </DemoForm>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Endpoint webhook</h2>
              <p className="panel-subtitle">
                Status koneksi dan aturan integritas
              </p>
            </div>
          </div>
          <div className="panel-body">
            <div className="notice">
              <Icon name="check-circle" />
              <div>
                <strong>Endpoint siap</strong>
                POST /api/webhooks/mayar menerima event dari provider.
              </div>
            </div>
            <div className="setting-list" style={{ marginTop: 10 }}>
              <div className="setting-row">
                <div>
                  <div className="setting-name">Signature validation</div>
                  <div className="setting-description">
                    Wajib sebelum update status
                  </div>
                </div>
                <StatusBadge variant="success">Aktif</StatusBadge>
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-name">Idempotency</div>
                  <div className="setting-description">
                    Duplicate event diabaikan
                  </div>
                </div>
                <StatusBadge variant="success">Aktif</StatusBadge>
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-name">Environment</div>
                  <div className="setting-description">Sandbox</div>
                </div>
                <StatusBadge variant="warning">Testing</StatusBadge>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <ToastButton
                className="button button-secondary"
                message="Webhook test dikirim pada versi backend."
              >
                <Icon name="external" />
                Test webhook
              </ToastButton>
            </div>
          </div>
        </aside>
      </div>
      <PageFooter />
    </>
  );
}
