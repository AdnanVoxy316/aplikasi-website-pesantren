"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pesantrenSettings } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";
import { fileToDataUrl } from "@/lib/image-file";

const settingsSchema = z.object({
  namaPesantren: z.string().trim().min(1, "Nama pesantren wajib diisi"),
  alamat: z.string().trim().optional(),
  deskripsi: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  namaPimpinan: z.string().trim().optional(),
  kotaRapor: z.string().trim().optional(),
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
      .select({ id: pesantrenSettings.id, logoUrl: pesantrenSettings.logoUrl })
      .from(pesantrenSettings)
      .where(eq(pesantrenSettings.id, "default"))
      .limit(1);

    const values = {
      namaPesantren: data.namaPesantren,
      alamat: data.alamat?.trim() || null,
      deskripsi: data.deskripsi?.trim() || null,
      // logoUrl tidak dikirim dari form → pertahankan logo yang sudah diupload.
      logoUrl: data.logoUrl === undefined ? (existing?.logoUrl ?? null) : data.logoUrl.trim() || null,
      namaPimpinan: data.namaPimpinan?.trim() || null,
      kotaRapor: data.kotaRapor?.trim() || null,
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

async function setLogo(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  logoUrl: string | null,
): Promise<ActionResult<undefined>> {
  const [existing] = await db
    .select({ id: pesantrenSettings.id })
    .from(pesantrenSettings)
    .where(eq(pesantrenSettings.id, "default"))
    .limit(1);

  if (existing) {
    await db
      .update(pesantrenSettings)
      .set({ logoUrl })
      .where(eq(pesantrenSettings.id, "default"));
  } else {
    await db.insert(pesantrenSettings).values({ id: "default", logoUrl });
  }

  await logActivity({
    userId: session.user.id,
    aksi: logoUrl ? "update_logo_pesantren" : "hapus_logo_pesantren",
    entitas: "pesantren_settings",
    entitasId: "default",
  });

  revalidatePath("/", "layout");
  return ok(undefined, logoUrl ? "Logo pesantren berhasil diperbarui." : "Logo pesantren dihapus.");
}

export async function updateLogo(
  file: FormDataEntryValue | null,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat mengubah logo.");

    const dataUrl = await fileToDataUrl(file, "Logo");
    if (!dataUrl) return fail("Pilih file logo terlebih dahulu.");

    return await setLogo(session, dataUrl);
  } catch (error) {
    return toActionError(error);
  }
}

export async function hapusLogo(): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat menghapus logo.");

    return await setLogo(session, null);
  } catch (error) {
    return toActionError(error);
  }
}
