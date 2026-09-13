import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { isMidtransConfigured, isMidtransProduction } from "@/lib/midtrans";
import { ChannelStatusPanel } from "./channel-status";

export const metadata: Metadata = {
  title: "Pengaturan pembayaran",
  description: "Status integrasi Midtrans dan konfigurasi environment pembayaran.",
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
  const serverKey = isMidtransConfigured();
  const clientKey = Boolean(process.env.MIDTRANS_CLIENT_KEY);
  const merchantId = Boolean(process.env.MIDTRANS_MERCHANT_ID);
  const production = isMidtransProduction();
  const publicUrl = process.env.WEBHOOK_PUBLIC_URL || process.env.APP_URL || null;
  const webhookUrl = publicUrl
    ? `${publicUrl.replace(/\/$/, "")}/api/webhooks/midtrans`
    : null;

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Pengaturan pembayaran"
        description="Integrasi Midtrans dikonfigurasi via environment variables — jangan hard-code secret."
      />
      <Panel title="Integrasi Midtrans" subtitle="Status konfigurasi environment saat ini">
        <StatusRow
          label="MIDTRANS_MERCHANT_ID"
          note="ID merchant dari dashboard Midtrans"
          active={merchantId}
        />
        <StatusRow
          label="MIDTRANS_CLIENT_KEY"
          note="Client key (untuk frontend / Snap)"
          active={clientKey}
        />
        <StatusRow
          label="MIDTRANS_SERVER_KEY"
          note="Server key (untuk membuat transaksi & verifikasi webhook)"
          active={serverKey}
        />
        <StatusRow
          label="Notification URL"
          note={webhookUrl ?? "Set APP_URL atau WEBHOOK_PUBLIC_URL (tunnel saat development)"}
          active={Boolean(webhookUrl)}
        />
        <StatusRow
          label="Mode"
          note={
            production
              ? "Production (api.midtrans.com)"
              : "Sandbox/developer (api.sandbox.midtrans.com) — simulasi lunas aktif"
          }
          active={production}
        />
      </Panel>

      <Panel title="Langkah mengaktifkan" subtitle="Menyalin URL & key dari dashboard Midtrans">
        <div className="check-list">
          <div className="check-row">
            Dashboard → <strong>Settings → Access Keys</strong>. Salin Merchant ID, Client Key,
            dan Server Key ke environment variables.
          </div>
          <div className="check-row">
            Dashboard → <strong>Settings → Payment → Payment Notification URL</strong> (di
            dashboard terbaru; dokumentasi lama menyebutnya <em>Configuration</em>). Isi:{" "}
            <code>{webhookUrl ?? "https://domain-anda/api/webhooks/midtrans"}</code>
          </div>
          <div className="check-row">
            Dashboard → <strong>Settings → Snap Checkout</strong> untuk mengatur tampilan dan
            metode pembayaran yang muncul di halaman Snap.
          </div>
          <div className="check-row">
            Untuk uji lokal, jalankan tunnel (mis. <code>cloudflared tunnel --url http://localhost:3000</code> atau{" "}
            <code>ngrok http 3000</code>) dan isi URL publiknya sebagai Notification URL.
          </div>
          <div className="check-row">
            Sebagian kanal punya nominal minimum dari Midtrans, sehingga otomatis disembunyikan
            bila tagihan di bawahnya — mis. <strong>BCA Virtual Account minimum Rp10.000</strong>{" "}
            (BNI/BRI minimum Rp1). Cocokkan dengan nominal SPP yang berlaku.
          </div>
          <div className="check-row">
            Saat go-live: set <code>MIDTRANS_IS_PRODUCTION=true</code> dan ganti ketiga key ke
            key production.
          </div>
        </div>
      </Panel>

      <Panel
        title="Cek kanal pembayaran"
        subtitle="Status & minimum langsung dari Midtrans (mode sandbox/production aktif)"
      >
        <ChannelStatusPanel />
      </Panel>

      <Panel title="Prinsip keamanan" subtitle="Konsisten dengan PRD">        <div className="check-list">
          <div className="check-row">
            Status pembayaran hanya final setelah webhook Midtrans terverifikasi signature
            (SHA512 order_id + status_code + gross_amount + server_key) — redirect browser bukan
            konfirmasi.
          </div>
          <div className="check-row">
            Webhook idempotent: pengiriman berulang tidak membuat pembayaran baru.
          </div>
          <div className="check-row">
            Secret hanya lewat Vercel Environment Variables / .env.local, tidak pernah masuk
            repository.
          </div>
        </div>
      </Panel>
    </>
  );
}
