import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { kelas, santriProfile, tahunAjaran } from "./akademik";
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

export const TAGIHAN_STATUS = [
  "draft",
  "pending",
  "unpaid",
  "processing",
  "paid",
  "expired",
  "cancelled",
  "failed",
] as const;
export type TagihanStatus = (typeof TAGIHAN_STATUS)[number];

export const PEMBAYARAN_STATUS = [
  "pending",
  "processing",
  "paid",
  "expired",
  "failed",
  "cancelled",
  "refunded",
] as const;
export type PembayaranStatus = (typeof PEMBAYARAN_STATUS)[number];

export const WEBHOOK_PROCESSING_STATUS = [
  "received",
  "processed",
  "failed",
  "ignored",
] as const;
export type WebhookProcessingStatus = (typeof WEBHOOK_PROCESSING_STATUS)[number];

export const tarifSpp = sqliteTable(
  "tarif_spp",
  {
    id: id(),
    nama: text("nama").notNull(),
    nominal: integer("nominal").notNull(),
    kelasId: text("kelas_id").references(() => kelas.id, {
      onDelete: "set null",
    }),
    tahunAjaranId: text("tahun_ajaran_id").references(() => tahunAjaran.id, {
      onDelete: "set null",
    }),
    berlakuMulai: text("berlaku_mulai").notNull(),
    berlakuSampai: text("berlaku_sampai"),
    isActive: integer("is_active", { mode: "boolean" })
      .default(true)
      .notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("tarif_spp_isActive_idx").on(table.isActive),
    check("tarif_spp_nominal_check", sql`${table.nominal} > 0`),
  ],
);

export const tagihanSpp = sqliteTable(
  "tagihan_spp",
  {
    id: id(),
    nomorTagihan: text("nomor_tagihan").notNull().unique(),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    tarifSppId: text("tarif_spp_id").references(() => tarifSpp.id, {
      onDelete: "set null",
    }),
    tahunAjaranId: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "restrict" }),
    periodeBulan: integer("periode_bulan").notNull(),
    periodeTahun: integer("periode_tahun").notNull(),
    nominal: integer("nominal").notNull(),
    nominalDiskon: integer("nominal_diskon").notNull().default(0),
    nominalDenda: integer("nominal_denda").notNull().default(0),
    totalTagihan: integer("total_tagihan").notNull(),
    jatuhTempo: integer("jatuh_tempo", { mode: "timestamp_ms" }),
    status: text("status", { enum: TAGIHAN_STATUS })
      .notNull()
      .default("unpaid"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("tagihan_spp_uidx").on(
      table.santriId,
      table.periodeBulan,
      table.periodeTahun,
    ),
    index("tagihan_spp_santriId_idx").on(table.santriId),
    index("tagihan_spp_status_idx").on(table.status),
    check(
      "tagihan_spp_periodeBulan_check",
      sql`${table.periodeBulan} >= 1 and ${table.periodeBulan} <= 12`,
    ),
  ],
);

export const pembayaranSpp = sqliteTable(
  "pembayaran_spp",
  {
    id: id(),
    tagihanSppId: text("tagihan_spp_id")
      .notNull()
      .references(() => tagihanSpp.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("mayar"),
    providerTransactionId: text("provider_transaction_id"),
    providerInvoiceId: text("provider_invoice_id"),
    checkoutUrl: text("checkout_url"),
    paymentMethod: text("payment_method"),
    nominalDibayar: integer("nominal_dibayar"),
    biayaAdmin: integer("biaya_admin"),
    totalDibayar: integer("total_dibayar"),
    status: text("status", { enum: PEMBAYARAN_STATUS })
      .notNull()
      .default("pending"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    providerPayload: text("provider_payload", { mode: "json" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("pembayaran_spp_tagihanId_idx").on(table.tagihanSppId),
    index("pembayaran_spp_status_idx").on(table.status),
  ],
);

export const paymentWebhookEvents = sqliteTable(
  "payment_webhook_events",
  {
    id: id(),
    provider: text("provider").notNull().default("mayar"),
    providerEventId: text("provider_event_id"),
    providerTransactionId: text("provider_transaction_id"),
    eventType: text("event_type"),
    payload: text("payload", { mode: "json" }).notNull(),
    processingStatus: text("processing_status", {
      enum: WEBHOOK_PROCESSING_STATUS,
    })
      .notNull()
      .default("received"),
    receivedAt: integer("received_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("payment_webhook_events_eventId_idx").on(table.providerEventId),
    index("payment_webhook_events_transactionId_idx").on(
      table.providerTransactionId,
    ),
  ],
);

export const tagihanSppRelations = relations(tagihanSpp, ({ one, many }) => ({
  santri: one(santriProfile, {
    fields: [tagihanSpp.santriId],
    references: [santriProfile.id],
  }),
  tarif: one(tarifSpp, {
    fields: [tagihanSpp.tarifSppId],
    references: [tarifSpp.id],
  }),
  pembayaran: many(pembayaranSpp),
}));

export const pembayaranSppRelations = relations(pembayaranSpp, ({ one }) => ({
  tagihan: one(tagihanSpp, {
    fields: [pembayaranSpp.tagihanSppId],
    references: [tagihanSpp.id],
  }),
}));

export type TarifSpp = typeof tarifSpp.$inferSelect;
export type TagihanSpp = typeof tagihanSpp.$inferSelect;
export type PembayaranSpp = typeof pembayaranSpp.$inferSelect;
