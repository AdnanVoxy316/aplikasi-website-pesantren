import "server-only";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  kelas,
  santriProfile,
  tagihanItem,
  tarifSpp,
  tarifSppSantri,
  user,
  jenisPembayaran,
} from "@/db/schema";

export async function listJenisPembayaran() {
  return db
    .select({
      id: jenisPembayaran.id,
      kode: jenisPembayaran.kode,
      nama: jenisPembayaran.nama,
      kategori: jenisPembayaran.kategori,
      keterangan: jenisPembayaran.keterangan,
      tarif: jenisPembayaran.tarif,
      urutan: jenisPembayaran.urutan,
      isActive: jenisPembayaran.isActive,
    })
    .from(jenisPembayaran)
    .orderBy(asc(jenisPembayaran.urutan), asc(jenisPembayaran.nama));
}

export type TagihanItemRow = {
  id: string;
  tagihanSppId: string;
  jenisPembayaranId: string;
  nama: string;
  nominal: number;
  keterangan: string | null;
  urutan: number;
};

/** Rincian item untuk sekumpulan tagihan (dipakai halaman admin, santri, wali). */
export async function listItemTagihan(tagihanIds: string[]): Promise<TagihanItemRow[]> {
  if (tagihanIds.length === 0) return [];
  return db
    .select({
      id: tagihanItem.id,
      tagihanSppId: tagihanItem.tagihanSppId,
      jenisPembayaranId: tagihanItem.jenisPembayaranId,
      nama: tagihanItem.nama,
      nominal: tagihanItem.nominal,
      keterangan: tagihanItem.keterangan,
      urutan: tagihanItem.urutan,
    })
    .from(tagihanItem)
    .where(inArray(tagihanItem.tagihanSppId, tagihanIds))
    .orderBy(asc(tagihanItem.urutan), asc(tagihanItem.createdAt));
}

/** Kelompokkan item per tagihan (urutan sesuai query). */
export function mapItemTagihan(
  rows: TagihanItemRow[],
): Map<string, TagihanItemRow[]> {
  const map = new Map<string, TagihanItemRow[]>();
  for (const row of rows) {
    const list = map.get(row.tagihanSppId);
    if (list) list.push(row);
    else map.set(row.tagihanSppId, [row]);
  }
  return map;
}

export async function listTarifSpp() {
  return db
    .select({
      id: tarifSpp.id,
      nama: tarifSpp.nama,
      nominal: tarifSpp.nominal,
      kelasNama: kelas.nama,
      berlakuMulai: tarifSpp.berlakuMulai,
      berlakuSampai: tarifSpp.berlakuSampai,
      isActive: tarifSpp.isActive,
    })
    .from(tarifSpp)
    .leftJoin(kelas, eq(tarifSpp.kelasId, kelas.id))
    .orderBy(desc(tarifSpp.isActive), tarifSpp.berlakuMulai);
}

export async function listTarifSppSantri() {
  return db
    .select({
      id: tarifSppSantri.id,
      santriId: tarifSppSantri.santriId,
      santriNama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
      nominal: tarifSppSantri.nominal,
      catatan: tarifSppSantri.catatan,
      isActive: tarifSppSantri.isActive,
      updatedAt: tarifSppSantri.updatedAt,
    })
    .from(tarifSppSantri)
    .innerJoin(santriProfile, eq(tarifSppSantri.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .orderBy(asc(user.name));
}

/** Tarif default (tanpa filter santri) untuk ditampilkan sebagai pembanding. */
export async function listTarifDefault() {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select({
      id: tarifSpp.id,
      nama: tarifSpp.nama,
      nominal: tarifSpp.nominal,
      kelasId: tarifSpp.kelasId,
      kelasNama: kelas.nama,
    })
    .from(tarifSpp)
    .leftJoin(kelas, eq(tarifSpp.kelasId, kelas.id))
    .where(
      and(
        eq(tarifSpp.isActive, true),
        sql`${tarifSpp.berlakuMulai} <= ${today}`,
        or(isNull(tarifSpp.berlakuSampai), sql`${tarifSpp.berlakuSampai} >= ${today}`),
      ),
    )
    .orderBy(tarifSpp.nominal);
}
