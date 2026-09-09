CREATE TABLE `tugas_lampiran` (
	`id` text PRIMARY KEY NOT NULL,
	`tugas_id` text NOT NULL,
	`file_path` text NOT NULL,
	`nama_asli` text NOT NULL,
	`mime_type` text,
	`size` integer,
	`uploaded_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tugas_id`) REFERENCES `tugas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tugas_lampiran_tugasId_idx` ON `tugas_lampiran` (`tugas_id`);--> statement-breakpoint
CREATE TABLE `tugas_submission_file` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`file_path` text NOT NULL,
	`nama_asli` text NOT NULL,
	`mime_type` text,
	`size` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `tugas_submission`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tugas_submission_file_submissionId_idx` ON `tugas_submission_file` (`submission_id`);--> statement-breakpoint
INSERT INTO `tugas_submission_file` (`id`, `submission_id`, `file_path`, `nama_asli`, `mime_type`, `size`, `created_at`) SELECT lower(hex(randomblob(16))), `tugas_submission`.`id`, `tugas_submission`.`file_path`, `tugas_submission`.`file_nama_asli`, `tugas_submission`.`file_mime_type`, `tugas_submission`.`file_size`, `tugas_submission`.`submitted_at` FROM `tugas_submission` WHERE `tugas_submission`.`file_path` IS NOT NULL;
