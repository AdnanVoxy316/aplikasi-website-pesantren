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

/**
 * Asal tagihan: "spp" dibuat massal oleh generator SPP bulanan,
 * "manual" disusun admin dari satu atau beberapa jenis pembayaran lain.
 */
export const TAGIHAN_SUMBER = ["spp", "manual"] as const;
export type TagihanSumber = (typeof TAGIHAN_SUMBER)[number];

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

/**
 * Jenis pembayaran pesantren. SPP bulanan, daftar ulang, perlengkapan,
 * kegiatan, denda, dsb. Fondasi untuk tagihan multi-item.
 */
export const JENIS_PEMBAYARAN_KATEGORI = ["bulanan", "sekali", "insidental"] as const;
export type JenisPembayaranKategori = (typeof JENIS_PEMBAYARAN_KATEGORI)[number];

export const jenisPembayaran = sqliteTable(
  "jenis_pembayaran",
  {
    id: id(),
    kode: text("kode").notNull().unique(),
    nama: text("nama").notNull(),
    kategori: text("kategori", { enum: JENIS_PEMBAYARAN_KATEGORI })
      .notNull()
      .default("sekali"),
    keterangan: text("keterangan"),
    /** Tarif bawaan per jenis (0 = belum diatur). Dipakai saat menyusun tagihan manual. */
    tarif: integer("tarif").notNull().default(0),
    urutan: integer("urutan").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("jenis_pembayaran_isActive_idx").on(table.isActive)],
);

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

/**
 * Tarif khusus per santri — dipakai untuk santri yang membayar SPP tidak
 * sesuai nominal tarif kelas (sesuai kemampuan). Satu santri maksimal satu
 * tarif khusus aktif. Nominalnya final (tanpa diskon terpisah) dan tidak
 * berubah walau tarif kelas naik.
 */
export const tarifSppSantri = sqliteTable(
  "tarif_spp_santri",
  {
    id: id(),
    santriId: text("santri_id")
      .notNull()
      .references(() => santriProfile.id, { onDelete: "cascade" }),
    nominal: integer("nominal").notNull(),
    catatan: text("catatan"),
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
    uniqueIndex("tarif_spp_santri_uidx").on(table.santriId),
    index("tarif_spp_santri_isActive_idx").on(table.isActive),
    check("tarif_spp_santri_nominal_check", sql`${table.nominal} > 0`),
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
    sumber: text("sumber", { enum: TAGIHAN_SUMBER }).notNull().default("manual"),
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
    // Idempotensi generator SPP bulanan — hanya berlaku untuk tagihan sumber "spp",
    // agar tagihan manual (daftar ulang, perlengkapan, dll.) tetap bebas dibuat
    // berkali-kali pada periode yang sama.
    uniqueIndex("tagihan_spp_spp_periode_uidx")
      .on(table.santriId, table.periodeBulan, table.periodeTahun)
      .where(sql`${table.sumber} = 'spp'`),
    index("tagihan_spp_santriId_idx").on(table.santriId),
    index("tagihan_spp_status_idx").on(table.status),
    index("tagihan_spp_sumber_idx").on(table.sumber),
    check(
      "tagihan_spp_periodeBulan_check",
      sql`${table.periodeBulan} >= 1 and ${table.periodeBulan} <= 12`,
    ),
  ],
);

/**
 * Rincian item tagihan. Tagihan SPP massal berisi satu item "SPP Bulanan";
 * tagihan manual dapat berisi beberapa jenis (daftar ulang, perlengkapan,
 * kegiatan, denda) dan dibayar sekali melalui total tagihan.
 */
export const tagihanItem = sqliteTable(
  "tagihan_item",
  {
    id: id(),
    tagihanSppId: text("tagihan_spp_id")
      .notNull()
      .references(() => tagihanSpp.id, { onDelete: "cascade" }),
    jenisPembayaranId: text("jenis_pembayaran_id")
      .notNull()
      .references(() => jenisPembayaran.id, { onDelete: "restrict" }),
    /** Snapshot nama jenis saat item dibuat — aman walau jenis diubah admin. */
    nama: text("nama").notNull(),
    nominal: integer("nominal").notNull(),
    keterangan: text("keterangan"),
    urutan: integer("urutan").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("tagihan_item_tagihanId_idx").on(table.tagihanSppId),
    index("tagihan_item_jenisId_idx").on(table.jenisPembayaranId),
    check("tagihan_item_nominal_check", sql`${table.nominal} > 0`),
  ],
);

export const pembayaranSpp = sqliteTable(
  "pembayaran_spp",
  {
    id: id(),
    tagihanSppId: text("tagihan_spp_id")
      .notNull()
      .references(() => tagihanSpp.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("midtrans"),
    providerOrderId: text("provider_order_id"),
    providerTransactionId: text("provider_transaction_id"),
    providerInvoiceId: text("provider_invoice_id"),
    /** Token Snap saat transaksi dibuat (untuk buka QR/detail Snap). Beda dari providerTransactionId. */
    snapToken: text("snap_token"),
    checkoutUrl: text("checkout_url"),
    paymentMethod: text("payment_method"),
    catatan: text("catatan"),
    dicatatOleh: text("dicatat_oleh").references(() => user.id, {
      onDelete: "set null",
    }),
    nominalDibayar: integer("nominal_dibayar"),
    biayaAdmin: integer("biaya_admin"),
    totalDibayar: integer("total_dibayar"),
    status: text("status", { enum: PEMBAYARAN_STATUS })
      .notNull()
      .default("pending"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    buktiTerkirimAt: integer("bukti_terkirim_at", { mode: "timestamp_ms" }),
    providerPayload: text("provider_payload", { mode: "json" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("pembayaran_spp_tagihanId_idx").on(table.tagihanSppId),
    index("pembayaran_spp_status_idx").on(table.status),
    index("pembayaran_spp_orderId_idx").on(table.providerOrderId),
  ],
);

export const paymentWebhookEvents = sqliteTable(
  "payment_webhook_events",
  {
    id: id(),
    provider: text("provider").notNull().default("midtrans"),
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
  items: many(tagihanItem),
  pembayaran: many(pembayaranSpp),
}));

export const tagihanItemRelations = relations(tagihanItem, ({ one }) => ({
  tagihan: one(tagihanSpp, {
    fields: [tagihanItem.tagihanSppId],
    references: [tagihanSpp.id],
  }),
  jenis: one(jenisPembayaran, {
    fields: [tagihanItem.jenisPembayaranId],
    references: [jenisPembayaran.id],
  }),
}));

export const pembayaranSppRelations = relations(pembayaranSpp, ({ one }) => ({
  tagihan: one(tagihanSpp, {
    fields: [pembayaranSpp.tagihanSppId],
    references: [tagihanSpp.id],
  }),
}));

export type TarifSpp = typeof tarifSpp.$inferSelect;
export type TarifSppSantri = typeof tarifSppSantri.$inferSelect;
export type JenisPembayaran = typeof jenisPembayaran.$inferSelect;
export type TagihanSpp = typeof tagihanSpp.$inferSelect;
export type TagihanItem = typeof tagihanItem.$inferSelect;
export type PembayaranSpp = typeof pembayaranSpp.$inferSelect;
