"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { kehadiran } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { assertPengajaran, getGuruProfileId } from "@/lib/permissions";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

const kehadiranEntrySchema = z.object({
  santriId: z.string().min(1),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
});

const simpanKehadiranSchema = z.object({
  kelasId: z.string().min(1),
  mapelId: z.string().min(1),
  tahunAjaranId: z.string().min(1),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  entries: z.array(kehadiranEntrySchema).min(1, "Minimal satu santri"),
});

export async function simpanKehadiran(
  input: z.input<typeof simpanKehadiranSchema>,
): Promise<ActionResult<{ tersimpan: number }>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru") return fail("Hanya guru yang dapat mencatat kehadiran.");

    const data = simpanKehadiranSchema.parse(input);
    const guruId = await getGuruProfileId(session.user.id);
    await assertPengajaran(guruId, data.kelasId, data.mapelId, data.tahunAjaranId);

    for (const entry of data.entries) {
      await db
        .insert(kehadiran)
        .values({
          santriId: entry.santriId,
          kelasId: data.kelasId,
          mapelId: data.mapelId,
          tanggal: data.tanggal,
          status: entry.status,
          dicatatOleh: guruId,
          tahunAjaranId: data.tahunAjaranId,
        })
        .onConflictDoUpdate({
          target: [kehadiran.santriId, kehadiran.tanggal, kehadiran.mapelId],
          set: {
            status: entry.status,
            dicatatOleh: guruId,
            kelasId: data.kelasId,
          },
        });
    }

    revalidatePath("/guru/kehadiran");
    return ok(
      { tersimpan: data.entries.length },
      `Kehadiran ${data.entries.length} santri berhasil disimpan.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteKehadiran(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    const [row] = await db.select().from(kehadiran).where(eq(kehadiran.id, id)).limit(1);
    if (!row) return fail("Data kehadiran tidak ditemukan.");

    if (session.user.role === "guru") {
      const guruId = await getGuruProfileId(session.user.id);
      if (row.dicatatOleh !== guruId) return fail("Data ini bukan dicatat oleh Anda.");
    } else if (session.user.role !== "admin") {
      return fail("Anda tidak memiliki izin.");
    }

    await db.delete(kehadiran).where(eq(kehadiran.id, id));
    revalidatePath("/guru/kehadiran");
    return ok(undefined, "Data kehadiran dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}
