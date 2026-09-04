import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull();

export const SEMESTERS = ["ganjil", "genap"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const KEHADIRAN_STATUS = ["hadir", "izin", "sakit", "alpa"] as const;
export type KehadiranStatus = (typeof KEHADIRAN_STATUS)[number];

export const tahunAjaran = sqliteTable(
  "tahun_ajaran",
  {
    id: id(),
    label: text("label").notNull().unique(),
    tanggalMulai: text("tanggal_mulai").notNull(),
    tanggalSelesai: text("tanggal_selesai").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("tahun_ajaran_isActive_idx").on(table.isActive)],
);

export const guruProfile = sqliteTable("guru_profile", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  nip: text("nip"),
  noTelp: text("no_telp"),
  createdAt: createdAt(),
});

export const santriProfile = sqliteTable(
  "santri_profile",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    nis: text("nis").notNull().unique(),
    kelasId: text("kelas_id").references(() => kelas.id, {
      onDelete: "set null",
    }),
    tempatLahir: text("tempat_lahir"),
    tanggalLahir: text("tanggal_lahir"),
    alamat: text("alamat"),
    createdAt: createdAt(),
  },
  (table) => [index("santri_profile_kelasId_idx").on(table.kelasId)],
);

export const waliSantriProfile = sqliteTable("wali_santri_profile", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  noTelp: text("no_telp"),
  createdAt: createdAt(),
});

export const kelas = sqliteTable(
  "kelas",
  {
    id: id(),
    nama: text("nama").notNull(),
    tingkat: text("tingkat"),
    waliKelasId: text("wali_kelas_id").references(() => guruProfile.id, {
      onDelete: "set null",
    }),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("kelas_nama_tahun_ajaran_uidx").on(
      table.nama,
      table.tahunAjaranId,
    ),
    index("kelas_tahunAjaranId_idx").on(table.tahunAjaranId),
  ],
);

export const mapel = sqliteTable(
  "mapel",
  {
    id: id(),
    nama: text("nama").notNull().unique(),
    kategori: text("kategori").notNull().default("umum"),
    deskripsi: text("deskripsi"),
    createdAt: createdAt(),
  },
  (table) => [check("mapel_kategori_check", sql`${table.kategori} in ('umum', 'pesantren')`)],
);

export const waliSantriAnak = sqliteTable(
  "wali_santri_anak",
  {
    id: id(),
    waliSantriId: text("wali_santri_id")
      .notNull()
      .references(() => waliSantriProfile.id, { onDelete: "cascade" }),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("wali_santri_anak_uidx").on(table.waliSantriId, table.santriId),
    index("wali_santri_anak_santriId_idx").on(table.santriId),
  ],
);

export const pengajaran = sqliteTable(
  "pengajaran",
  {
    id: id(),
    guruId: text("guru_id")
      .notNull()
      .references(() => guruProfile.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    mapelId: text("mapel_id")
      .notNull()
      .references(() => mapel.id, { onDelete: "cascade" }),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("pengajaran_uidx").on(
      table.guruId,
      table.kelasId,
      table.mapelId,
      table.tahunAjaranId,
    ),
    index("pengajaran_guruId_idx").on(table.guruId),
    index("pengajaran_kelasId_idx").on(table.kelasId),
    index("pengajaran_mapelId_idx").on(table.mapelId),
  ],
);

export const jenisNilai = sqliteTable(
  "jenis_nilai",
  {
    id: id(),
    nama: text("nama").notNull().unique(),
    bobot: real("bobot").notNull().default(1),
    mapelId: text("mapel_id").references(() => mapel.id, {
      onDelete: "cascade",
    }),
    createdAt: createdAt(),
  },
  (table) => [check("jenis_nilai_bobot_check", sql`${table.bobot} >= 0`)],
);

export const nilai = sqliteTable(
  "nilai",
  {
    id: id(),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    mapelId: text("mapel_id")
      .notNull()
      .references(() => mapel.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    jenisNilaiId: text("jenis_nilai_id")
      .notNull()
      .references(() => jenisNilai.id, { onDelete: "restrict" }),
    guruId: text("guru_id")
      .notNull()
      .references(() => guruProfile.id, { onDelete: "restrict" }),
    nilai: real("nilai").notNull(),
    catatan: text("catatan"),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "restrict" }),
    semester: text("semester", { enum: SEMESTERS }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("nilai_uidx").on(
      table.santriId,
      table.mapelId,
      table.jenisNilaiId,
      table.tahunAjaranId,
      table.semester,
    ),
    index("nilai_santriId_idx").on(table.santriId),
    index("nilai_mapelId_idx").on(table.mapelId),
    index("nilai_tahunAjaranId_idx").on(table.tahunAjaranId),
    check("nilai_range_check", sql`${table.nilai} >= 0 and ${table.nilai} <= 100`),
  ],
);

export const kehadiran = sqliteTable(
  "kehadiran",
  {
    id: id(),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    mapelId: text("mapel_id").references(() => mapel.id, {
      onDelete: "cascade",
    }),
    tanggal: text("tanggal").notNull(),
    status: text("status", { enum: KEHADIRAN_STATUS }).notNull(),
    dicatatOleh: text("dicatat_oleh").references(() => guruProfile.id, {
      onDelete: "restrict",
    }),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("kehadiran_uidx").on(
      table.santriId,
      table.tanggal,
      table.mapelId,
    ),
    index("kehadiran_santriId_idx").on(table.santriId),
    index("kehadiran_tanggal_idx").on(table.tanggal),
    index("kehadiran_tahunAjaranId_idx").on(table.tahunAjaranId),
  ],
);

export const rapor = sqliteTable(
  "rapor",
  {
    id: id(),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "restrict" }),
    semester: text("semester", { enum: SEMESTERS }).notNull(),
    ringkasanNilai: text("ringkasan_nilai").notNull(),
    ringkasanKehadiran: text("ringkasan_kehadiran").notNull(),
    catatanWaliKelas: text("catatan_wali_kelas"),
    filePdfUrl: text("file_pdf_url"),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    generatedBy: text("generated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("rapor_uidx").on(
      table.santriId,
      table.tahunAjaranId,
      table.semester,
    ),
    index("rapor_santriId_idx").on(table.santriId),
    index("rapor_tahunAjaranId_idx").on(table.tahunAjaranId),
  ],
);

export const pesantrenSettings = sqliteTable("pesantren_settings", {
  id: text("id")
    .primaryKey()
    .default("default"),
  namaPesantren: text("nama_pesantren").notNull().default("ELMS Pesantren"),
  alamat: text("alamat"),
  logoUrl: text("logo_url"),
  deskripsi: text("deskripsi"),
  tahunAjaranAktifId: text("tahun_ajaran_aktif_id").references(
    () => tahunAjaran.id,
    { onDelete: "set null" },
  ),
  semesterAktif: text("semester_aktif", { enum: SEMESTERS })
    .notNull()
    .default("ganjil"),
  updatedAt: updatedAt(),
});

export const kelasRelations = relations(kelas, ({ one, many }) => ({
  waliKelas: one(guruProfile, {
    fields: [kelas.waliKelasId],
    references: [guruProfile.id],
  }),
  tahunAjaran: one(tahunAjaran, {
    fields: [kelas.tahunAjaranId],
    references: [tahunAjaran.id],
  }),
  santri: many(santriProfile),
}));

export const santriProfileRelations = relations(santriProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [santriProfile.userId],
    references: [user.id],
  }),
  kelas: one(kelas, {
    fields: [santriProfile.kelasId],
    references: [kelas.id],
  }),
  nilai: many(nilai),
  kehadiran: many(kehadiran),
}));

export const guruProfileRelations = relations(guruProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [guruProfile.userId],
    references: [user.id],
  }),
  pengajaran: many(pengajaran),
}));

export const pengajaranRelations = relations(pengajaran, ({ one }) => ({
  guru: one(guruProfile, {
    fields: [pengajaran.guruId],
    references: [guruProfile.id],
  }),
  kelas: one(kelas, {
    fields: [pengajaran.kelasId],
    references: [kelas.id],
  }),
  mapel: one(mapel, {
    fields: [pengajaran.mapelId],
    references: [mapel.id],
  }),
  tahunAjaran: one(tahunAjaran, {
    fields: [pengajaran.tahunAjaranId],
    references: [tahunAjaran.id],
  }),
}));

export type TahunAjaran = typeof tahunAjaran.$inferSelect;
export type Kelas = typeof kelas.$inferSelect;
export type Mapel = typeof mapel.$inferSelect;
export type GuruProfile = typeof guruProfile.$inferSelect;
export type SantriProfile = typeof santriProfile.$inferSelect;
export type WaliSantriProfile = typeof waliSantriProfile.$inferSelect;
export type Nilai = typeof nilai.$inferSelect;
export type Kehadiran = typeof kehadiran.$inferSelect;
export type Rapor = typeof rapor.$inferSelect;
export type PesantrenSettings = typeof pesantrenSettings.$inferSelect;
export type JenisNilai = typeof jenisNilai.$inferSelect;
export type Pengajaran = typeof pengajaran.$inferSelect;
