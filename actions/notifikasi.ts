"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";

export async function markAllNotificationsRead(): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return ok(undefined);
    await db
      .update(notifikasi)
      .set({ isRead: true })
      .where(
        and(eq(notifikasi.userId, session.user.id), eq(notifikasi.isRead, false)),
      );
    revalidatePath("/", "layout");
    return ok(undefined);
  } catch (error) {
    return toActionError(error);
  }
}
