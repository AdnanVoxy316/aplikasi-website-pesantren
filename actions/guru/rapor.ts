"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  jenisNilai,
  kehadiran,
  kelas,
  mapel,
  nilai,
  pengajaran,
  rapor,
  santriProfile,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getGuruProfileId } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

type RingkasanMapel = {
  mapelId: string;
  nama: string;
  kategori: string;
  detail: { jenis: string; nilai: number; bobot: number }[];
  nilaiAkhir: number | null;
};

type RingkasanKehadiran = {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
};

const generateRaporSchema = z.object({
  santriId: z.string().min(1),
  kelasId: z.string().min(1),
  tahunAjaranId: z.string().min(1),
  semester: z.enum(["ganjil", "genap"]),
  catatanWaliKelas: z.string().trim().optional(),
});

async function buildSnapshot(
  santriId: string,
  kelasId: string,
  tahunAjaranId: string,
  semester: "ganjil" | "genap",
): Promise<{ ringkasanNilai: RingkasanMapel[]; ringkasanKehadiran: RingkasanKehadiran }> {
  const nilaiRows = await db
    .select({
      mapelId: mapel.id,
      mapelNama: mapel.nama,
      mapelKategori: mapel.kategori,
      jenisNama: jenisNilai.nama,
      nilai: nilai.nilai,
      bobot: jenisNilai.bobot,
    })
    .from(nilai)
    .innerJoin(mapel, eq(nilai.mapelId, mapel.id))
    .innerJoin(jenisNilai, eq(nilai.jenisNilaiId, jenisNilai.id))
    .where(
      and(
        eq(nilai.santriId, santriId),
        eq(nilai.kelasId, kelasId),
        eq(nilai.tahunAjaranId, tahunAjaranId),
        eq(nilai.semester, semester),
      ),
    );

  const grouped = new Map<string, RingkasanMapel>();
  for (const row of nilaiRows) {
    let entry = grouped.get(row.mapelId);
    if (!entry) {
      entry = {
        mapelId: row.mapelId,
        nama: row.mapelNama,
        kategori: row.mapelKategori,
        detail: [],
        nilaiAkhir: null,
      };
      grouped.set(row.mapelId, entry);
    }
    entry.detail.push({
      jenis: row.jenisNama,
      nilai: row.nilai,
      bobot: row.bobot,
    });
  }

  for (const entry of grouped.values()) {
    const totalBobot = entry.detail.reduce((sum, d) => sum + d.bobot, 0);
    if (totalBobot > 0) {
      entry.nilaiAkhir =
        Math.round(
          (entry.detail.reduce((sum, d) => sum + d.nilai * d.bobot, 0) / totalBobot) * 100,
        ) / 100;
    }
  }

  const kehadiranRows = await db
    .select({ status: kehadiran.status })
    .from(kehadiran)
    .where(
      and(
        eq(kehadiran.santriId, santriId),
        eq(kehadiran.tahunAjaranId, tahunAjaranId),
      ),
    );

  const ringkasanKehadiran: RingkasanKehadiran = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpa: 0,
    total: kehadiranRows.length,
  };
  for (const row of kehadiranRows) {
    ringkasanKehadiran[row.status] += 1;
  }

  return {
    ringkasanNilai: Array.from(grouped.values()),
    ringkasanKehadiran,
  };
}

export async function generateRapor(
  input: z.input<typeof generateRaporSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru" && session.user.role !== "admin") {
      return fail("Hanya guru atau admin yang dapat generate rapor.");
    }

    const data = generateRaporSchema.parse(input);

    if (session.user.role === "guru") {
      const guruId = await getGuruProfileId(session.user.id);
      const [isWaliKelas] = await db
        .select({ id: kelas.id })
        .from(kelas)
        .where(and(eq(kelas.id, data.kelasId), eq(kelas.waliKelasId, guruId)))
        .limit(1);
      if (!isWaliKelas) {
        const [hasPengajaran] = await db
          .select({ id: pengajaran.id })
          .from(pengajaran)
          .where(
            and(
              eq(pengajaran.guruId, guruId),
              eq(pengajaran.kelasId, data.kelasId),
              eq(pengajaran.tahunAjaranId, data.tahunAjaranId),
            ),
          )
          .limit(1);
        if (!hasPengajaran) {
          return fail("Anda tidak diizinkan generate rapor untuk kelas ini.");
        }
      }
    }

    const [santri] = await db
      .select({ id: santriProfile.id, kelasId: santriProfile.kelasId })
      .from(santriProfile)
      .where(eq(santriProfile.id, data.santriId))
      .limit(1);
    if (!santri) return fail("Santri tidak ditemukan.");
    if (santri.kelasId !== data.kelasId) {
      return fail("Santri tidak terdaftar di kelas tersebut.");
    }

    const snapshot = await buildSnapshot(
      data.santriId,
      data.kelasId,
      data.tahunAjaranId,
      data.semester,
    );

    const [saved] = await db
      .insert(rapor)
      .values({
        santriId: data.santriId,
        kelasId: data.kelasId,
        tahunAjaranId: data.tahunAjaranId,
        semester: data.semester,
        ringkasanNilai: JSON.stringify(snapshot.ringkasanNilai),
        ringkasanKehadiran: JSON.stringify(snapshot.ringkasanKehadiran),
        catatanWaliKelas: data.catatanWaliKelas?.trim() || null,
        generatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [rapor.santriId, rapor.tahunAjaranId, rapor.semester],
        set: {
          kelasId: data.kelasId,
          ringkasanNilai: JSON.stringify(snapshot.ringkasanNilai),
          ringkasanKehadiran: JSON.stringify(snapshot.ringkasanKehadiran),
          catatanWaliKelas: data.catatanWaliKelas?.trim() || null,
          generatedBy: session.user.id,
        },
      })
      .returning({ id: rapor.id });

    await logActivity({
      userId: session.user.id,
      aksi: "generate_rapor",
      entitas: "rapor",
      entitasId: saved.id,
      detail: { santriId: data.santriId, semester: data.semester },
    });

    const { notifyUsers, userIdsOfWaliForSantri } = await import("@/lib/notify");
    const [santriUser] = await db
      .select({ userId: santriProfile.userId })
      .from(santriProfile)
      .where(eq(santriProfile.id, data.santriId))
      .limit(1);
    if (santriUser) {
      await notifyUsers({
        userIds: [santriUser.userId, ...(await userIdsOfWaliForSantri(data.santriId))],
        type: "rapor_tersedia",
        title: "Rapor tersedia",
        message: `Rapor semester ${data.semester} sudah bisa dilihat dan diunduh.`,
        entitas: "rapor",
        entitasId: saved.id,
      });
    }

    revalidatePath("/guru/rapor");
    revalidatePath("/admin/rapor");
    return ok(saved, "Rapor berhasil digenerate.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function getRaporForSantri(santriProfileId: string) {
  return db
    .select()
    .from(rapor)
    .where(eq(rapor.santriId, santriProfileId));
}
