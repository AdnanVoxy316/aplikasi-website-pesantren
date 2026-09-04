"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pengumuman } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { ok, toActionError, fail, type ActionResult } from "@/lib/action-result";

const pengumumanSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter"),
  isi: z.string().trim().min(3, "Isi minimal 3 karakter"),
  targetRole: z
    .enum(["semua", "admin", "guru", "santri", "wali_santri"])
    .default("semua"),
  targetKelasId: z.string().trim().optional(),
});

export async function createPengumuman(
  input: z.input<typeof pengumumanSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat membuat pengumuman.");

    const data = pengumumanSchema.parse(input);
    const [created] = await db
      .insert(pengumuman)
      .values({
        judul: data.judul,
        isi: data.isi,
        targetRole: data.targetRole,
        targetKelasId: data.targetKelasId?.trim() || null,
        dibuatOleh: session.user.id,
      })
      .returning({ id: pengumuman.id });

    await logActivity({
      userId: session.user.id,
      aksi: "create_pengumuman",
      entitas: "pengumuman",
      entitasId: created.id,
    });

    const { notifyUsers, userIdsOfKelas, userIdsOfRole } = await import("@/lib/notify");
    const roleMap: Record<
      "semua" | "admin" | "guru" | "santri" | "wali_santri",
      string[]
    > = {
      semua: [
        ...(await userIdsOfRole("guru")),
        ...(await userIdsOfRole("santri")),
        ...(await userIdsOfRole("wali_santri")),
      ],
      admin: await userIdsOfRole("admin"),
      guru: await userIdsOfRole("guru"),
      santri: data.targetKelasId?.trim()
        ? await userIdsOfKelas(data.targetKelasId.trim())
        : await userIdsOfRole("santri"),
      wali_santri: await userIdsOfRole("wali_santri"),
    };
    await notifyUsers({
      userIds: roleMap[data.targetRole] ?? [],
      type: "pengumuman",
      title: "Pengumuman baru",
      message: data.judul,
      entitas: "pengumuman",
      entitasId: created.id,
    });

    revalidatePath("/admin/pengumuman");
    return ok(created, "Pengumuman berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePengumuman(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat menghapus pengumuman.");

    await db.delete(pengumuman).where(eq(pengumuman.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_pengumuman",
      entitas: "pengumuman",
      entitasId: id,
    });

    revalidatePath("/admin/pengumuman");
    return ok(undefined, "Pengumuman berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}
