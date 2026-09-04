import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  guruProfile,
  pengajaran,
  santriProfile,
  waliSantriAnak,
  waliSantriProfile,
} from "@/db/schema";

export class AuthorizationError extends Error {
  constructor(message = "Anda tidak memiliki akses untuk aksi ini.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getGuruProfileId(userId: string): Promise<string> {
  const [guru] = await db
    .select({ id: guruProfile.id })
    .from(guruProfile)
    .where(eq(guruProfile.userId, userId))
    .limit(1);
  if (!guru) throw new AuthorizationError("Profil guru tidak ditemukan.");
  return guru.id;
}

export async function getSantriProfileId(userId: string): Promise<string> {
  const [santri] = await db
    .select({ id: santriProfile.id })
    .from(santriProfile)
    .where(eq(santriProfile.userId, userId))
    .limit(1);
  if (!santri) throw new AuthorizationError("Profil santri tidak ditemukan.");
  return santri.id;
}

export async function getWaliProfileId(userId: string): Promise<string> {
  const [wali] = await db
    .select({ id: waliSantriProfile.id })
    .from(waliSantriProfile)
    .where(eq(waliSantriProfile.userId, userId))
    .limit(1);
  if (!wali) throw new AuthorizationError("Profil wali santri tidak ditemukan.");
  return wali.id;
}

export async function assertPengajaran(
  guruProfileId: string,
  kelasId: string,
  mapelId: string,
  tahunAjaranId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: pengajaran.id })
    .from(pengajaran)
    .where(
      and(
        eq(pengajaran.guruId, guruProfileId),
        eq(pengajaran.kelasId, kelasId),
        eq(pengajaran.mapelId, mapelId),
        eq(pengajaran.tahunAjaranId, tahunAjaranId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new AuthorizationError(
      "Anda tidak ditugaskan mengajar mapel ini di kelas tersebut.",
    );
  }
}

export async function assertAnakOfWali(
  waliProfileId: string,
  santriProfileId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: waliSantriAnak.id })
    .from(waliSantriAnak)
    .where(
      and(
        eq(waliSantriAnak.waliSantriId, waliProfileId),
        eq(waliSantriAnak.santriId, santriProfileId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new AuthorizationError("Santri ini bukan anak yang terhubung dengan Anda.");
  }
}

export async function listAnakOfWali(
  waliProfileId: string,
): Promise<string[]> {
  const rows = await db
    .select({ santriId: waliSantriAnak.santriId })
    .from(waliSantriAnak)
    .where(eq(waliSantriAnak.waliSantriId, waliProfileId));
  return rows.map((row) => row.santriId);
}
