import "server-only";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  kelas,
  pembayaranSpp,
  pesantrenSettings,
  santriProfile,
  tagihanItem,
  tagihanSpp,
  tarifSpp,
  tarifSppSantri,
  user,
} from "@/db/schema";
import { labelPeriode, rupiah } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { isMailerConfigured, kirimEmailBuktiPembayaran } from "@/lib/mailer";
import {
  labelMetode,
  labelProvider,
  type BuktiPembayaranData,
} from "@/lib/bukti";

/* ---------------- Resolusi nominal (tarif khusus santri > tarif kelas) ---------------- */

export type SumberNominal = "khusus" | "tarif";

export type NominalSantri = {
  nominal: number;
  sumber: SumberNominal;
  tarifSppId: string | null;
  tarifSantriId: string | null;
  keterangan: string;
};

async function resolveTarifKelas(
  tahunAjaranId: string,
  kelasId: string | null,
) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(tarifSpp)
    .where(
      and(
        eq(tarifSpp.isActive, true),
        or(
          isNull(tarifSpp.tahunAjaranId),
          eq(tarifSpp.tahunAjaranId, tahunAjaranId),
        ),
        sql`${tarifSpp.berlakuMulai} <= ${today}`,
        or(
          isNull(tarifSpp.berlakuSampai),
          sql`${tarifSpp.berlakuSampai} >= ${today}`,
        ),
      ),
    )
    // Tarif terbaru menang supaya pemilihan tidak acak saat ada beberapa
    // tarif umum yang sama-sama berlaku.
    .orderBy(desc(tarifSpp.berlakuMulai), desc(tarifSpp.createdAt));

  const spesifik = rows.find((r) => r.kelasId === kelasId);
  const umum = rows.find((r) => r.kelasId === null);
  return spesifik ?? umum ?? null;
}

/**
 * Nominal efektif untuk seorang santri:
 * 1. Tarif khusus santri (aktif) — menang, sesuai kemampuan membayar.
 * 2. Tarif kelas / tarif umum yang berlaku.
 */
export async function resolveNominalSantri(
  santriId: string,
  kelasId: string | null,
  tahunAjaranId: string,
): Promise<NominalSantri | null> {
  const [khusus] = await db
    .select()
    .from(tarifSppSantri)
    .where(
      and(
        eq(tarifSppSantri.santriId, santriId),
        eq(tarifSppSantri.isActive, true),
      ),
    )
    .limit(1);

  if (khusus) {
    return {
      nominal: khusus.nominal,
      sumber: "khusus",
      tarifSppId: null,
      tarifSantriId: khusus.id,
      keterangan: khusus.catatan?.trim() || "Tarif khusus santri",
    };
  }

  const tarif = await resolveTarifKelas(tahunAjaranId, kelasId);
  if (!tarif) return null;

  return {
    nominal: tarif.nominal,
    sumber: "tarif",
    tarifSppId: tarif.id,
    tarifSantriId: null,
    keterangan: tarif.nama,
  };
}

/* ---------------- Bukti pembayaran ---------------- */

export {
  labelMetode,
  labelProvider,
  METODE_LABELS,
} from "@/lib/bukti";
export type { BuktiPembayaranData } from "@/lib/bukti";

export async function getBuktiPembayaranData(
  pembayaranId: string,
): Promise<BuktiPembayaranData | null> {
  const [row] = await db
    .select({
      pembayaran: pembayaranSpp,
      tagihan: tagihanSpp,
      santriNama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
      email: user.email,
    })
    .from(pembayaranSpp)
    .innerJoin(tagihanSpp, eq(pembayaranSpp.tagihanSppId, tagihanSpp.id))
    .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .where(eq(pembayaranSpp.id, pembayaranId))
    .limit(1);

  if (!row) return null;

  let dicatatOlehNama: string | null = null;
  if (row.pembayaran.dicatatOleh) {
    const [pencatat] = await db
      .select({ nama: user.name })
      .from(user)
      .where(eq(user.id, row.pembayaran.dicatatOleh))
      .limit(1);
    dicatatOlehNama = pencatat?.nama ?? null;
  }

  const [settings] = await db
    .select({
      namaPesantren: pesantrenSettings.namaPesantren,
      alamat: pesantrenSettings.alamat,
    })
    .from(pesantrenSettings)
    .limit(1);

  const itemRows = await db
    .select({ nama: tagihanItem.nama, nominal: tagihanItem.nominal })
    .from(tagihanItem)
    .where(eq(tagihanItem.tagihanSppId, row.tagihan.id))
    .orderBy(asc(tagihanItem.urutan));

  return {
    pembayaranId: row.pembayaran.id,
    nomorBukti: row.tagihan.nomorTagihan,
    nomorTagihan: row.tagihan.nomorTagihan,
    santriNama: row.santriNama,
    nis: row.nis,
    kelasNama: row.kelasNama,
    sumber: row.tagihan.sumber,
    items: itemRows,
    periodeBulan: row.tagihan.periodeBulan,
    periodeTahun: row.tagihan.periodeTahun,
    periodeLabel: labelPeriode(row.tagihan.periodeBulan, row.tagihan.periodeTahun),
    nominal: row.tagihan.nominal,
    nominalDiskon: row.tagihan.nominalDiskon,
    nominalDenda: row.tagihan.nominalDenda,
    totalTagihan: row.tagihan.totalTagihan,
    nominalDibayar: row.pembayaran.nominalDibayar,
    metodeLabel: labelMetode(row.pembayaran.provider, row.pembayaran.paymentMethod),
    providerLabel: labelProvider(row.pembayaran.provider),
    status: row.pembayaran.status,
    paidAt: row.pembayaran.paidAt,
    dicatatOlehNama,
    catatan: row.pembayaran.catatan,
    emailTujuan: row.email,
    namaPesantren: settings?.namaPesantren ?? "Pesantren",
    alamatPesantren: settings?.alamat ?? null,
    sudahDikirim: Boolean(row.pembayaran.buktiTerkirimAt),
  };
}

/**
 * Kirim bukti pembayaran via email bila SMTP terkonfigurasi.
 * Aman dipanggil berkali-kali (idempotent lewat buktiTerkirimAt).
 */
export async function terbitkanBuktiPembayaran(
  pembayaranId: string,
  opts: { paksa?: boolean } = {},
): Promise<boolean> {
  try {
    if (!isMailerConfigured()) return false;

    const data = await getBuktiPembayaranData(pembayaranId);
    if (!data || data.status !== "paid") return false;
    if (!data.emailTujuan) return false;
    if (data.sudahDikirim && !opts.paksa) return false;

    await kirimEmailBuktiPembayaran(data);
    await db
      .update(pembayaranSpp)
      .set({ buktiTerkirimAt: new Date() })
      .where(eq(pembayaranSpp.id, pembayaranId));
    return true;
  } catch (error) {
    console.error("Gagal mengirim bukti pembayaran:", error);
    return false;
  }
}

/* ---------------- Sinkronisasi status pembayaran ---------------- */

export type StatusPembayaranInternal =
  | "paid"
  | "pending"
  | "processing"
  | "expired"
  | "failed"
  | "cancelled"
  | "refunded";

export async function prosesStatusPembayaran(input: {
  pembayaranId: string;
  status: StatusPembayaranInternal;
  amount?: number | null;
  metode?: string | null;
  transactionId?: string | null;
  payload?: unknown;
  aktorId?: string | null;
  aktorAksi?: string;
}): Promise<{ changed: boolean; statusLama: string; tagihanId: string } | null> {
  const [pembayaran] = await db
    .select()
    .from(pembayaranSpp)
    .where(eq(pembayaranSpp.id, input.pembayaranId))
    .limit(1);
  if (!pembayaran) return null;

  const statusLama = pembayaran.status;
  const sudahPaid = statusLama === "paid";
  const targetPaid = input.status === "paid";

  if (sudahPaid && targetPaid) {
    return { changed: false, statusLama, tagihanId: pembayaran.tagihanSppId };
  }

  await db
    .update(pembayaranSpp)
    .set({
      status: input.status,
      paidAt: targetPaid ? pembayaran.paidAt ?? new Date() : pembayaran.paidAt,
      nominalDibayar:
        input.amount ?? pembayaran.nominalDibayar ?? pembayaran.totalDibayar,
      totalDibayar:
        input.amount ?? pembayaran.totalDibayar ?? pembayaran.nominalDibayar,
      paymentMethod: input.metode ?? pembayaran.paymentMethod,
      providerTransactionId:
        input.transactionId ?? pembayaran.providerTransactionId,
      providerPayload:
        (input.payload as Record<string, unknown>) ?? pembayaran.providerPayload,
    })
    .where(eq(pembayaranSpp.id, pembayaran.id));

  if (targetPaid) {
    await db
      .update(tagihanSpp)
      .set({ status: "paid" })
      .where(
        and(
          eq(tagihanSpp.id, pembayaran.tagihanSppId),
          or(
            eq(tagihanSpp.status, "unpaid"),
            eq(tagihanSpp.status, "pending"),
            eq(tagihanSpp.status, "processing"),
          ),
        ),
      );
  } else if (
    ["expired", "failed", "cancelled", "refunded"].includes(input.status)
  ) {
    await db
      .update(tagihanSpp)
      .set({ status: "unpaid" })
      .where(
        and(
          eq(tagihanSpp.id, pembayaran.tagihanSppId),
          or(
            eq(tagihanSpp.status, "pending"),
            eq(tagihanSpp.status, "processing"),
          ),
        ),
      );
  } else {
    await db
      .update(tagihanSpp)
      .set({ status: "pending" })
      .where(
        and(
          eq(tagihanSpp.id, pembayaran.tagihanSppId),
          or(
            eq(tagihanSpp.status, "unpaid"),
            eq(tagihanSpp.status, "pending"),
            eq(tagihanSpp.status, "processing"),
          ),
        ),
      );
  }

  await logActivity({
    userId: input.aktorId ?? null,
    aksi: input.aktorAksi ?? (targetPaid ? "pembayaran_lunas" : "pembayaran_gagal"),
    entitas: "pembayaran_spp",
    entitasId: pembayaran.id,
    detail: { statusLama, statusBaru: input.status, metode: input.metode ?? null },
  });

  if (targetPaid) {
    await terbitkanBuktiPembayaran(pembayaran.id);
  }

  return { changed: statusLama !== input.status, statusLama, tagihanId: pembayaran.tagihanSppId };
}

export function nominalTerbilangRingkas(value: number): string {
  return rupiah(value);
}
