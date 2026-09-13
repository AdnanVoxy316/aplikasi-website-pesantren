"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import { rupiah } from "@/lib/format";

export type RincianItem = {
  id: string;
  nama: string;
  nominal: number;
  keterangan?: string | null;
};

/**
 * Tombol + modal rincian item tagihan (read-only) untuk halaman santri/wali.
 */
export function RincianTagihanButton({
  items,
  nomorTagihan,
  totalTagihan,
  variant = "button",
  label = "Rincian",
}: {
  items: RincianItem[];
  nomorTagihan: string;
  totalTagihan: number;
  variant?: "button" | "link";
  label?: string;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.nominal, 0);

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          className="table-link"
          onClick={() => setTerbuka(true)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "var(--brand)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          {label} ({items.length} item)
        </button>
      ) : (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setTerbuka(true)}
        >
          <Icon name="clipboard" />
          {label}
        </button>
      )}

      {terbuka ? (
        <div className="preview-overlay" role="dialog" aria-modal="true">
          <div className="preview-modal" style={{ maxWidth: 460 }}>
            <div className="preview-header">
              <div className="preview-title">
                <strong>Rincian tagihan</strong>
                <span className="panel-subtitle" style={{ fontFamily: "monospace", fontSize: 10 }}>
                  {nomorTagihan}
                </span>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="table-action danger"
                  title="Tutup"
                  onClick={() => setTerbuka(false)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="preview-body" style={{ padding: 16 }}>
              <div className="table-shell modal-table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: "right" }}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.nama}</strong>
                          {item.keterangan ? (
                            <div className="invoice-number-small">{item.keterangan}</div>
                          ) : null}
                        </td>
                        <td style={{ textAlign: "right" }}>{rupiah(item.nominal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {items.length === 0 ? (
                <p className="panel-subtitle">Rincian item tidak tersedia untuk tagihan lama.</p>
              ) : null}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {subtotal === totalTagihan
                    ? `${items.length} item`
                    : `Subtotal item ${rupiah(subtotal)}`}
                </span>
                <span style={{ fontSize: 13 }}>
                  Total tagihan <strong>{rupiah(totalTagihan)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
