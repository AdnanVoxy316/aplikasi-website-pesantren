export function rupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function tanggalIndo(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function tanggalWaktuIndo(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function labelPeriode(bulan: number, tahun: number): string {
  return `${BULAN[bulan - 1] ?? bulan} ${tahun}`;
}

export function sisaWaktu(deadline: Date): { text: string; urgent: boolean } {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return { text: "Sudah berakhir", urgent: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { text: `${days} hari lagi`, urgent: days <= 2 };
  return { text: `${hours} jam lagi`, urgent: true };
}

export function masihBerjalan(deadline: Date): boolean {
  return deadline.getTime() > Date.now();
}

export function persenHadir(hadir: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((hadir / total) * 100);
}
