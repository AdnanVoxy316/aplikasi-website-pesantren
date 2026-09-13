export const MINIMUM_BCA = 10_000;

export const METODE_LABELS: Record<string, string> = {
  cash: "Tunai (cash)",
  transfer: "Transfer bank",
  qris: "QRIS",
  ewallet: "E-wallet",
  va: "Virtual account",
  bank_transfer: "Transfer bank",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  qris_acq: "QRIS",
  credit_card: "Kartu kredit",
  cstore: "Gerai retail",
  simulasi: "Simulasi (uji coba)",
  manual: "Manual",
  lainnya: "Lainnya",
};

export function labelMetode(
  provider: string | null | undefined,
  paymentMethod: string | null | undefined,
): string {
  if (provider === "manual") {
    return METODE_LABELS[paymentMethod ?? "manual"] ?? paymentMethod ?? "Manual";
  }
  if (paymentMethod) {
    return METODE_LABELS[paymentMethod] ?? paymentMethod;
  }
  if (provider === "midtrans") return "Pembayaran online (Midtrans)";
  return provider ?? "—";
}

export function labelProvider(provider: string | null | undefined): string {
  if (provider === "manual") return "Catatan admin";
  if (provider === "midtrans") return "Midtrans";
  return provider ?? "—";
}

export type BuktiItem = {
  nama: string;
  nominal: number;
};

export type BuktiPembayaranData = {
  pembayaranId: string;
  nomorBukti: string;
  nomorTagihan: string;
  santriNama: string;
  nis: string;
  kelasNama: string | null;
  sumber: string;
  items: BuktiItem[];
  periodeBulan: number;
  periodeTahun: number;
  periodeLabel: string;
  nominal: number;
  nominalDiskon: number;
  nominalDenda: number;
  totalTagihan: number;
  nominalDibayar: number | null;
  metodeLabel: string;
  providerLabel: string;
  status: string;
  paidAt: string | Date | null;
  dicatatOlehNama: string | null;
  catatan: string | null;
  emailTujuan: string | null;
  namaPesantren: string;
  alamatPesantren: string | null;
  sudahDikirim: boolean;
};
