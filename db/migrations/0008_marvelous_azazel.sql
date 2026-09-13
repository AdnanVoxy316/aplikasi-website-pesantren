CREATE TABLE `jenis_pembayaran` (
	`id` text PRIMARY KEY NOT NULL,
	`kode` text NOT NULL,
	`nama` text NOT NULL,
	`kategori` text DEFAULT 'sekali' NOT NULL,
	`keterangan` text,
	`urutan` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jenis_pembayaran_kode_unique` ON `jenis_pembayaran` (`kode`);--> statement-breakpoint
CREATE INDEX `jenis_pembayaran_isActive_idx` ON `jenis_pembayaran` (`is_active`);--> statement-breakpoint
INSERT OR IGNORE INTO `jenis_pembayaran` (`id`,`kode`,`nama`,`kategori`,`urutan`,`is_active`) VALUES ('jp-spp-bulanan','spp_bulanan','SPP Bulanan','bulanan',1,1);--> statement-breakpoint
INSERT OR IGNORE INTO `jenis_pembayaran` (`id`,`kode`,`nama`,`kategori`,`urutan`,`is_active`) VALUES ('jp-daftar-ulang','daftar_ulang','Daftar Ulang / Registrasi','sekali',2,1);--> statement-breakpoint
INSERT OR IGNORE INTO `jenis_pembayaran` (`id`,`kode`,`nama`,`kategori`,`urutan`,`is_active`) VALUES ('jp-perlengkapan','perlengkapan','Perlengkapan Santri','sekali',3,1);--> statement-breakpoint
INSERT OR IGNORE INTO `jenis_pembayaran` (`id`,`kode`,`nama`,`kategori`,`urutan`,`is_active`) VALUES ('jp-kegiatan','kegiatan','Kegiatan / Acara','insidental',4,1);--> statement-breakpoint
INSERT OR IGNORE INTO `jenis_pembayaran` (`id`,`kode`,`nama`,`kategori`,`urutan`,`is_active`) VALUES ('jp-denda','denda','Denda','insidental',5,1);