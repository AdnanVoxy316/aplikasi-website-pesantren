import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { kelas, mapel, guruProfile, santriProfile, tahunAjaran } from "./akademik";
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

export const SUBMISSION_TIPE = [
  "file",
  "link_gdrive",
  "link_youtube",
  "link_lainnya",
] as const;
export type SubmissionTipe = (typeof SUBMISSION_TIPE)[number];

export const SUBMISSION_STATUS = ["dikumpulkan", "terlambat", "dinilai"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[number];

export const tugas = sqliteTable(
  "tugas",
  {
    id: id(),
    judul: text("judul").notNull(),
    deskripsi: text("deskripsi").notNull(),
    mapelId: text("mapel_id")
      .notNull()
      .references(() => mapel.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    guruId: text("guru_id")
      .notNull()
      .references(() => guruProfile.id, { onDelete: "restrict" }),
    deadline: integer("deadline", { mode: "timestamp_ms" }).notNull(),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("tugas_kelasId_idx").on(table.kelasId),
    index("tugas_guruId_idx").on(table.guruId),
    index("tugas_deadline_idx").on(table.deadline),
  ],
);

export const tugasSubmission = sqliteTable(
  "tugas_submission",
  {
    id: id(),
    tugasId: text("tugas_id")
      .notNull()
      .references(() => tugas.id, { onDelete: "cascade" }),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    tipe: text("tipe", { enum: SUBMISSION_TIPE }).notNull(),
    filePath: text("file_path"),
    fileNamaAsli: text("file_nama_asli"),
    fileMimeType: text("file_mime_type"),
    fileSize: integer("file_size"),
    url: text("url"),
    status: text("status", { enum: SUBMISSION_STATUS })
      .notNull()
      .default("dikumpulkan"),
    nilai: real("nilai"),
    feedbackGuru: text("feedback_guru"),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: updatedAt(),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("tugas_submission_uidx").on(table.tugasId, table.santriId),
    index("tugas_submission_tugasId_idx").on(table.tugasId),
    index("tugas_submission_santriId_idx").on(table.santriId),
  ],
);

export const tugasRelations = relations(tugas, ({ one, many }) => ({
  kelas: one(kelas, { fields: [tugas.kelasId], references: [kelas.id] }),
  mapel: one(mapel, { fields: [tugas.mapelId], references: [mapel.id] }),
  guru: one(guruProfile, { fields: [tugas.guruId], references: [guruProfile.id] }),
  submissions: many(tugasSubmission),
}));

export const tugasSubmissionRelations = relations(tugasSubmission, ({ one }) => ({
  tugas: one(tugas, { fields: [tugasSubmission.tugasId], references: [tugas.id] }),
  santri: one(santriProfile, {
    fields: [tugasSubmission.santriId],
    references: [santriProfile.id],
  }),
}));

export type Tugas = typeof tugas.$inferSelect;
export type TugasSubmission = typeof tugasSubmission.$inferSelect;
