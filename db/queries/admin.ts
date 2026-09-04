import "server-only";
import { and, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLog,
  guruProfile,
  jenisNilai,
  kelas,
  mapel,
  nilai,
  pengajaran,
  pengumuman,
  pesantrenSettings,
  rapor,
  santriProfile,
  tagihanSpp,
  tugas,
  user,
  waliSantriAnak,
  waliSantriProfile,
  tahunAjaran,
  pembayaranSpp,
} from "@/db/schema";

export async function getPesantrenSettings() {
  const [row] = await db
    .select({
      settings: pesantrenSettings,
      tahunAjaranLabel: tahunAjaran.label,
    })
    .from(pesantrenSettings)
    .leftJoin(tahunAjaran, eq(pesantrenSettings.tahunAjaranAktifId, tahunAjaran.id))
    .where(eq(pesantrenSettings.id, "default"))
    .limit(1);
  return row ?? null;
}

export async function getTahunAjaranAktif() {
  const [row] = await db
    .select()
    .from(tahunAjaran)
    .where(eq(tahunAjaran.isActive, true))
    .limit(1);
  return row ?? null;
}

export async function listTahunAjaran() {
  return db.select().from(tahunAjaran).orderBy(desc(tahunAjaran.isActive), tahunAjaran.label);
}

export async function listJenisNilai() {
  return db.select().from(jenisNilai).orderBy(jenisNilai.nama);
}

export async function getAdminStats() {
  const [santri] = await db.select({ c: count() }).from(santriProfile);
  const [guru] = await db
    .select({ c: count() })
    .from(user)
    .where(eq(user.role, "guru"));
  const [kelasC] = await db.select({ c: count() }).from(kelas);
  const [tugasAktif] = await db
    .select({ c: count() })
    .from(tugas)
    .where(sql`${tugas.deadline} > unixepoch('subsecond') * 1000`);
  const [tagihanBelum] = await db
    .select({ c: count(), total: sql<number>`coalesce(sum(${tagihanSpp.totalTagihan}), 0)` })
    .from(tagihanSpp)
    .where(inArray(tagihanSpp.status, ["unpaid", "pending", "processing"]));
  const [tagihanLunas] = await db
    .select({ c: count(), total: sql<number>`coalesce(sum(${tagihanSpp.totalTagihan}), 0)` })
    .from(tagihanSpp)
    .where(eq(tagihanSpp.status, "paid"));

  return {
    totalSantri: santri.c,
    totalGuru: guru.c,
    totalKelas: kelasC.c,
    tugasAktif: tugasAktif.c,
    tagihanBelumBayar: { jumlah: tagihanBelum.c, total: tagihanBelum.total },
    tagihanLunas: { jumlah: tagihanLunas.c, total: tagihanLunas.total },
  };
}

export async function listAkunWithProfile() {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      createdAt: user.createdAt,
      nip: guruProfile.nip,
      noTelp: guruProfile.noTelp,
      nis: santriProfile.nis,
      kelasId: santriProfile.kelasId,
      kelasNama: kelas.nama,
    })
    .from(user)
    .leftJoin(guruProfile, eq(guruProfile.userId, user.id))
    .leftJoin(santriProfile, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .orderBy(user.role, user.name);
  return rows;
}

export async function listKelasDetail(tahunAjaranId?: string) {
  const rows = await db
    .select({
      id: kelas.id,
      nama: kelas.nama,
      tingkat: kelas.tingkat,
      tahunAjaranId: kelas.tahunAjaranId,
      tahunAjaranLabel: tahunAjaran.label,
      waliKelasId: kelas.waliKelasId,
      waliKelasNama: user.name,
      jumlahSantri: sql<number>`(select count(*) from ${santriProfile} where ${santriProfile.kelasId} = ${kelas.id})`,
    })
    .from(kelas)
    .innerJoin(tahunAjaran, eq(kelas.tahunAjaranId, tahunAjaran.id))
    .leftJoin(guruProfile, eq(kelas.waliKelasId, guruProfile.id))
    .leftJoin(user, eq(guruProfile.userId, user.id))
    .where(tahunAjaranId ? eq(kelas.tahunAjaranId, tahunAjaranId) : undefined)
    .orderBy(tahunAjaran.label, kelas.nama);
  return rows;
}

export async function listMapelDetail() {
  return db
    .select({
      id: mapel.id,
      nama: mapel.nama,
      kategori: mapel.kategori,
      deskripsi: mapel.deskripsi,
      jumlahPengajar: sql<number>`(select count(*) from ${pengajaran} where ${pengajaran.mapelId} = ${mapel.id})`,
    })
    .from(mapel)
    .orderBy(mapel.nama);
}

export async function listPengajaranDetail() {
  return db
    .select({
      id: pengajaran.id,
      guruId: pengajaran.guruId,
      guruNama: user.name,
      kelasId: kelas.id,
      kelasNama: kelas.nama,
      mapelId: mapel.id,
      mapelNama: mapel.nama,
      tahunAjaranId: tahunAjaran.id,
      tahunAjaranLabel: tahunAjaran.label,
    })
    .from(pengajaran)
    .innerJoin(guruProfile, eq(pengajaran.guruId, guruProfile.id))
    .innerJoin(user, eq(guruProfile.userId, user.id))
    .innerJoin(kelas, eq(pengajaran.kelasId, kelas.id))
    .innerJoin(mapel, eq(pengajaran.mapelId, mapel.id))
    .innerJoin(tahunAjaran, eq(pengajaran.tahunAjaranId, tahunAjaran.id))
    .orderBy(user.name, kelas.nama, mapel.nama);
}

export async function listWaliWithAnak() {
  const waliRows = await db
    .select({
      id: waliSantriProfile.id,
      userId: user.id,
      nama: user.name,
      email: user.email,
      noTelp: waliSantriProfile.noTelp,
    })
    .from(waliSantriProfile)
    .innerJoin(user, eq(waliSantriProfile.userId, user.id))
    .orderBy(user.name);

  const relasi = await db
    .select({
      id: waliSantriAnak.id,
      waliSantriId: waliSantriAnak.waliSantriId,
      santriId: santriProfile.id,
      santriNama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
    })
    .from(waliSantriAnak)
    .innerJoin(santriProfile, eq(waliSantriAnak.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id));

  return waliRows.map((wali) => ({
    ...wali,
    anak: relasi.filter((r) => r.waliSantriId === wali.id),
  }));
}

export async function listSantriWithKelas() {
  return db
    .select({
      id: santriProfile.id,
      userId: user.id,
      nama: user.name,
      nis: santriProfile.nis,
      kelasId: santriProfile.kelasId,
      kelasNama: kelas.nama,
    })
    .from(santriProfile)
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .orderBy(user.name);
}

export async function listGuruForSelect() {
  return db
    .select({
      id: guruProfile.id,
      nama: user.name,
      email: user.email,
    })
    .from(guruProfile)
    .innerJoin(user, eq(guruProfile.userId, user.id))
    .orderBy(user.name);
}

export async function listPengumuman(targetRole?: string, kelasId?: string | null) {
  const conditions: SQL<unknown>[] = [];
  if (targetRole) {
    conditions.push(sql`${pengumuman.targetRole} in ('semua', ${targetRole})`);
  }
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
      targetKelasNama: kelas.nama,
      dibuatOlehNama: user.name,
      createdAt: pengumuman.createdAt,
    })
    .from(pengumuman)
    .leftJoin(kelas, eq(pengumuman.targetKelasId, kelas.id))
    .leftJoin(user, eq(pengumuman.dibuatOleh, user.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(pengumuman.createdAt))
    .limit(50);
}

export async function listAllPengumumanAdmin() {
  return db
    .select({
      id: pengumuman.id,
      judul: pengumuman.judul,
      isi: pengumuman.isi,
      targetRole: pengumuman.targetRole,
      targetKelasNama: kelas.nama,
      dibuatOlehNama: user.name,
      createdAt: pengumuman.createdAt,
    })
    .from(pengumuman)
    .leftJoin(kelas, eq(pengumuman.targetKelasId, kelas.id))
    .leftJoin(user, eq(pengumuman.dibuatOleh, user.id))
    .orderBy(desc(pengumuman.createdAt))
    .limit(50);
}

export async function listActivityLog(limit = 100) {
  return db
    .select({
      id: activityLog.id,
      aksi: activityLog.aksi,
      entitas: activityLog.entitas,
      entitasId: activityLog.entitasId,
      detail: activityLog.detail,
      createdAt: activityLog.createdAt,
      userNama: user.name,
      userEmail: user.email,
    })
    .from(activityLog)
    .leftJoin(user, eq(activityLog.userId, user.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

export async function listRaporRekap() {
  return db
    .select({
      id: rapor.id,
      santriId: rapor.santriId,
      santriNama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
      semester: rapor.semester,
      tahunAjaranLabel: tahunAjaran.label,
      generatedAt: rapor.generatedAt,
      catatan: rapor.catatanWaliKelas,
    })
    .from(rapor)
    .innerJoin(santriProfile, eq(rapor.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .innerJoin(kelas, eq(rapor.kelasId, kelas.id))
    .innerJoin(tahunAjaran, eq(rapor.tahunAjaranId, tahunAjaran.id))
    .orderBy(desc(rapor.generatedAt))
    .limit(200);
}

export async function listNilaiCountByMapel() {
  return db
    .select({
      mapelNama: mapel.nama,
      kategori: mapel.kategori,
      jumlahNilai: count(nilai.id),
      rataRata: sql<number>`round(coalesce(avg(${nilai.nilai}), 0), 1)`,
    })
    .from(mapel)
    .leftJoin(nilai, eq(nilai.mapelId, mapel.id))
    .groupBy(mapel.id)
    .orderBy(mapel.nama);
}

export async function getPembayaranStats() {
  const rows = await db
    .select({
      status: tagihanSpp.status,
      c: count(),
      total: sql<number>`coalesce(sum(${tagihanSpp.totalTagihan}), 0)`,
    })
    .from(tagihanSpp)
    .groupBy(tagihanSpp.status);

  const byStatus = new Map(rows.map((r) => [r.status, r]));
  const paid = byStatus.get("paid");
  const unpaid = byStatus.get("unpaid");
  const pending = byStatus.get("pending");

  return {
    totalTagihan: rows.reduce((sum, r) => sum + r.c, 0),
    totalNominal: rows.reduce((sum, r) => sum + r.total, 0),
    lunas: { jumlah: paid?.c ?? 0, total: paid?.total ?? 0 },
    belumBayar: { jumlah: unpaid?.c ?? 0, total: unpaid?.total ?? 0 },
    pending: { jumlah: pending?.c ?? 0, total: pending?.total ?? 0 },
  };
}

export async function listTagihanDetail(status?: string) {
  return db
    .select({
      id: tagihanSpp.id,
      nomorTagihan: tagihanSpp.nomorTagihan,
      santriNama: user.name,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
      periodeBulan: tagihanSpp.periodeBulan,
      periodeTahun: tagihanSpp.periodeTahun,
      nominal: tagihanSpp.nominal,
      totalTagihan: tagihanSpp.totalTagihan,
      jatuhTempo: tagihanSpp.jatuhTempo,
      status: tagihanSpp.status,
      createdAt: tagihanSpp.createdAt,
    })
    .from(tagihanSpp)
    .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .where(status && status !== "semua" ? eq(tagihanSpp.status, status as never) : undefined)
    .orderBy(desc(tagihanSpp.createdAt))
    .limit(200);
}

export async function listPembayaranTransaksi() {
  return db
    .select({
      id: pembayaranSpp.id,
      tagihanNomor: tagihanSpp.nomorTagihan,
      santriNama: user.name,
      provider: pembayaranSpp.provider,
      providerInvoiceId: pembayaranSpp.providerInvoiceId,
      checkoutUrl: pembayaranSpp.checkoutUrl,
      paymentMethod: pembayaranSpp.paymentMethod,
      nominalDibayar: pembayaranSpp.nominalDibayar,
      status: pembayaranSpp.status,
      paidAt: pembayaranSpp.paidAt,
      createdAt: pembayaranSpp.createdAt,
    })
    .from(pembayaranSpp)
    .innerJoin(tagihanSpp, eq(pembayaranSpp.tagihanSppId, tagihanSpp.id))
    .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .orderBy(desc(pembayaranSpp.createdAt))
    .limit(200);
}

export async function getRekapKehadiranPerKelas() {
  const rows = await db.all<{
    kelas_nama: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    total: number;
  }>(sql`
    select k.nama as kelas_nama,
      sum(case when kh.status = 'hadir' then 1 else 0 end) as hadir,
      sum(case when kh.status = 'izin' then 1 else 0 end) as izin,
      sum(case when kh.status = 'sakit' then 1 else 0 end) as sakit,
      sum(case when kh.status = 'alpa' then 1 else 0 end) as alpa,
      count(*) as total
    from kelas k
    left join kehadiran kh on kh.kelas_id = k.id
    group by k.id, k.nama
    order by k.nama
  `);
  return rows;
}
