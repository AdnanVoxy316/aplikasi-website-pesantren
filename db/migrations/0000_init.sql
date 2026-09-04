CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_accountId_uidx` ON `account` (`issuer`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'santri' NOT NULL,
	`is_disabled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `user` (`role`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `guru_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nip` text,
	`no_telp` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guru_profile_user_id_unique` ON `guru_profile` (`user_id`);--> statement-breakpoint
CREATE TABLE `jenis_nilai` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`bobot` real DEFAULT 1 NOT NULL,
	`mapel_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "jenis_nilai_bobot_check" CHECK("jenis_nilai"."bobot" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jenis_nilai_nama_unique` ON `jenis_nilai` (`nama`);--> statement-breakpoint
CREATE TABLE `kehadiran` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`mapel_id` text,
	`tanggal` text NOT NULL,
	`status` text NOT NULL,
	`dicatat_oleh` text,
	`tahun_ajaran_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dicatat_oleh`) REFERENCES `guru_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kehadiran_uidx` ON `kehadiran` (`santri_id`,`tanggal`,`mapel_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_santriId_idx` ON `kehadiran` (`santri_id`);--> statement-breakpoint
CREATE INDEX `kehadiran_tanggal_idx` ON `kehadiran` (`tanggal`);--> statement-breakpoint
CREATE INDEX `kehadiran_tahunAjaranId_idx` ON `kehadiran` (`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `kelas` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`tingkat` text,
	`wali_kelas_id` text,
	`tahun_ajaran_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`wali_kelas_id`) REFERENCES `guru_profile`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kelas_nama_tahun_ajaran_uidx` ON `kelas` (`nama`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE INDEX `kelas_tahunAjaranId_idx` ON `kelas` (`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `mapel` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`kategori` text DEFAULT 'umum' NOT NULL,
	`deskripsi` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "mapel_kategori_check" CHECK("mapel"."kategori" in ('umum', 'pesantren'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mapel_nama_unique` ON `mapel` (`nama`);--> statement-breakpoint
CREATE TABLE `nilai` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`mapel_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`jenis_nilai_id` text NOT NULL,
	`guru_id` text NOT NULL,
	`nilai` real NOT NULL,
	`catatan` text,
	`tahun_ajaran_id` text NOT NULL,
	`semester` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`jenis_nilai_id`) REFERENCES `jenis_nilai`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`guru_id`) REFERENCES `guru_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "nilai_range_check" CHECK("nilai"."nilai" >= 0 and "nilai"."nilai" <= 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_uidx` ON `nilai` (`santri_id`,`mapel_id`,`jenis_nilai_id`,`tahun_ajaran_id`,`semester`);--> statement-breakpoint
CREATE INDEX `nilai_santriId_idx` ON `nilai` (`santri_id`);--> statement-breakpoint
CREATE INDEX `nilai_mapelId_idx` ON `nilai` (`mapel_id`);--> statement-breakpoint
CREATE INDEX `nilai_tahunAjaranId_idx` ON `nilai` (`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `pengajaran` (
	`id` text PRIMARY KEY NOT NULL,
	`guru_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`mapel_id` text NOT NULL,
	`tahun_ajaran_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`guru_id`) REFERENCES `guru_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pengajaran_uidx` ON `pengajaran` (`guru_id`,`kelas_id`,`mapel_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE INDEX `pengajaran_guruId_idx` ON `pengajaran` (`guru_id`);--> statement-breakpoint
CREATE INDEX `pengajaran_kelasId_idx` ON `pengajaran` (`kelas_id`);--> statement-breakpoint
CREATE INDEX `pengajaran_mapelId_idx` ON `pengajaran` (`mapel_id`);--> statement-breakpoint
CREATE TABLE `pesantren_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`nama_pesantren` text DEFAULT 'ELMS Pesantren' NOT NULL,
	`alamat` text,
	`logo_url` text,
	`deskripsi` text,
	`tahun_ajaran_aktif_id` text,
	`semester_aktif` text DEFAULT 'ganjil' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tahun_ajaran_aktif_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rapor` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`tahun_ajaran_id` text NOT NULL,
	`semester` text NOT NULL,
	`ringkasan_nilai` text NOT NULL,
	`ringkasan_kehadiran` text NOT NULL,
	`catatan_wali_kelas` text,
	`file_pdf_url` text,
	`generated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`generated_by` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`generated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rapor_uidx` ON `rapor` (`santri_id`,`tahun_ajaran_id`,`semester`);--> statement-breakpoint
CREATE INDEX `rapor_santriId_idx` ON `rapor` (`santri_id`);--> statement-breakpoint
CREATE INDEX `rapor_tahunAjaranId_idx` ON `rapor` (`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `santri_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nis` text NOT NULL,
	`kelas_id` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`alamat` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `santri_profile_user_id_unique` ON `santri_profile` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `santri_profile_nis_unique` ON `santri_profile` (`nis`);--> statement-breakpoint
CREATE INDEX `santri_profile_kelasId_idx` ON `santri_profile` (`kelas_id`);--> statement-breakpoint
CREATE TABLE `tahun_ajaran` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`tanggal_mulai` text NOT NULL,
	`tanggal_selesai` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tahun_ajaran_label_unique` ON `tahun_ajaran` (`label`);--> statement-breakpoint
CREATE INDEX `tahun_ajaran_isActive_idx` ON `tahun_ajaran` (`is_active`);--> statement-breakpoint
CREATE TABLE `wali_santri_anak` (
	`id` text PRIMARY KEY NOT NULL,
	`wali_santri_id` text NOT NULL,
	`santri_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`wali_santri_id`) REFERENCES `wali_santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wali_santri_anak_uidx` ON `wali_santri_anak` (`wali_santri_id`,`santri_id`);--> statement-breakpoint
CREATE INDEX `wali_santri_anak_santriId_idx` ON `wali_santri_anak` (`santri_id`);--> statement-breakpoint
CREATE TABLE `wali_santri_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`no_telp` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wali_santri_profile_user_id_unique` ON `wali_santri_profile` (`user_id`);--> statement-breakpoint
CREATE TABLE `tugas` (
	`id` text PRIMARY KEY NOT NULL,
	`judul` text NOT NULL,
	`deskripsi` text NOT NULL,
	`mapel_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`guru_id` text NOT NULL,
	`deadline` integer NOT NULL,
	`tahun_ajaran_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guru_id`) REFERENCES `guru_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `tugas_kelasId_idx` ON `tugas` (`kelas_id`);--> statement-breakpoint
CREATE INDEX `tugas_guruId_idx` ON `tugas` (`guru_id`);--> statement-breakpoint
CREATE INDEX `tugas_deadline_idx` ON `tugas` (`deadline`);--> statement-breakpoint
CREATE TABLE `tugas_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`tugas_id` text NOT NULL,
	`santri_id` text NOT NULL,
	`tipe` text NOT NULL,
	`file_path` text,
	`file_nama_asli` text,
	`file_mime_type` text,
	`file_size` integer,
	`url` text,
	`status` text DEFAULT 'dikumpulkan' NOT NULL,
	`nilai` real,
	`feedback_guru` text,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`tugas_id`) REFERENCES `tugas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tugas_submission_uidx` ON `tugas_submission` (`tugas_id`,`santri_id`);--> statement-breakpoint
CREATE INDEX `tugas_submission_tugasId_idx` ON `tugas_submission` (`tugas_id`);--> statement-breakpoint
CREATE INDEX `tugas_submission_santriId_idx` ON `tugas_submission` (`santri_id`);--> statement-breakpoint
CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`aksi` text NOT NULL,
	`entitas` text NOT NULL,
	`entitas_id` text,
	`detail` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activity_log_userId_idx` ON `activity_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_log_createdAt_idx` ON `activity_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `notifikasi` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`entitas` text,
	`entitas_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifikasi_userId_idx` ON `notifikasi` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifikasi_isRead_idx` ON `notifikasi` (`is_read`);--> statement-breakpoint
CREATE TABLE `pengumuman` (
	`id` text PRIMARY KEY NOT NULL,
	`judul` text NOT NULL,
	`isi` text NOT NULL,
	`target_role` text DEFAULT 'semua' NOT NULL,
	`target_kelas_id` text,
	`dibuat_oleh` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`target_kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`dibuat_oleh`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pengumuman_targetRole_idx` ON `pengumuman` (`target_role`);--> statement-breakpoint
CREATE INDEX `pengumuman_targetKelasId_idx` ON `pengumuman` (`target_kelas_id`);--> statement-breakpoint
CREATE TABLE `payment_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'mayar' NOT NULL,
	`provider_event_id` text,
	`provider_transaction_id` text,
	`event_type` text,
	`payload` text NOT NULL,
	`processing_status` text DEFAULT 'received' NOT NULL,
	`received_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`processed_at` integer,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `payment_webhook_events_eventId_idx` ON `payment_webhook_events` (`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_webhook_events_transactionId_idx` ON `payment_webhook_events` (`provider_transaction_id`);--> statement-breakpoint
CREATE TABLE `pembayaran_spp` (
	`id` text PRIMARY KEY NOT NULL,
	`tagihan_spp_id` text NOT NULL,
	`provider` text DEFAULT 'mayar' NOT NULL,
	`provider_transaction_id` text,
	`provider_invoice_id` text,
	`checkout_url` text,
	`payment_method` text,
	`nominal_dibayar` integer,
	`biaya_admin` integer,
	`total_dibayar` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`provider_payload` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tagihan_spp_id`) REFERENCES `tagihan_spp`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pembayaran_spp_tagihanId_idx` ON `pembayaran_spp` (`tagihan_spp_id`);--> statement-breakpoint
CREATE INDEX `pembayaran_spp_status_idx` ON `pembayaran_spp` (`status`);--> statement-breakpoint
CREATE TABLE `tagihan_spp` (
	`id` text PRIMARY KEY NOT NULL,
	`nomor_tagihan` text NOT NULL,
	`santri_id` text NOT NULL,
	`tarif_spp_id` text,
	`tahun_ajaran_id` text NOT NULL,
	`periode_bulan` integer NOT NULL,
	`periode_tahun` integer NOT NULL,
	`nominal` integer NOT NULL,
	`nominal_diskon` integer DEFAULT 0 NOT NULL,
	`nominal_denda` integer DEFAULT 0 NOT NULL,
	`total_tagihan` integer NOT NULL,
	`jatuh_tempo` integer,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tarif_spp_id`) REFERENCES `tarif_spp`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "tagihan_spp_periodeBulan_check" CHECK("tagihan_spp"."periode_bulan" >= 1 and "tagihan_spp"."periode_bulan" <= 12)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tagihan_spp_nomor_tagihan_unique` ON `tagihan_spp` (`nomor_tagihan`);--> statement-breakpoint
CREATE UNIQUE INDEX `tagihan_spp_uidx` ON `tagihan_spp` (`santri_id`,`periode_bulan`,`periode_tahun`);--> statement-breakpoint
CREATE INDEX `tagihan_spp_santriId_idx` ON `tagihan_spp` (`santri_id`);--> statement-breakpoint
CREATE INDEX `tagihan_spp_status_idx` ON `tagihan_spp` (`status`);--> statement-breakpoint
CREATE TABLE `tarif_spp` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`nominal` integer NOT NULL,
	`kelas_id` text,
	`tahun_ajaran_id` text,
	`berlaku_mulai` text NOT NULL,
	`berlaku_sampai` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "tarif_spp_nominal_check" CHECK("tarif_spp"."nominal" > 0)
);
--> statement-breakpoint
CREATE INDEX `tarif_spp_isActive_idx` ON `tarif_spp` (`is_active`);