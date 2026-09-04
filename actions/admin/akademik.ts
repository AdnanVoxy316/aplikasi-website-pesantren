"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  jenisNilai,
  kelas,
  mapel,
  pengajaran,
  pesantrenSettings,
  santriProfile,
  tahunAjaran,
  waliSantriAnak,
  waliSantriProfile,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

async function assertAdmin() {
  const session = await getSession();
  if (session?.user.role !== "admin") {
    throw new Error("Hanya admin yang dapat melakukan aksi ini.");
  }
  return session;
}

/* ---------------- Tahun Ajaran ---------------- */

const tahunAjaranSchema = z.object({
  label: z.string().trim().min(4, "Label minimal 4 karakter, misal 2026/2027"),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai tidak valid"),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal selesai tidak valid"),
});

export async function createTahunAjaran(
  input: z.input<typeof tahunAjaranSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertAdmin();
    const data = tahunAjaranSchema.parse(input);
    const [created] = await db
      .insert(tahunAjaran)
      .values(data)
      .returning({ id: tahunAjaran.id });
    await logActivity({
      userId: session.user.id,
      aksi: "create_tahun_ajaran",
      entitas: "tahun_ajaran",
      entitasId: created.id,
      detail: { label: data.label },
    });
    revalidatePath("/admin/pengaturan");
    return ok(created, "Tahun ajaran berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function activateTahunAjaran(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    await db.transaction(async (tx) => {
      await tx.update(tahunAjaran).set({ isActive: false }).where(eq(tahunAjaran.isActive, true));
      await tx.update(tahunAjaran).set({ isActive: true }).where(eq(tahunAjaran.id, id));
      await tx
        .update(pesantrenSettings)
        .set({ tahunAjaranAktifId: id })
        .where(eq(pesantrenSettings.id, "default"));
    });
    await logActivity({
      userId: session.user.id,
      aksi: "activate_tahun_ajaran",
      entitas: "tahun_ajaran",
      entitasId: id,
    });
    revalidatePath("/admin/pengaturan");
    return ok(undefined, "Tahun ajaran aktif diperbarui.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Kelas ---------------- */

const kelasSchema = z.object({
  nama: z.string().trim().min(1, "Nama kelas wajib diisi"),
  tingkat: z.string().trim().optional(),
  waliKelasId: z.string().trim().optional(),
  tahunAjaranId: z.string().min(1, "Tahun ajaran wajib dipilih"),
});

export async function createKelas(
  input: z.input<typeof kelasSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertAdmin();
    const data = kelasSchema.parse(input);
    const [created] = await db
      .insert(kelas)
      .values({
        nama: data.nama,
        tingkat: data.tingkat?.trim() || null,
        waliKelasId: data.waliKelasId?.trim() || null,
        tahunAjaranId: data.tahunAjaranId,
      })
      .returning({ id: kelas.id });
    await logActivity({
      userId: session.user.id,
      aksi: "create_kelas",
      entitas: "kelas",
      entitasId: created.id,
      detail: { nama: data.nama },
    });
    revalidatePath("/admin/kelas");
    return ok(created, "Kelas berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateKelas(
  id: string,
  input: z.input<typeof kelasSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    const data = kelasSchema.parse(input);
    await db
      .update(kelas)
      .set({
        nama: data.nama,
        tingkat: data.tingkat?.trim() || null,
        waliKelasId: data.waliKelasId?.trim() || null,
        tahunAjaranId: data.tahunAjaranId,
      })
      .where(eq(kelas.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "update_kelas",
      entitas: "kelas",
      entitasId: id,
    });
    revalidatePath("/admin/kelas");
    return ok(undefined, "Kelas berhasil diperbarui.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteKelas(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(santriProfile)
      .where(eq(santriProfile.kelasId, id));
    if (count > 0) return fail(`Kelas masih berisi ${count} santri. Pindahkan santri terlebih dahulu.`);
    await db.delete(kelas).where(eq(kelas.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_kelas",
      entitas: "kelas",
      entitasId: id,
    });
    revalidatePath("/admin/kelas");
    return ok(undefined, "Kelas berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Mapel ---------------- */

const mapelSchema = z.object({
  nama: z.string().trim().min(1, "Nama mapel wajib diisi"),
  kategori: z.enum(["umum", "pesantren"]).default("umum"),
  deskripsi: z.string().trim().optional(),
});

export async function createMapel(
  input: z.input<typeof mapelSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertAdmin();
    const data = mapelSchema.parse(input);
    const [created] = await db
      .insert(mapel)
      .values({
        nama: data.nama,
        kategori: data.kategori,
        deskripsi: data.deskripsi?.trim() || null,
      })
      .returning({ id: mapel.id });
    await logActivity({
      userId: session.user.id,
      aksi: "create_mapel",
      entitas: "mapel",
      entitasId: created.id,
    });
    revalidatePath("/admin/mapel");
    return ok(created, "Mapel berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMapel(
  id: string,
  input: z.input<typeof mapelSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    const data = mapelSchema.parse(input);
    await db
      .update(mapel)
      .set({
        nama: data.nama,
        kategori: data.kategori,
        deskripsi: data.deskripsi?.trim() || null,
      })
      .where(eq(mapel.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "update_mapel",
      entitas: "mapel",
      entitasId: id,
    });
    revalidatePath("/admin/mapel");
    return ok(undefined, "Mapel berhasil diperbarui.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteMapel(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    await db.delete(mapel).where(eq(mapel.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_mapel",
      entitas: "mapel",
      entitasId: id,
    });
    revalidatePath("/admin/mapel");
    return ok(undefined, "Mapel berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Penugasan Guru ---------------- */

const pengajaranSchema = z.object({
  guruId: z.string().min(1, "Guru wajib dipilih"),
  kelasId: z.string().min(1, "Kelas wajib dipilih"),
  mapelId: z.string().min(1, "Mapel wajib dipilih"),
  tahunAjaranId: z.string().min(1, "Tahun ajaran wajib dipilih"),
});

export async function createPengajaran(
  input: z.input<typeof pengajaranSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertAdmin();
    const data = pengajaranSchema.parse(input);
    const [created] = await db
      .insert(pengajaran)
      .values(data)
      .returning({ id: pengajaran.id });
    await logActivity({
      userId: session.user.id,
      aksi: "create_pengajaran",
      entitas: "pengajaran",
      entitasId: created.id,
      detail: data,
    });
    revalidatePath("/admin/penugasan-guru");
    return ok(created, "Penugasan guru berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePengajaran(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    await db.delete(pengajaran).where(eq(pengajaran.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_pengajaran",
      entitas: "pengajaran",
      entitasId: id,
    });
    revalidatePath("/admin/penugasan-guru");
    return ok(undefined, "Penugasan berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Relasi Wali Santri ---------------- */

export async function linkWaliAnak(
  waliUserId: string,
  santriProfileId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    const [wali] = await db
      .select({ id: waliSantriProfile.id })
      .from(waliSantriProfile)
      .where(eq(waliSantriProfile.userId, waliUserId))
      .limit(1);
    if (!wali) return fail("Profil wali santri tidak ditemukan.");

    const [existing] = await db
      .select({ id: waliSantriAnak.id })
      .from(waliSantriAnak)
      .where(
        and(
          eq(waliSantriAnak.waliSantriId, wali.id),
          eq(waliSantriAnak.santriId, santriProfileId),
        ),
      )
      .limit(1);
    if (existing) return fail("Relasi wali–santri sudah ada.");

    await db.insert(waliSantriAnak).values({
      waliSantriId: wali.id,
      santriId: santriProfileId,
    });
    await logActivity({
      userId: session.user.id,
      aksi: "link_wali_anak",
      entitas: "wali_santri_anak",
      detail: { waliUserId, santriProfileId },
    });
    revalidatePath("/admin/wali-santri");
    return ok(undefined, "Relasi wali–santri berhasil ditambahkan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function unlinkWaliAnak(relationId: string): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    await db.delete(waliSantriAnak).where(eq(waliSantriAnak.id, relationId));
    await logActivity({
      userId: session.user.id,
      aksi: "unlink_wali_anak",
      entitas: "wali_santri_anak",
      entitasId: relationId,
    });
    revalidatePath("/admin/wali-santri");
    return ok(undefined, "Relasi wali–santri berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Jenis Nilai ---------------- */

const jenisNilaiSchema = z.object({
  nama: z.string().trim().min(1, "Nama jenis nilai wajib diisi"),
  bobot: z.coerce.number().min(0, "Bobot tidak boleh negatif").max(100),
});

export async function createJenisNilai(
  input: z.input<typeof jenisNilaiSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertAdmin();
    const data = jenisNilaiSchema.parse(input);
    const [created] = await db
      .insert(jenisNilai)
      .values(data)
      .returning({ id: jenisNilai.id });
    await logActivity({
      userId: session.user.id,
      aksi: "create_jenis_nilai",
      entitas: "jenis_nilai",
      entitasId: created.id,
    });
    revalidatePath("/admin/pengaturan");
    return ok(created, "Jenis nilai berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteJenisNilai(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await assertAdmin();
    await db.delete(jenisNilai).where(eq(jenisNilai.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_jenis_nilai",
      entitas: "jenis_nilai",
      entitasId: id,
    });
    revalidatePath("/admin/pengaturan");
    return ok(undefined, "Jenis nilai berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}
