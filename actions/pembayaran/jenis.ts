"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { jenisPembayaran } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

const jenisSchema = z.object({
  kode: z
    .string()
    .trim()
    .min(2, "Kode minimal 2 karakter")
    .max(40, "Kode maksimal 40 karakter")
    .regex(/^[a-z0-9_]+$/, "Kode hanya huruf kecil, angka, dan garis bawah"),
  nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(80),
  kategori: z.enum(["bulanan", "sekali", "insidental"]),
  keterangan: z.string().trim().max(200).optional(),
  tarif: z.coerce
    .number()
    .int("Tarif harus bilangan bulat")
    .min(0, "Tarif tidak boleh negatif")
    .max(1_000_000_000, "Tarif terlalu besar")
    .optional(),
  urutan: z.coerce.number().int().min(0).max(999).optional(),
});

export async function createJenisPembayaran(
  input: z.input<typeof jenisSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengelola jenis pembayaran.");
    }
    const data = jenisSchema.parse(input);

    const [created] = await db
      .insert(jenisPembayaran)
      .values({
        kode: data.kode,
        nama: data.nama,
        kategori: data.kategori,
        keterangan: data.keterangan?.trim() || null,
        tarif: data.tarif ?? 0,
        urutan: data.urutan ?? 10,
        createdBy: session.user.id,
      })
      .returning({ id: jenisPembayaran.id });

    await logActivity({
      userId: session.user.id,
      aksi: "create_jenis_pembayaran",
      entitas: "jenis_pembayaran",
      entitasId: created.id,
      detail: { kode: data.kode, nama: data.nama },
    });

    revalidatePath("/admin/pembayaran/jenis-pembayaran");
    return ok(created, "Jenis pembayaran ditambahkan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateJenisPembayaran(
  id: string,
  input: z.input<typeof jenisSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah jenis pembayaran.");
    }
    const data = jenisSchema.parse(input);

    await db
      .update(jenisPembayaran)
      .set({
        kode: data.kode,
        nama: data.nama,
        kategori: data.kategori,
        keterangan: data.keterangan?.trim() || null,
        tarif: data.tarif ?? 0,
        urutan: data.urutan ?? 10,
      })
      .where(eq(jenisPembayaran.id, id));

    await logActivity({
      userId: session.user.id,
      aksi: "update_jenis_pembayaran",
      entitas: "jenis_pembayaran",
      entitasId: id,
      detail: { kode: data.kode, nama: data.nama },
    });

    revalidatePath("/admin/pembayaran/jenis-pembayaran");
    return ok(undefined, "Jenis pembayaran diperbarui.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function setJenisPembayaranAktif(
  id: string,
  isActive: boolean,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah jenis pembayaran.");
    }
    await db
      .update(jenisPembayaran)
      .set({ isActive })
      .where(eq(jenisPembayaran.id, id));

    await logActivity({
      userId: session.user.id,
      aksi: isActive ? "activate_jenis_pembayaran" : "deactivate_jenis_pembayaran",
      entitas: "jenis_pembayaran",
      entitasId: id,
    });

    revalidatePath("/admin/pembayaran/jenis-pembayaran");
    return ok(undefined, isActive ? "Jenis pembayaran diaktifkan." : "Jenis pembayaran dinonaktifkan.");
  } catch (error) {
    return toActionError(error);
  }
}
