"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { jenisNilai, nilai, pesantrenSettings, santriProfile, tahunAjaran } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { assertPengajaran, getGuruProfileId } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

const nilaiSchema = z.object({
  santriId: z.string().min(1),
  mapelId: z.string().min(1),
  kelasId: z.string().min(1),
  jenisNilaiId: z.string().min(1),
  tahunAjaranId: z.string().min(1),
  semester: z.enum(["ganjil", "genap"]),
  nilai: z.coerce.number().min(0, "Nilai minimal 0").max(100, "Nilai maksimal 100"),
  catatan: z.string().trim().optional(),
});

export async function upsertNilai(
  input: z.input<typeof nilaiSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    const data = nilaiSchema.parse(input);

    if (session.user.role !== "guru") {
      return fail("Hanya guru yang dapat input nilai.");
    }

    const guruId = await getGuruProfileId(session.user.id);
    await assertPengajaran(guruId, data.kelasId, data.mapelId, data.tahunAjaranId);
    await db
      .insert(nilai)
      .values({
        santriId: data.santriId,
        mapelId: data.mapelId,
        kelasId: data.kelasId,
        jenisNilaiId: data.jenisNilaiId,
        guruId,
        tahunAjaranId: data.tahunAjaranId,
        semester: data.semester,
        nilai: data.nilai,
        catatan: data.catatan?.trim() || null,
      })
      .onConflictDoUpdate({
        target: [
          nilai.santriId,
          nilai.mapelId,
          nilai.jenisNilaiId,
          nilai.tahunAjaranId,
          nilai.semester,
        ],
        set: {
          nilai: data.nilai,
          catatan: data.catatan?.trim() || null,
          guruId,
        },
      });
    await logActivity({
      userId: session.user.id,
      aksi: "upsert_nilai",
      entitas: "nilai",
      detail: {
        santriId: data.santriId,
        mapelId: data.mapelId,
        jenisNilaiId: data.jenisNilaiId,
        nilai: data.nilai,
      },
    });

    const { notifyUsers, userIdsOfWaliForSantri } = await import("@/lib/notify");
    const [santriUser] = await db
      .select({ userId: santriProfile.userId })
      .from(santriProfile)
      .where(eq(santriProfile.id, data.santriId))
      .limit(1);
    if (santriUser) {
      await notifyUsers({
        userIds: [santriUser.userId, ...(await userIdsOfWaliForSantri(data.santriId))],
        type: "nilai_baru",
        title: "Nilai baru masuk",
        message: `Nilai ${data.nilai} tersimpan untuk santri Anda.`,
        entitas: "nilai",
      });
    }
    revalidatePath("/guru/nilai");

    return ok(undefined, "Nilai berhasil disimpan.");
  } catch (error) {
    return toActionError(error);
  }
}

const bulkNilaiSchema = z.object({
  kelasId: z.string().min(1),
  mapelId: z.string().min(1),
  tahunAjaranId: z.string().min(1),
  semester: z.enum(["ganjil", "genap"]),
  entries: z
    .array(
      z.object({
        santriId: z.string().min(1),
        jenisNilaiId: z.string().min(1),
        nilai: z.coerce.number().min(0).max(100),
      }),
    )
    .max(500),
});

export async function simpanNilaiMassal(
  input: z.input<typeof bulkNilaiSchema>,
): Promise<ActionResult<{ tersimpan: number }>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru") return fail("Hanya guru yang dapat input nilai.");
    const data = bulkNilaiSchema.parse(input);
    const guruId = await getGuruProfileId(session.user.id);
    await assertPengajaran(guruId, data.kelasId, data.mapelId, data.tahunAjaranId);

    for (const entry of data.entries) {
      await db
        .insert(nilai)
        .values({
          santriId: entry.santriId,
          mapelId: data.mapelId,
          kelasId: data.kelasId,
          jenisNilaiId: entry.jenisNilaiId,
          guruId,
          tahunAjaranId: data.tahunAjaranId,
          semester: data.semester,
          nilai: entry.nilai,
        })
        .onConflictDoUpdate({
          target: [
            nilai.santriId,
            nilai.mapelId,
            nilai.jenisNilaiId,
            nilai.tahunAjaranId,
            nilai.semester,
          ],
          set: { nilai: entry.nilai, guruId },
        });
    }

    await logActivity({
      userId: session.user.id,
      aksi: "simpan_nilai_massal",
      entitas: "nilai",
      detail: { kelasId: data.kelasId, mapelId: data.mapelId, jumlah: data.entries.length },
    });

    revalidatePath("/guru/nilai");
    return ok({ tersimpan: data.entries.length }, `${data.entries.length} nilai berhasil disimpan.`);
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteNilai(nilaiId: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    const [row] = await db.select().from(nilai).where(eq(nilai.id, nilaiId)).limit(1);
    if (!row) return fail("Data nilai tidak ditemukan.");

    if (session.user.role === "guru") {
      const guruId = await getGuruProfileId(session.user.id);
      if (row.guruId !== guruId) {
        return fail("Nilai ini bukan diinput oleh Anda.");
      }
    } else if (session.user.role !== "admin") {
      return fail("Anda tidak memiliki izin.");
    }

    await db.delete(nilai).where(eq(nilai.id, nilaiId));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_nilai",
      entitas: "nilai",
      entitasId: nilaiId,
    });
    revalidatePath("/guru/nilai");
    return ok(undefined, "Nilai berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function getNilaiAkhir(
  santriId: string,
  mapelId: string,
  tahunAjaranId: string,
  semester: "ganjil" | "genap",
): Promise<number | null> {
  const rows = await db
    .select({ nilai: nilai.nilai, bobot: jenisNilai.bobot })
    .from(nilai)
    .innerJoin(jenisNilai, eq(nilai.jenisNilaiId, jenisNilai.id))
    .where(
      and(
        eq(nilai.santriId, santriId),
        eq(nilai.mapelId, mapelId),
        eq(nilai.tahunAjaranId, tahunAjaranId),
        eq(nilai.semester, semester),
      ),
    );

  if (rows.length === 0) return null;
  const totalBobot = rows.reduce((sum, row) => sum + row.bobot, 0);
  if (totalBobot === 0) {
    return rows.reduce((sum, row) => sum + row.nilai, 0) / rows.length;
  }
  return (
    rows.reduce((sum, row) => sum + row.nilai * row.bobot, 0) / totalBobot
  );
}

export async function getAktifTahunAjaran() {
  const [aktif] = await db
    .select()
    .from(tahunAjaran)
    .where(eq(tahunAjaran.isActive, true))
    .limit(1);
  return aktif ?? null;
}

export async function getSemesterAktif(): Promise<"ganjil" | "genap"> {
  const [settings] = await db
    .select({ semesterAktif: pesantrenSettings.semesterAktif })
    .from(pesantrenSettings)
    .where(eq(pesantrenSettings.id, "default"))
    .limit(1);
  return settings?.semesterAktif ?? "ganjil";
}
