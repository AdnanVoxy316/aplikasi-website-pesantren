"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";
import { fileToDataUrl } from "@/lib/image-file";

export async function updateFotoProfil(input: {
  file: FormDataEntryValue | null;
  hapus?: boolean;
}): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi berakhir. Silakan masuk kembali.");

    const dataUrl = input.hapus ? null : await fileToDataUrl(input.file, "Foto profil");
    if (!input.hapus && !dataUrl) return fail("Pilih file foto terlebih dahulu.");

    await db
      .update(user)
      .set({ image: dataUrl })
      .where(eq(user.id, session.user.id));

    await logActivity({
      userId: session.user.id,
      aksi: input.hapus ? "hapus_foto_profil" : "update_foto_profil",
      entitas: "user",
      entitasId: session.user.id,
    });

    revalidatePath("/", "layout");
    return ok(
      undefined,
      input.hapus ? "Foto profil dihapus." : "Foto profil berhasil diperbarui.",
    );
  } catch (error) {
    return toActionError(error);
  }
}
