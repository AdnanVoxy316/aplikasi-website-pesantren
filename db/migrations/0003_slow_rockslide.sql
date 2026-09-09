PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tugas_lampiran` (
	`id` text PRIMARY KEY NOT NULL,
	`tugas_id` text NOT NULL,
	`file_path` text,
	`nama_asli` text NOT NULL,
	`url` text,
	`mime_type` text,
	`size` integer,
	`uploaded_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tugas_id`) REFERENCES `tugas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tugas_lampiran`("id", "tugas_id", "file_path", "nama_asli", "url", "mime_type", "size", "uploaded_by", "created_at") SELECT "id", "tugas_id", "file_path", "nama_asli", NULL AS "url", "mime_type", "size", "uploaded_by", "created_at" FROM `tugas_lampiran`;--> statement-breakpoint
DROP TABLE `tugas_lampiran`;--> statement-breakpoint
ALTER TABLE `__new_tugas_lampiran` RENAME TO `tugas_lampiran`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tugas_lampiran_tugasId_idx` ON `tugas_lampiran` (`tugas_id`);