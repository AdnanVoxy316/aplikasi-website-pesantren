import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { kelas, tarifSpp } from "@/db/schema";

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
