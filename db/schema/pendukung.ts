import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { kelas } from "./akademik";
import { user } from "./auth";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const TARGET_ROLES = [
  "semua",
  "admin",
  "guru",
  "santri",
  "wali_santri",
] as const;
export type TargetRole = (typeof TARGET_ROLES)[number];

export const pengumuman = sqliteTable(
  "pengumuman",
  {
    id: id(),
    judul: text("judul").notNull(),
    isi: text("isi").notNull(),
    targetRole: text("target_role", { enum: TARGET_ROLES })
      .notNull()
      .default("semua"),
    targetKelasId: text("target_kelas_id").references(() => kelas.id, {
      onDelete: "set null",
    }),
    dibuatOleh: text("dibuat_oleh").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("pengumuman_targetRole_idx").on(table.targetRole),
    index("pengumuman_targetKelasId_idx").on(table.targetKelasId),
  ],
);

export const activityLog = sqliteTable(
  "activity_log",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    aksi: text("aksi").notNull(),
    entitas: text("entitas").notNull(),
    entitasId: text("entitas_id"),
    detail: text("detail", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("activity_log_userId_idx").on(table.userId),
    index("activity_log_createdAt_idx").on(table.createdAt),
  ],
);

export const notifikasi = sqliteTable(
  "notifikasi",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entitas: text("entitas"),
    entitasId: text("entitas_id"),
    isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("notifikasi_userId_idx").on(table.userId),
    index("notifikasi_isRead_idx").on(table.isRead),
  ],
);

export const pengumumanRelations = relations(pengumuman, ({ one }) => ({
  pembuat: one(user, {
    fields: [pengumuman.dibuatOleh],
    references: [user.id],
  }),
  kelas: one(kelas, {
    fields: [pengumuman.targetKelasId],
    references: [kelas.id],
  }),
}));

export type Pengumuman = typeof pengumuman.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type Notifikasi = typeof notifikasi.$inferSelect;
