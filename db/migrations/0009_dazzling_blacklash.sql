CREATE TABLE `tagihan_item` (
	`id` text PRIMARY KEY NOT NULL,
	`tagihan_spp_id` text NOT NULL,
	`jenis_pembayaran_id` text NOT NULL,
	`nama` text NOT NULL,
	`nominal` integer NOT NULL,
	`keterangan` text,
	`urutan` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tagihan_spp_id`) REFERENCES `tagihan_spp`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`jenis_pembayaran_id`) REFERENCES `jenis_pembayaran`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "tagihan_item_nominal_check" CHECK("tagihan_item"."nominal" > 0)
);
--> statement-breakpoint
CREATE INDEX `tagihan_item_tagihanId_idx` ON `tagihan_item` (`tagihan_spp_id`);--> statement-breakpoint
CREATE INDEX `tagihan_item_jenisId_idx` ON `tagihan_item` (`jenis_pembayaran_id`);--> statement-breakpoint
DROP INDEX `tagihan_spp_uidx`;--> statement-breakpoint
ALTER TABLE `tagihan_spp` ADD `sumber` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `tagihan_spp_spp_periode_uidx` ON `tagihan_spp` (`santri_id`,`periode_bulan`,`periode_tahun`) WHERE "tagihan_spp"."sumber" = 'spp';--> statement-breakpoint
CREATE INDEX `tagihan_spp_sumber_idx` ON `tagihan_spp` (`sumber`);--> statement-breakpoint
ALTER TABLE `jenis_pembayaran` ADD `tarif` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `tagihan_spp` SET `sumber` = 'spp';--> statement-breakpoint
INSERT INTO `tagihan_item` (`id`,`tagihan_spp_id`,`jenis_pembayaran_id`,`nama`,`nominal`,`urutan`,`created_at`,`updated_at`)
SELECT 'ti-' || `id`, `id`, 'jp-spp-bulanan', 'SPP Bulanan', `nominal`, 1, `created_at`, `updated_at`
FROM `tagihan_spp` WHERE `nominal` > 0;