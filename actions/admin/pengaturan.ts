"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pesantrenSettings } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

const settingsSchema = z.object({
  namaPesantren: z.string().trim().min(1, "Nama pesantren wajib diisi"),
  alamat: z.string().trim().optional(),
  deskripsi: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  semesterAktif: z.enum(["ganjil", "genap"]),
});

export async function updatePengaturan(
  input: z.input<typeof settingsSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat mengubah pengaturan.");

    const data = settingsSchema.parse(input);
    const [existing] = await db
      .select({ id: pesantrenSettings.id })
      .from(pesantrenSettings)
      .where(eq(pesantrenSettings.id, "default"))
      .limit(1);

    const values = {
      namaPesantren: data.namaPesantren,
      alamat: data.alamat?.trim() || null,
      deskripsi: data.deskripsi?.trim() || null,
      logoUrl: data.logoUrl?.trim() || null,
      semesterAktif: data.semesterAktif,
    };

    if (existing) {
      await db
        .update(pesantrenSettings)
        .set(values)
        .where(eq(pesantrenSettings.id, "default"));
    } else {
      await db.insert(pesantrenSettings).values({ id: "default", ...values });
    }

    await logActivity({
      userId: session.user.id,
      aksi: "update_pengaturan_situs",
      entitas: "pesantren_settings",
      entitasId: "default",
    });

    revalidatePath("/admin/pengaturan");
    return ok(undefined, "Pengaturan berhasil disimpan.");
  } catch (error) {
    return toActionError(error);
  }
}
