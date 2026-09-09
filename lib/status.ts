import type { BadgeVariant } from "@/components/ui/status-badge";

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Lunas",
  unpaid: "Belum dibayar",
  pending: "Menunggu pembayaran",
  processing: "Sedang diproses",
  draft: "Draft",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  failed: "Gagal",
  refunded: "Dikembalikan",
};

const SUBMISSION_LABELS: Record<string, string> = {
  dinilai: "Sudah dinilai",
  terlambat: "Terlambat",
  dikumpulkan: "Sudah dikumpulkan",
};

const ATTENDANCE_LABELS: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

function fallbackStatusLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function paymentStatusLabel(value: string | null | undefined): string {
  return value ? PAYMENT_LABELS[value] ?? fallbackStatusLabel(value) : "—";
}

export function submissionStatusLabel(value: string | null | undefined): string {
  return value ? SUBMISSION_LABELS[value] ?? fallbackStatusLabel(value) : "—";
}

export function attendanceStatusLabel(value: string | null | undefined): string {
  return value ? ATTENDANCE_LABELS[value] ?? fallbackStatusLabel(value) : "—";
}

export function paymentStatusVariant(value: string): BadgeVariant {
  if (value === "paid") return "success";
  if (["pending", "processing"].includes(value)) return "warning";
  if (["cancelled", "expired", "failed"].includes(value)) return "danger";
  return "neutral";
}
