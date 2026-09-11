CREATE TABLE `reset_otp` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`account_email` text NOT NULL,
	`code_hash` text NOT NULL,
	`stage` text DEFAULT 'verifikasi' NOT NULL,
	`sent_count` integer DEFAULT 1 NOT NULL,
	`last_sent_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reset_otp_userId_idx` ON `reset_otp` (`user_id`);