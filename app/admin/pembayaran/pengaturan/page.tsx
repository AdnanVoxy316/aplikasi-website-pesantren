import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = {
  title: "Pengaturan pembayaran",
  description: "Status integrasi Mayar dan konfigurasi environment pembayaran.",
};

function StatusRow({ label, active, note }: { label: string; active: boolean; note: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "9px 11px",
        borderRadius: 10,
        background: "var(--surface-soft)",
        marginBottom: 6,
        fontSize: 12,
      }}
    >
      <div>
        <strong>{label}</strong>
        <div style={{ color: "var(--muted)" }}>{note}</div>
      </div>
      <span className={`status-badge ${active ? "success" : "warning"}`}>
        {active ? "terkonfigurasi" : "belum diatur"}
      </span>
    </div>
  );
}

export default function AdminPembayaranPengaturanPage() {
  const mayarKey = Boolean(process.env.MAYAR_API_KEY);
  const webhookSecret = Boolean(process.env.MAYAR_WEBHOOK_SECRET);
  const publicUrl = process.env.WEBHOOK_PUBLIC_URL || process.env.APP_URL || null;
  const sandbox = process.env.MAYAR_SANDBOX === "true";

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Pengaturan pembayaran"
        description="Integrasi Mayar dikonfigurasi via environment variables — jangan hard-code secret."
      />
      <Panel title="Integrasi Mayar" subtitle="Status konfigurasi environment saat ini">
        <StatusRow
          label="MAYAR_API_KEY"
          note="Kunci API untuk membuat invoice pembayaran"
          active={mayarKey}
        />
        <StatusRow
          label="MAYAR_WEBHOOK_SECRET"
          note="Verifikasi signature webhook pembayaran"
          active={webhookSecret}
        />
        <StatusRow
          label="Webhook URL"
          note={
            publicUrl
              ? `${publicUrl.replace(/\/$/, "")}/api/webhooks/mayar`
              : "Set APP_URL atau WEBHOOK_PUBLIC_URL (ngrok untuk development)"
          }
          active={Boolean(publicUrl)}
        />
        <StatusRow
          label="Mode sandbox"
          note={sandbox ? "api.mayar.io (testing)" : "api.mayar.id (production)"}
          active={sandbox}
        />
      </Panel>
      <Panel title="Catatan deployment" subtitle="Arsitektur production (PRD §15–16)">
        <div className="check-list">
          <div className="check-row">
            Secret dikonfigurasi lewat Vercel Environment Variables, bukan di repository.
          </div>
          <div className="check-row">
            Webhook production memakai URL HTTPS publik aplikasi; ngrok hanya untuk development.
          </div>
          <div className="check-row">
            Status pembayaran hanya final setelah webhook/verifikasi provider — redirect browser
            bukan konfirmasi.
          </div>
          <div className="check-row">
            Webhook idempotent: duplicate delivery tidak membuat pembayaran baru.
          </div>
        </div>
      </Panel>
    </>
  );
}
