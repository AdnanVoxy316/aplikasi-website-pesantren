"use client";

import { MINIMUM_BCA } from "@/lib/bukti";

/**
 * Peringatan saat nominal tagihan/tarif di bawah minimum kanal BCA Virtual Account.
 * Midtrans otomatis menyembunyikan BCA pada nominal yang lebih kecil.
 */
export function MinimumNominalNote({ nominal }: { nominal: number }) {
  if (!nominal || nominal >= MINIMUM_BCA) return null;
  return (
    <small style={{ display: "block", marginTop: 5, color: "#b45309", fontSize: 10 }}>
      Nominal di bawah Rp10.000: BCA Virtual Account tidak akan muncul di halaman pembayaran
      (minimum BCA Rp10.000). BNI/BRI/QRIS tetap tersedia.
    </small>
  );
}
