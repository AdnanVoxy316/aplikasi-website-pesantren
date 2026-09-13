ALTER TABLE `pembayaran_spp` ADD `snap_token` text;--> statement-breakpoint
UPDATE `pembayaran_spp`
SET `snap_token` = substr(`checkout_url`, -36)
WHERE `checkout_url` IS NOT NULL
  AND length(`checkout_url`) >= 36
  AND substr(`checkout_url`, -36) GLOB '[0-9a-fA-F]*-*-*-*-*';