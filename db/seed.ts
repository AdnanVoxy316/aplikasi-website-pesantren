import { eq, inArray } from "drizzle-orm";
import { db, connection } from "@/db";
import {
  guruProfile,
  jenisNilai,
  kehadiran,
  kelas,
  mapel,
  nilai,
  pengajaran,
  pengumuman,
  pesantrenSettings,
  santriProfile,
  tagihanSpp,
  tugas,
  tugasSubmission,
  tarifSpp,
  tahunAjaran,
  user,
  waliSantriAnak,
  waliSantriProfile,
} from "@/db/schema";
import { auth } from "@/lib/auth/server";

type SeedAccount = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "guru" | "santri" | "wali_santri";
  nis?: string;
  nip?: string;
  noTelp?: string;
};

const accounts: SeedAccount[] = [
  {
    name: "Ahmad Fauzi",
    email: "admin@pesantren.sch.id",
    password: "admin1234",
    role: "admin",
  },
  {
    name: "Nisa Karimah",
    email: "guru@pesantren.sch.id",
    password: "guru1234",
    role: "guru",
    nip: "1987001",
    noTelp: "081200000001",
  },
  {
    name: "Yusuf Hakim",
    email: "guru2@pesantren.sch.id",
    password: "guru1234",
    role: "guru",
    nip: "1987002",
    noTelp: "081200000002",
  },
  { name: "Aisyah Fitria", email: "santri@pesantren.sch.id", password: "santri1234", role: "santri", nis: "2026-0001" },
  { name: "Muhammad Rizky", email: "santri2@pesantren.sch.id", password: "santri1234", role: "santri", nis: "2026-0002" },
  { name: "Fatimah Zahra", email: "santri3@pesantren.sch.id", password: "santri1234", role: "santri", nis: "2026-0003" },
  { name: "Ali Abdurrahman", email: "santri4@pesantren.sch.id", password: "santri1234", role: "santri", nis: "2026-0004" },
  { name: "Khadijah Salsabila", email: "santri5@pesantren.sch.id", password: "santri1234", role: "santri", nis: "2026-0005" },
  { name: "Umar Faruq", email: "santri6@pesantren.sch.id", password: "santri1234", role: "santri", nis: "2026-0006" },
  { name: "Rizal Hidayat", email: "wali@pesantren.sch.id", password: "wali1234", role: "wali_santri", noTelp: "081300000001" },
];

async function createUser(account: SeedAccount): Promise<string> {
  await auth.api.signUpEmail({
    body: {
      email: account.email,
      password: account.password,
      name: account.name,
    },
  });
  const [created] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, account.email))
    .limit(1);
  if (!created) throw new Error(`Gagal membuat user ${account.email}`);
  await db.update(user).set({ role: account.role }).where(eq(user.id, created.id));

  if (account.role === "guru") {
    await db.insert(guruProfile).values({
      userId: created.id,
      nip: account.nip ?? null,
      noTelp: account.noTelp ?? null,
    });
  } else if (account.role === "santri") {
    await db.insert(santriProfile).values({
      userId: created.id,
      nis: account.nis!,
    });
  } else if (account.role === "wali_santri") {
    await db.insert(waliSantriProfile).values({
      userId: created.id,
      noTelp: account.noTelp ?? null,
    });
  }
  return created.id;
}

async function main() {
  console.log("Menyiapkan database development...");

  const [existingAdmin] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, accounts[0].email))
    .limit(1);
  if (existingAdmin) {
    console.log("Seed sudah pernah dijalankan (admin sudah ada). Lewati.");
    return;
  }

  const userIds = new Map<string, string>();
  for (const account of accounts) {
    const id = await createUser(account);
    userIds.set(account.email, id);
    console.log(`  akun dibuat: ${account.email} (${account.role})`);
  }

  const [ta] = await db
    .insert(tahunAjaran)
    .values({
      label: "2026/2027",
      tanggalMulai: "2026-07-01",
      tanggalSelesai: "2027-06-30",
      isActive: true,
    })
    .returning({ id: tahunAjaran.id });

  await db.insert(pesantrenSettings).values({
    id: "default",
    namaPesantren: "Pesantren Cendekia Nusantara",
    alamat: "Jl. Kebon Jeruk No. 10, Bogor",
    deskripsi: "Pesantren modern yang memadukan ilmu agama dan umum.",
    tahunAjaranAktifId: ta.id,
    semesterAktif: "ganjil",
  });

  const guruRows = await db.select().from(guruProfile);
  const guru1 = guruRows.find((g) => g.userId === userIds.get("guru@pesantren.sch.id"))!;
  const guru2 = guruRows.find((g) => g.userId === userIds.get("guru2@pesantren.sch.id"))!;

  const kelasRows = await db
    .insert(kelas)
    .values([
      { nama: "Ibtida A", tingkat: "Ibtida", waliKelasId: guru1.id, tahunAjaranId: ta.id },
      { nama: "Ibtida B", tingkat: "Ibtida", waliKelasId: guru2.id, tahunAjaranId: ta.id },
    ])
    .returning({ id: kelas.id, nama: kelas.nama });

  const ibtidaA = kelasRows.find((k) => k.nama === "Ibtida A")!.id;
  const ibtidaB = kelasRows.find((k) => k.nama === "Ibtida B")!.id;

  const mapelRows = await db
    .insert(mapel)
    .values([
      { nama: "Tahfidz Qur'an", kategori: "pesantren", deskripsi: "Setoran hafalan juz" },
      { nama: "Kitab Kuning", kategori: "pesantren", deskripsi: "Ngaji kitab Ta'lim Muta'allim" },
      { nama: "Akhlak", kategori: "pesantren" },
      { nama: "Matematika", kategori: "umum" },
      { nama: "Bahasa Indonesia", kategori: "umum" },
    ])
    .returning({ id: mapel.id, nama: mapel.nama });

  const jenisNilaiRows = await db
    .insert(jenisNilai)
    .values([
      { nama: "Tugas", bobot: 0.3 },
      { nama: "UTS", bobot: 0.3 },
      { nama: "UAS", bobot: 0.4 },
      { nama: "Hafalan", bobot: 0.6 },
      { nama: "Praktik", bobot: 0.4 },
    ])
    .returning({ id: jenisNilai.id, nama: jenisNilai.nama });

  const jn = (nama: string) => jenisNilaiRows.find((j) => j.nama === nama)!.id;
  const mp = (nama: string) => mapelRows.find((m) => m.nama === nama)!.id;

  const pengajaranValues: { guruId: string; kelasId: string; mapelId: string; tahunAjaranId: string }[] = [];
  for (const k of [ibtidaA, ibtidaB]) {
    pengajaranValues.push(
      { guruId: guru1.id, kelasId: k, mapelId: mp("Tahfidz Qur'an"), tahunAjaranId: ta.id },
      { guruId: guru1.id, kelasId: k, mapelId: mp("Matematika"), tahunAjaranId: ta.id },
      { guruId: guru2.id, kelasId: k, mapelId: mp("Kitab Kuning"), tahunAjaranId: ta.id },
      { guruId: guru2.id, kelasId: k, mapelId: mp("Bahasa Indonesia"), tahunAjaranId: ta.id },
    );
  }
  await db.insert(pengajaran).values(pengajaranValues);

  const santriRows = await db.select().from(santriProfile);
  const ibtidaASantri = santriRows.slice(0, 3);
  const ibtidaBSantri = santriRows.slice(3, 6);
  await db
    .update(santriProfile)
    .set({ kelasId: ibtidaA })
    .where(inArray(santriProfile.id, ibtidaASantri.map((s) => s.id)));
  await db
    .update(santriProfile)
    .set({ kelasId: ibtidaB })
    .where(inArray(santriProfile.id, ibtidaBSantri.map((s) => s.id)));

  const [wali] = await db.select().from(waliSantriProfile);
  if (wali) {
    await db.insert(waliSantriAnak).values(
      ibtidaASantri.slice(0, 2).map((santri) => ({
        waliSantriId: wali.id,
        santriId: santri.id,
      })),
    );
  }

  const nilaiValues: (typeof nilai.$inferInsert)[] = [];
  for (const santri of [...ibtidaASantri, ...ibtidaBSantri]) {
    for (const [mapelNama, guru] of [
      ["Tahfidz Qur'an", guru1],
      ["Matematika", guru1],
      ["Kitab Kuning", guru2],
    ] as const) {
      const jenisList: [string, number][] = mapelNama === "Tahfidz Qur'an"
        ? [["Hafalan", 82 + Math.floor(Math.random() * 15)], ["Praktik", 80 + Math.floor(Math.random() * 15)]]
        : [["Tugas", 75 + Math.floor(Math.random() * 20)], ["UTS", 70 + Math.floor(Math.random() * 25)]];
      for (const [jenis, angka] of jenisList) {
        nilaiValues.push({
          santriId: santri.id,
          mapelId: mp(mapelNama),
          kelasId: ibtidaASantri.includes(santri) ? ibtidaA : ibtidaB,
          jenisNilaiId: jn(jenis),
          guruId: guru.id,
          nilai: angka,
          tahunAjaranId: ta.id,
          semester: "ganjil",
        });
      }
    }
  }
  await db.insert(nilai).values(nilaiValues);

  const kehadiranValues: (typeof kehadiran.$inferInsert)[] = [];
  const statuses = ["hadir", "hadir", "hadir", "izin", "hadir", "sakit", "alpa"] as const;
  let dayOffset = 0;
  for (const santri of [...ibtidaASantri, ...ibtidaBSantri]) {
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset - i);
      const iso = date.toISOString().slice(0, 10);
      kehadiranValues.push({
        santriId: santri.id,
        kelasId: ibtidaASantri.includes(santri) ? ibtidaA : ibtidaB,
        tanggal: iso,
        status: statuses[(i + dayOffset) % statuses.length],
        dicatatOleh: guru1.id,
        tahunAjaranId: ta.id,
      });
    }
    dayOffset = (dayOffset + 1) % statuses.length;
  }
  await db.insert(kehadiran).values(kehadiranValues);

  const [tugas1] = await db
    .insert(tugas)
    .values({
      judul: "Setoran hafalan Juz Amma",
      deskripsi: "Rekam video setoran surah An-Naba sampai An-Nazi'at, kumpulkan sebelum deadline.",
      mapelId: mp("Tahfidz Qur'an"),
      kelasId: ibtidaA,
      guruId: guru1.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tahunAjaranId: ta.id,
    })
    .returning({ id: tugas.id });

  const [tugas2] = await db
    .insert(tugas)
    .values({
      judul: "Ringkasan Kitab Ta'lim Muta'allim",
      deskripsi: "Tulis ringkasan bab 1-3 minimal 2 halaman, format PDF atau DOCX.",
      mapelId: mp("Kitab Kuning"),
      kelasId: ibtidaB,
      guruId: guru2.id,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      tahunAjaranId: ta.id,
    })
    .returning({ id: tugas.id });
  void tugas2;

  await db.insert(tugasSubmission).values([
    {
      tugasId: tugas1.id,
      santriId: ibtidaASantri[0].id,
      tipe: "link_youtube",
      url: "https://youtu.be/demo-setoran",
      status: "dinilai",
      nilai: 90,
      feedbackGuru: "Setoran lancar, makhraj bagus.",
      updatedBy: userIds.get("guru@pesantren.sch.id")!,
    },
    {
      tugasId: tugas1.id,
      santriId: ibtidaASantri[1].id,
      tipe: "link_gdrive",
      url: "https://drive.google.com/demo-file",
      status: "dikumpulkan",
    },
  ]);

  const [tarif] = await db
    .insert(tarifSpp)
    .values({
      nama: "SPP Reguler 2026/2027",
      nominal: 300000,
      berlakuMulai: "2026-07-01",
      createdBy: userIds.get("admin@pesantren.sch.id")!,
    })
    .returning({ id: tarifSpp.id });

  const bulanIni = new Date();
  const tagihanValues: (typeof tagihanSpp.$inferInsert)[] = [
    ...ibtidaASantri,
    ...ibtidaBSantri,
  ].map((santri, index) => ({
    nomorTagihan: `SPP-2026${String(bulanIni.getMonth() + 1).padStart(2, "0")}-${String(index + 1).padStart(4, "0")}`,
    santriId: santri.id,
    tarifSppId: tarif.id,
    tahunAjaranId: ta.id,
    periodeBulan: bulanIni.getMonth() + 1,
    periodeTahun: bulanIni.getFullYear(),
    nominal: 300000,
    totalTagihan: 300000,
    jatuhTempo: new Date(new Date().setDate(20)),
    status: index === 0 ? ("paid" as const) : ("unpaid" as const),
    createdBy: userIds.get("admin@pesantren.sch.id")!,
  }));
  await db.insert(tagihanSpp).values(tagihanValues);

  await db.insert(pengumuman).values([
    {
      judul: "Jadwal ujian tengah semester",
      isi: "Ujian tengah semester dimulai minggu depan. Persiapkan hafalan dan kitab.",
      targetRole: "semua",
      dibuatOleh: userIds.get("admin@pesantren.sch.id")!,
    },
    {
      judul: "Pembayaran SPP bulan ini",
      isi: "Tagihan SPP dapat dibayarkan melalui menu Pembayaran SPP.",
      targetRole: "santri",
      dibuatOleh: userIds.get("admin@pesantren.sch.id")!,
    },
  ]);

  console.log("Seed selesai.");
  console.log("Kredensial demo:");
  for (const account of accounts) {
    console.log(`  ${account.role.padEnd(12)} ${account.email} / ${account.password}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    connection.close();
  });
