CREATE TABLE `tarif_spp_santri` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`nominal` integer NOT NULL,
	`catatan` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "tarif_spp_santri_nominal_check" CHECK("tarif_spp_santri"."nominal" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tarif_spp_santri_uidx` ON `tarif_spp_santri` (`santri_id`);--> statement-breakpoint
CREATE INDEX `tarif_spp_santri_isActive_idx` ON `tarif_spp_santri` (`is_active`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'midtrans' NOT NULL,
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
INSERT INTO `__new_payment_webhook_events`("id", "provider", "provider_event_id", "provider_transaction_id", "event_type", "payload", "processing_status", "received_at", "processed_at", "error_message") SELECT "id", "provider", "provider_event_id", "provider_transaction_id", "event_type", "payload", "processing_status", "received_at", "processed_at", "error_message" FROM `payment_webhook_events`;--> statement-breakpoint
DROP TABLE `payment_webhook_events`;--> statement-breakpoint
ALTER TABLE `__new_payment_webhook_events` RENAME TO `payment_webhook_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `payment_webhook_events_eventId_idx` ON `payment_webhook_events` (`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_webhook_events_transactionId_idx` ON `payment_webhook_events` (`provider_transaction_id`);--> statement-breakpoint
CREATE TABLE `__new_pembayaran_spp` (
	`id` text PRIMARY KEY NOT NULL,
	`tagihan_spp_id` text NOT NULL,
	`provider` text DEFAULT 'midtrans' NOT NULL,
	`provider_order_id` text,
	`provider_transaction_id` text,
	`provider_invoice_id` text,
	`checkout_url` text,
	`payment_method` text,
	`catatan` text,
	`dicatat_oleh` text,
	`nominal_dibayar` integer,
	`biaya_admin` integer,
	`total_dibayar` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`bukti_terkirim_at` integer,
	`provider_payload` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tagihan_spp_id`) REFERENCES `tagihan_spp`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dicatat_oleh`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_pembayaran_spp`("id", "tagihan_spp_id", "provider", "provider_transaction_id", "provider_invoice_id", "checkout_url", "payment_method", "nominal_dibayar", "biaya_admin", "total_dibayar", "status", "paid_at", "provider_payload", "created_at", "updated_at") SELECT "id", "tagihan_spp_id", "provider", "provider_transaction_id", "provider_invoice_id", "checkout_url", "payment_method", "nominal_dibayar", "biaya_admin", "total_dibayar", "status", "paid_at", "provider_payload", "created_at", "updated_at" FROM `pembayaran_spp`;--> statement-breakpoint
DROP TABLE `pembayaran_spp`;--> statement-breakpoint
ALTER TABLE `__new_pembayaran_spp` RENAME TO `pembayaran_spp`;--> statement-breakpoint
CREATE INDEX `pembayaran_spp_tagihanId_idx` ON `pembayaran_spp` (`tagihan_spp_id`);--> statement-breakpoint
CREATE INDEX `pembayaran_spp_status_idx` ON `pembayaran_spp` (`status`);--> statement-breakpoint
CREATE INDEX `pembayaran_spp_orderId_idx` ON `pembayaran_spp` (`provider_order_id`);