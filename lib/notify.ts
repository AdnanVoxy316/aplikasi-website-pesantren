import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  notifikasi,
  santriProfile,
  user,
  waliSantriAnak,
  waliSantriProfile,
} from "@/db/schema";

export type NotifyInput = {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  entitas?: string;
  entitasId?: string;
};

export async function notifyUsers(input: NotifyInput): Promise<void> {
  const unique = Array.from(new Set(input.userIds)).filter(Boolean);
  if (unique.length === 0) return;
  try {
    await db.insert(notifikasi).values(
      unique.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entitas: input.entitas ?? null,
        entitasId: input.entitasId ?? null,
      })),
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi:", error);
  }
}

export async function userIdsOfKelas(kelasId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: santriProfile.userId })
    .from(santriProfile)
    .where(eq(santriProfile.kelasId, kelasId));
  return rows.map((r) => r.userId);
}

export async function userIdsOfWaliForSantri(santriId: string): Promise<string[]> {
  const relations = await db
    .select({ waliProfileId: waliSantriAnak.waliSantriId })
    .from(waliSantriAnak)
    .where(eq(waliSantriAnak.santriId, santriId));
  if (relations.length === 0) return [];
  const rows = await db
    .select({ userId: waliSantriProfile.userId })
    .from(waliSantriProfile)
    .where(
      inArray(
        waliSantriProfile.id,
        relations.map((r) => r.waliProfileId),
      ),
    );
  return rows.map((r) => r.userId);
}

export async function userIdsOfRole(
  role: "admin" | "guru" | "santri" | "wali_santri",
): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, role));
  return rows.map((r) => r.id);
}

export async function userIdsOfWaliForKelasSantri(santriIds: string[]): Promise<string[]> {
  if (santriIds.length === 0) return [];
  const relations = await db
    .select({ waliProfileId: waliSantriAnak.waliSantriId })
    .from(waliSantriAnak)
    .where(inArray(waliSantriAnak.santriId, santriIds));
  if (relations.length === 0) return [];
  const rows = await db
    .select({ userId: waliSantriProfile.userId })
    .from(waliSantriProfile)
    .where(
      inArray(
        waliSantriProfile.id,
        relations.map((r) => r.waliProfileId),
      ),
    );
  return rows.map((r) => r.userId);
}
