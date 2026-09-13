"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { ambilQrPembayaranForm } from "@/actions/forms";

type QrData = {
  pembayaranId: string;
  orderId: string;
  paymentType: string;
  acquirer: string | null;
  qrisUrl: string;
  expiresAt: string | null;
  checkoutUrl: string | null;
  sandbox: boolean;
};

const SIMULATOR_QRIS_URL = "https://simulator.sandbox.midtrans.com/v2/qris/index";

/**
 * Tombol untuk mengambil & menampilkan QR QRIS dari transaksi Snap yang masih
 * menunggu pembayaran. Di sandbox, URL QR bisa disalin ke Simulator QRIS Midtrans.
 */
export function QrPembayaranButton({
  pembayaranId,
  variant = "icon",
  label = "QRIS",
}: {
  pembayaranId: string;
  variant?: "icon" | "button";
  label?: string;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<QrData | null>(null);
  const [gambarGagal, setGambarGagal] = useState(false);

  const buka = () => {
    setGambarGagal(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("pembayaranId", pembayaranId);
      const result = await ambilQrPembayaranForm(fd);
      if (!result.ok) {
        showToast(result.error ?? "Gagal memuat QR QRIS.", "error");
        return;
      }
      setData(result.data);
    });
  };

  const salin = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.qrisUrl);
      showToast(
        "URL QR disalin. Tempel di kolom 'QR Code Image Url' simulator.",
        "success",
      );
    } catch {
      showToast("Gagal menyalin otomatis — salin manual dari kolom URL.", "error");
    }
  };

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          className="button button-secondary"
          disabled={pending}
          onClick={buka}
        >
          <Icon name="qrcode" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          className="table-action"
          title="Lihat QR QRIS"
          aria-label="Lihat QR QRIS"
          disabled={pending}
          onClick={buka}
        >
          <Icon name="qrcode" />
        </button>
      )}

      {data ? (
        <div className="preview-overlay" role="dialog" aria-modal="true">
          <div className="preview-modal" style={{ maxWidth: 520 }}>
            <div className="preview-header">
              <div className="preview-title">
                <strong>QRIS pembayaran</strong>
                <span className="panel-subtitle" style={{ fontFamily: "monospace", fontSize: 10 }}>
                  {data.orderId}
                </span>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="table-action danger"
                  title="Tutup"
                  onClick={() => setData(null)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="preview-body" style={{ padding: 16 }}>
              {data.sandbox ? (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 12,
                    background: "var(--surface-soft)",
                    border: "1px solid var(--line)",
                    fontSize: 11,
                    color: "var(--ink-soft)",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Cara uji di sandbox:</strong>
                  <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <li>Klik <strong>Salin URL QR</strong> di bawah.</li>
                    <li>
                      Buka{" "}
                      <a href={SIMULATOR_QRIS_URL} target="_blank" rel="noreferrer">
                        Simulator QRIS Midtrans
                      </a>
                      .
                    </li>
                    <li>
                      Tempel di kolom <em>QR Code Image Url</em> → <strong>Scan QR</strong> →{" "}
                      <strong>Pay</strong>.
                    </li>
                  </ol>
                  <span style={{ color: "var(--muted)" }}>
                    Jangan isi Order ID ke simulator — yang diminta adalah URL gambar QR.
                  </span>
                </div>
              ) : null}

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                {gambarGagal ? (
                  <p className="panel-subtitle" style={{ textAlign: "center" }}>
                    Gambar QR tidak dapat dimuat (mungkin transaksi sudah kedaluwarsa). Buat
                    pembayaran baru, lalu muat ulang QR.
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.qrisUrl}
                    alt="QRIS pembayaran"
                    onError={() => setGambarGagal(true)}
                    style={{
                      width: 240,
                      maxWidth: "100%",
                      height: "auto",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      background: "#fff",
                    }}
                  />
                )}
              </div>

              <div className="field">
                <label htmlFor="qr-url">URL gambar QR (untuk simulator)</label>
                <input
                  id="qr-url"
                  readOnly
                  value={data.qrisUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <p className="panel-subtitle" style={{ margin: "0 0 12px" }}>
                Acquirer: {data.acquirer ?? "—"}
                {data.expiresAt ? ` · Berlaku sampai ${data.expiresAt}` : ""}
                {data.paymentType && data.paymentType !== "qris" ? ` · Metode: ${data.paymentType}` : ""}
              </p>

              <div className="form-actions">
                {data.checkoutUrl ? (
                  <a
                    className="button button-secondary"
                    href={data.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="external" />
                    Halaman pembayaran
                  </a>
                ) : null}
                <button type="button" className="button button-primary" onClick={salin}>
                  <Icon name="link" />
                  Salin URL QR
                </button>
              </div>
              {data.expiresAt ? (
                <p className="panel-subtitle" style={{ marginTop: 10, marginBottom: 0 }}>
                  Berlaku sampai: {data.expiresAt}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
