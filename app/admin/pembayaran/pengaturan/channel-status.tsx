"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import {
  ambilStatusKanalMidtrans,
  type StatusKanal,
} from "@/actions/pembayaran/spp";
import { rupiah } from "@/lib/format";

const KATEGORI_LABEL: Record<string, string> = {
  bank_transfer: "Transfer bank / VA",
  ewallet: "E-wallet",
  qris: "QRIS",
  over_the_counter: "Gerai retail",
  cardless_credit: "Kredit tanpa kartu",
  credit_card: "Kartu kredit",
  deeplink: "Deeplink",
  convenience_store: "Gerai retail",
};

export function ChannelStatusPanel() {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [kanal, setKanal] = useState<StatusKanal[] | null>(null);

  const muat = () => {
    startTransition(async () => {
      const result = await ambilStatusKanalMidtrans();
      if (!result.ok) {
        showToast(result.error ?? "Gagal memuat status kanal.", "error");
        return;
      }
      setKanal(result.data);
      showToast(result.message ?? "Status kanal dimuat.");
    });
  };

  return (
    <div>
      <p className="panel-subtitle" style={{ marginBottom: 10 }}>
        Cek kanal apa saja yang aktif di akun Midtrans beserta nominal minimumnya. Sebagian kanal
        otomatis disembunyikan bila tagihan di bawah minimumnya (mis. BCA VA minimum Rp10.000).
      </p>
      <div className="form-actions" style={{ justifyContent: "flex-start" }}>
        <button type="button" className="button button-secondary" onClick={muat} disabled={pending}>
          <Icon name="refresh" />
          {pending ? "Memeriksa…" : kanal ? "Muat ulang" : "Cek kanal pembayaran"}
        </button>
      </div>

      {kanal ? (
        <div className="table-shell" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Kanal</th>
                <th>Kategori</th>
                <th>Minimum</th>
                <th>Maksimum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {kanal.map((k, index) => (
                <tr key={`${k.tipe}-${index}`}>
                  <td>
                    <strong>{k.tipe}</strong>
                  </td>
                  <td>
                    {k.kategori
                      ? KATEGORI_LABEL[k.kategori] ?? k.kategori
                      : "—"}
                  </td>
                  <td>{k.minimum !== null ? rupiah(k.minimum) : "—"}</td>
                  <td>{k.maksimum ? rupiah(k.maksimum) : "—"}</td>
                  <td>
                    <span className={`status-badge ${k.aktif ? "success" : "warning"}`}>
                      {k.aktif ? "aktif" : "gangguan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kanal.length === 0 ? (
            <p className="panel-subtitle" style={{ padding: 14 }}>
              Tidak ada kanal terbaca.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
