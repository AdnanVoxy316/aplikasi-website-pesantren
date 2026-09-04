import "server-only";
import { db } from "@/db";
import { activityLog } from "@/db/schema";

export type ActivityInput = {
  userId?: string | null;
  aksi: string;
  entitas: string;
  entitasId?: string | null;
  detail?: Record<string, unknown> | null;
};

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await db.insert(activityLog).values({
      userId: input.userId ?? null,
      aksi: input.aksi,
      entitas: input.entitas,
      entitasId: input.entitasId ?? null,
      detail: input.detail ?? null,
    });
  } catch (error) {
    console.error("Gagal mencatat log aktivitas", error);
  }
}
