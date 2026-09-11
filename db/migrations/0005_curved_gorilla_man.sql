ALTER TABLE `email_otp` ADD `stage` text DEFAULT 'konfirmasi_lama' NOT NULL;--> statement-breakpoint
ALTER TABLE `email_otp` ADD `sent_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_otp` ADD `last_sent_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL;