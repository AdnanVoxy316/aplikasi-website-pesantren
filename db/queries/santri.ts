import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  jenisNilai,
  kehadiran,
  kelas,
  mapel,
  nilai,
  pembayaranSpp,
  pengumuman,
  rapor,
  santriProfile,
  tagihanSpp,
  tugas,
  tugasSubmission,
  user,
  waliSantriAnak,
  waliSantriProfile,
} from "@/db/schema";

export async function getSantriProfile(userId: string) {
  const [row] = await db
    .select({
      id: santriProfile.id,
      nis: santriProfile.nis,
      kelasId: santriProfile.kelasId,
      kelasNama: kelas.nama,
      tingkat: kelas.tingkat,
      tempatLahir: santriProfile.tempatLahir,
      tanggalLahir: santriProfile.tanggalLahir,
      alamat: santriProfile.alamat,
    })
    .from(santriProfile)
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .where(eq(santriProfile.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function listTugasUntukSantri(santriId: string, kelasId: string | null) {
  if (!kelasId) return [];
  return db
    .select({
      id: tugas.id,
      judul: tugas.judul,
      deskripsi: tugas.deskripsi,
      mapelNama: mapel.nama,
      kelasNama: kelas.nama,
      deadline: tugas.deadline,
      createdAt: tugas.createdAt,
      submissionId: tugasSubmission.id,
      submissionStatus: tugasSubmission.status,
      submissionTipe: tugasSubmission.tipe,
      submissionNilai: tugasSubmission.nilai,
      feedbackGuru: tugasSubmission.feedbackGuru,
    })
    .from(tugas)
    .innerJoin(mapel, eq(tugas.mapelId, mapel.id))
    .innerJoin(kelas, eq(tugas.kelasId, kelas.id))
    .leftJoin(
      tugasSubmission,
      and(eq(tugasSubmission.tugasId, tugas.id), eq(tugasSubmission.santriId, santriId)),
    )
    .where(eq(tugas.kelasId, kelasId))
    .orderBy(desc(tugas.createdAt));
}

export async function getTugasDetailUntukSantri(tugasId: string, santriId: string, kelasId: string | null) {
  if (!kelasId) return null;
  const [row] = await db
    .select({
      id: tugas.id,
      judul: tugas.judul,
      deskripsi: tugas.deskripsi,
      mapelNama: mapel.nama,
      kelasNama: kelas.nama,
      deadline: tugas.deadline,
      kelasId: tugas.kelasId,
      submissionId: tugasSubmission.id,
      submissionStatus: tugasSubmission.status,
      submissionTipe: tugasSubmission.tipe,
      filePath: tugasSubmission.filePath,
      fileNamaAsli: tugasSubmission.fileNamaAsli,
      fileSize: tugasSubmission.fileSize,
      url: tugasSubmission.url,
      nilai: tugasSubmission.nilai,
      feedbackGuru: tugasSubmission.feedbackGuru,
      submittedAt: tugasSubmission.submittedAt,
    })
    .from(tugas)
    .innerJoin(mapel, eq(tugas.mapelId, mapel.id))
    .innerJoin(kelas, eq(tugas.kelasId, kelas.id))
    .leftJoin(
      tugasSubmission,
      and(eq(tugasSubmission.tugasId, tugas.id), eq(tugasSubmission.santriId, santriId)),
    )
    .where(and(eq(tugas.id, tugasId), eq(tugas.kelasId, kelasId)))
    .limit(1);
  return row ?? null;
}

export async function listNilaiSantri(
  santriId: string,
  tahunAjaranId: string,
  semester: "ganjil" | "genap",
) {
  const rows = await db
    .select({
      mapelId: mapel.id,
      mapelNama: mapel.nama,
      kategori: mapel.kategori,
      jenisNama: jenisNilai.nama,
      bobot: jenisNilai.bobot,
      nilai: nilai.nilai,
      catatan: nilai.catatan,
      updatedAt: nilai.updatedAt,
    })
    .from(nilai)
    .innerJoin(mapel, eq(nilai.mapelId, mapel.id))
    .innerJoin(jenisNilai, eq(nilai.jenisNilaiId, jenisNilai.id))
    .where(
      and(
        eq(nilai.santriId, santriId),
        eq(nilai.tahunAjaranId, tahunAjaranId),
        eq(nilai.semester, semester),
      ),
    )
    .orderBy(mapel.nama);

  const grouped = new Map<string, {
    mapelId: string;
    mapelNama: string;
    kategori: string;
    detail: { jenis: string; nilai: number; bobot: number }[];
    nilaiAkhir: number | null;
  }>();
  for (const row of rows) {
    let entry = grouped.get(row.mapelId);
    if (!entry) {
      entry = {
        mapelId: row.mapelId,
        mapelNama: row.mapelNama,
        kategori: row.kategori,
        detail: [],
        nilaiAkhir: null,
      };
      grouped.set(row.mapelId, entry);
    }
    entry.detail.push({ jenis: row.jenisNama, nilai: row.nilai, bobot: row.bobot });
  }
  for (const entry of grouped.values()) {
    const totalBobot = entry.detail.reduce((s, d) => s + d.bobot, 0);
    if (totalBobot > 0) {
      entry.nilaiAkhir =
        Math.round((entry.detail.reduce((s, d) => s + d.nilai * d.bobot, 0) / totalBobot) * 100) / 100;
    }
  }
  return Array.from(grouped.values());
}

export async function getRekapKehadiranSantri(santriId: string, tahunAjaranId?: string) {
  const [row] = await db
    .select({
      hadir: sql<number>`sum(case when ${kehadiran.status} = 'hadir' then 1 else 0 end)`,
      izin: sql<number>`sum(case when ${kehadiran.status} = 'izin' then 1 else 0 end)`,
      sakit: sql<number>`sum(case when ${kehadiran.status} = 'sakit' then 1 else 0 end)`,
      alpa: sql<number>`sum(case when ${kehadiran.status} = 'alpa' then 1 else 0 end)`,
      total: count(),
    })
    .from(kehadiran)
    .where(
      tahunAjaranId
        ? and(eq(kehadiran.santriId, santriId), eq(kehadiran.tahunAjaranId, tahunAjaranId))
        : eq(kehadiran.santriId, santriId),
    );
  return row ?? { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
}

export async function listRiwayatKehadiranSantri(santriId: string, limit = 30) {
  return db
    .select({
      tanggal: kehadiran.tanggal,
      status: kehadiran.status,
      mapelNama: mapel.nama,
    })
    .from(kehadiran)
    .leftJoin(mapel, eq(kehadiran.mapelId, mapel.id))
    .where(eq(kehadiran.santriId, santriId))
    .orderBy(desc(kehadiran.tanggal))
    .limit(limit);
}

export async function listRaporSantri(santriId: string) {
  return db
    .select({
      id: rapor.id,
      semester: rapor.semester,
      tahunAjaranLabel: sql<string>`(select label from tahun_ajaran where tahun_ajaran.id = ${rapor.tahunAjaranId})`,
      generatedAt: rapor.generatedAt,
      catatan: rapor.catatanWaliKelas,
      ringkasanNilai: rapor.ringkasanNilai,
      ringkasanKehadiran: rapor.ringkasanKehadiran,
    })
    .from(rapor)
    .where(eq(rapor.santriId, santriId))
    .orderBy(desc(rapor.generatedAt));
}

export async function getRaporById(raporId: string) {
  const [row] = await db
    .select({
      id: rapor.id,
      santriId: rapor.santriId,
      santriNama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
      semester: rapor.semester,
      generatedAt: rapor.generatedAt,
      catatan: rapor.catatanWaliKelas,
      ringkasanNilai: rapor.ringkasanNilai,
      ringkasanKehadiran: rapor.ringkasanKehadiran,
    })
    .from(rapor)
    .innerJoin(santriProfile, eq(rapor.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .innerJoin(kelas, eq(rapor.kelasId, kelas.id))
    .where(eq(rapor.id, raporId))
    .limit(1);
  return row ?? null;
}

export async function listTagihanUntukSantri(santriId: string) {
  return db
    .select()
    .from(tagihanSpp)
    .where(eq(tagihanSpp.santriId, santriId))
    .orderBy(desc(tagihanSpp.periodeTahun), desc(tagihanSpp.periodeBulan));
}

export async function listRiwayatPembayaranSantri(santriId: string) {
  return db
    .select({
      id: pembayaranSpp.id,
      nomorTagihan: tagihanSpp.nomorTagihan,
      periodeBulan: tagihanSpp.periodeBulan,
      periodeTahun: tagihanSpp.periodeTahun,
      provider: pembayaranSpp.provider,
      paymentMethod: pembayaranSpp.paymentMethod,
      nominalDibayar: pembayaranSpp.nominalDibayar,
      status: pembayaranSpp.status,
      paidAt: pembayaranSpp.paidAt,
      checkoutUrl: pembayaranSpp.checkoutUrl,
      createdAt: pembayaranSpp.createdAt,
    })
    .from(pembayaranSpp)
    .innerJoin(tagihanSpp, eq(pembayaranSpp.tagihanSppId, tagihanSpp.id))
    .where(eq(tagihanSpp.santriId, santriId))
    .orderBy(desc(pembayaranSpp.createdAt))
    .limit(100);
}

export async function getSantriDashboardStats(santriId: string, kelasId: string | null) {
  const tugasRows = await listTugasUntukSantri(santriId, kelasId);
  const now = Date.now();
  const tugasAktif = tugasRows.filter(
    (t) => t.deadline.getTime() > now && !t.submissionId,
  ).length;
  const tugasBelumDinilai = tugasRows.filter(
    (t) => t.submissionId && t.submissionStatus !== "dinilai",
  ).length;
  const kehadiran = await getRekapKehadiranSantri(santriId);

  let tagihanAktif = 0;
  let tagihanNominal = 0;
  if (kelasId) {
    const rows = await db
      .select({ total: tagihanSpp.totalTagihan })
      .from(tagihanSpp)
      .where(
        and(
          eq(tagihanSpp.santriId, santriId),
          inArray(tagihanSpp.status, ["unpaid", "pending", "processing"]),
        ),
      );
    tagihanAktif = rows.length;
    tagihanNominal = rows.reduce((s, r) => s + r.total, 0);
  }

  return {
    tugasAktif,
    tugasBelumDinilai,
    totalTugas: tugasRows.length,
    kehadiran,
    tagihanAktif,
    tagihanNominal,
  };
}

export async function getNilaiTerbaruSantri(santriId: string, limit = 5) {
  return db
    .select({
      mapelNama: mapel.nama,
      jenisNama: jenisNilai.nama,
      nilai: nilai.nilai,
      updatedAt: nilai.updatedAt,
    })
    .from(nilai)
    .innerJoin(mapel, eq(nilai.mapelId, mapel.id))
    .innerJoin(jenisNilai, eq(nilai.jenisNilaiId, jenisNilai.id))
    .where(eq(nilai.santriId, santriId))
    .orderBy(desc(nilai.updatedAt))
    .limit(limit);
}

/* ---------------- Wali Santri ---------------- */

export async function listAnakWali(waliUserId: string) {
  return db
    .select({
      santriId: santriProfile.id,
      nama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
    })
    .from(waliSantriProfile)
    .innerJoin(waliSantriAnak, eq(waliSantriAnak.waliSantriId, waliSantriProfile.id))
    .innerJoin(santriProfile, eq(waliSantriAnak.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .where(eq(waliSantriProfile.userId, waliUserId))
    .orderBy(user.name);
}

export async function listTagihanAnak(santriIds: string[]) {
  if (santriIds.length === 0) return [];
  return db
    .select({
      id: tagihanSpp.id,
      nomorTagihan: tagihanSpp.nomorTagihan,
      santriId: tagihanSpp.santriId,
      santriNama: user.name,
      periodeBulan: tagihanSpp.periodeBulan,
      periodeTahun: tagihanSpp.periodeTahun,
      totalTagihan: tagihanSpp.totalTagihan,
      jatuhTempo: tagihanSpp.jatuhTempo,
      status: tagihanSpp.status,
    })
    .from(tagihanSpp)
    .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .where(inArray(tagihanSpp.santriId, santriIds))
    .orderBy(desc(tagihanSpp.periodeTahun), desc(tagihanSpp.periodeBulan));
}

export async function listPengumumanUntukSantriWali(kelasId: string | null) {
  const conditions = [sql`${pengumuman.targetRole} in ('semua', 'santri', 'wali_santri')`];
  if (kelasId) {
    conditions.push(
      sql`(${pengumuman.targetKelasId} is null or ${pengumuman.targetKelasId} = ${kelasId})`,
    );
  }
  return db
    .select({
      id: pengumuman.id,
      judul: pengumuman.judul,
      isi: pengumuman.isi,
      targetRole: pengumuman.targetRole,
      dibuatOlehNama: user.name,
      createdAt: pengumuman.createdAt,
    })
    .from(pengumuman)
    .leftJoin(user, eq(pengumuman.dibuatOleh, user.id))
    .where(and(...conditions))
    .orderBy(desc(pengumuman.createdAt))
    .limit(30);
}
