import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  guruProfile,
  jenisNilai,
  kehadiran,
  kelas,
  mapel,
  nilai,
  pengajaran,
  rapor,
  santriProfile,
  tugas,
  tugasSubmission,
  user,
  tahunAjaran,
} from "@/db/schema";

export async function getGuruProfile(userId: string) {
  const [row] = await db
    .select()
    .from(guruProfile)
    .where(eq(guruProfile.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function listPengajaranGuru(guruProfileId: string) {
  return db
    .select({
      id: pengajaran.id,
      kelasId: kelas.id,
      kelasNama: kelas.nama,
      mapelId: mapel.id,
      mapelNama: mapel.nama,
      kategori: mapel.kategori,
      tahunAjaranId: tahunAjaran.id,
      tahunAjaranLabel: tahunAjaran.label,
      jumlahSantri: sql<number>`(select count(*) from ${santriProfile} where ${santriProfile.kelasId} = ${kelas.id})`,
    })
    .from(pengajaran)
    .innerJoin(kelas, eq(pengajaran.kelasId, kelas.id))
    .innerJoin(mapel, eq(pengajaran.mapelId, mapel.id))
    .innerJoin(tahunAjaran, eq(pengajaran.tahunAjaranId, tahunAjaran.id))
    .where(eq(pengajaran.guruId, guruProfileId))
    .orderBy(kelas.nama, mapel.nama);
}

export async function listSantriOfKelas(kelasId: string) {
  return db
    .select({
      id: santriProfile.id,
      nama: user.name,
      nis: santriProfile.nis,
    })
    .from(santriProfile)
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .where(eq(santriProfile.kelasId, kelasId))
    .orderBy(user.name);
}

export async function listNilaiKelasMapel(
  kelasId: string,
  mapelId: string,
  tahunAjaranId: string,
  semester: "ganjil" | "genap",
) {
  const santriRows = await listSantriOfKelas(kelasId);
  const jenisRows = await db.select().from(jenisNilai).orderBy(asc(jenisNilai.id));

  const nilaiRows = await db
    .select({
      santriId: nilai.santriId,
      jenisNilaiId: nilai.jenisNilaiId,
      nilai: nilai.nilai,
      catatan: nilai.catatan,
    })
    .from(nilai)
    .where(
      and(
        eq(nilai.kelasId, kelasId),
        eq(nilai.mapelId, mapelId),
        eq(nilai.tahunAjaranId, tahunAjaranId),
        eq(nilai.semester, semester),
      ),
    );

  return { santri: santriRows, jenisNilai: jenisRows, nilai: nilaiRows };
}

export async function listTugasGuru(guruProfileId: string) {
  return db
    .select({
      id: tugas.id,
      judul: tugas.judul,
      deskripsi: tugas.deskripsi,
      kelasNama: kelas.nama,
      mapelNama: mapel.nama,
      deadline: tugas.deadline,
      createdAt: tugas.createdAt,
      totalSantri: sql<number>`(select count(*) from ${santriProfile} where ${santriProfile.kelasId} = ${tugas.kelasId})`,
      totalSubmission: sql<number>`(select count(*) from ${tugasSubmission} where ${tugasSubmission.tugasId} = ${tugas.id})`,
      totalDinilai: sql<number>`(select count(*) from ${tugasSubmission} where ${tugasSubmission.tugasId} = ${tugas.id} and ${tugasSubmission.status} = 'dinilai')`,
    })
    .from(tugas)
    .innerJoin(kelas, eq(tugas.kelasId, kelas.id))
    .innerJoin(mapel, eq(tugas.mapelId, mapel.id))
    .where(eq(tugas.guruId, guruProfileId))
    .orderBy(desc(tugas.createdAt));
}

export async function listTugasDiampu(guruProfileId: string) {
  const rows = await db
    .select({ kelasId: pengajaran.kelasId, mapelId: pengajaran.mapelId })
    .from(pengajaran)
    .where(eq(pengajaran.guruId, guruProfileId));
  return rows;
}

export async function listSubmissionsOfTugas(tugasId: string) {
  return db
    .select({
      id: tugasSubmission.id,
      santriNama: user.name,
      nis: santriProfile.nis,
      tipe: tugasSubmission.tipe,
      fileNamaAsli: tugasSubmission.fileNamaAsli,
      url: tugasSubmission.url,
      status: tugasSubmission.status,
      nilai: tugasSubmission.nilai,
      feedbackGuru: tugasSubmission.feedbackGuru,
      submittedAt: tugasSubmission.submittedAt,
    })
    .from(tugasSubmission)
    .innerJoin(santriProfile, eq(tugasSubmission.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .where(eq(tugasSubmission.tugasId, tugasId))
    .orderBy(user.name);
}

export async function getTugasById(tugasId: string) {
  const [row] = await db
    .select({
      id: tugas.id,
      judul: tugas.judul,
      deskripsi: tugas.deskripsi,
      kelasId: tugas.kelasId,
      kelasNama: kelas.nama,
      mapelNama: mapel.nama,
      guruId: tugas.guruId,
      deadline: tugas.deadline,
    })
    .from(tugas)
    .innerJoin(kelas, eq(tugas.kelasId, kelas.id))
    .innerJoin(mapel, eq(tugas.mapelId, mapel.id))
    .where(eq(tugas.id, tugasId))
    .limit(1);
  return row ?? null;
}

export async function listKehadiranTanggal(
  kelasId: string,
  mapelId: string,
  tanggal: string,
) {
  const rows = await db
    .select({
      santriId: kehadiran.santriId,
      status: kehadiran.status,
    })
    .from(kehadiran)
    .where(
      and(
        eq(kehadiran.kelasId, kelasId),
        eq(kehadiran.mapelId, mapelId),
        eq(kehadiran.tanggal, tanggal),
      ),
    );
  return new Map(rows.map((r) => [r.santriId, r.status]));
}

export async function listRiwayatKehadiranKelas(
  kelasId: string,
  mapelId: string,
  limit = 30,
) {
  return db
    .select({
      tanggal: kehadiran.tanggal,
      hadir: sql<number>`sum(case when ${kehadiran.status} = 'hadir' then 1 else 0 end)`,
      izin: sql<number>`sum(case when ${kehadiran.status} = 'izin' then 1 else 0 end)`,
      sakit: sql<number>`sum(case when ${kehadiran.status} = 'sakit' then 1 else 0 end)`,
      alpa: sql<number>`sum(case when ${kehadiran.status} = 'alpa' then 1 else 0 end)`,
      total: count(),
    })
    .from(kehadiran)
    .where(and(eq(kehadiran.kelasId, kelasId), eq(kehadiran.mapelId, mapelId)))
    .groupBy(kehadiran.tanggal)
    .orderBy(desc(kehadiran.tanggal))
    .limit(limit);
}

export async function listRaporKelas(kelasId: string, tahunAjaranId: string) {
  return db
    .select({
      id: rapor.id,
      santriId: rapor.santriId,
      santriNama: user.name,
      nis: santriProfile.nis,
      semester: rapor.semester,
      generatedAt: rapor.generatedAt,
      catatan: rapor.catatanWaliKelas,
      ringkasanNilai: rapor.ringkasanNilai,
      ringkasanKehadiran: rapor.ringkasanKehadiran,
    })
    .from(rapor)
    .innerJoin(santriProfile, eq(rapor.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .where(
      and(eq(rapor.kelasId, kelasId), eq(rapor.tahunAjaranId, tahunAjaranId)),
    )
    .orderBy(user.name, rapor.semester);
}

export async function getGuruDashboardStats(guruProfileId: string) {
  const pengajaranRows = await listPengajaranGuru(guruProfileId);
  const kelasIds = Array.from(new Set(pengajaranRows.map((p) => p.kelasId)));

  const [tugasAktif] = await db
    .select({ c: count() })
    .from(tugas)
    .where(
      and(eq(tugas.guruId, guruProfileId), sql`${tugas.deadline} > unixepoch('subsecond') * 1000`),
    );

  let submissionMenunggu = 0;
  if (kelasIds.length > 0) {
    const [row] = await db
      .select({ c: count() })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(
        and(
          inArray(tugas.kelasId, kelasIds),
          inArray(tugasSubmission.status, ["dikumpulkan", "terlambat"]),
        ),
      );
    submissionMenunggu = row.c;
  }

  const [totalSantri] = kelasIds.length
    ? await db
        .select({ c: count() })
        .from(santriProfile)
        .where(inArray(santriProfile.kelasId, kelasIds))
    : [{ c: 0 }];

  return {
    jumlahKelasDiampu: kelasIds.length,
    jumlahMapelDiampu: new Set(pengajaranRows.map((p) => p.mapelId)).size,
    totalSantri: totalSantri.c,
    tugasAktif: tugasAktif.c,
    submissionMenunggu,
    pengajaran: pengajaranRows,
  };
}
