import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listJenisPembayaran } from "@/db/queries/pembayaran";
import { JenisPembayaranClient } from "./jenis-client";

export const metadata: Metadata = {
  title: "Jenis pembayaran",
  description: "Kelola jenis pembayaran pesantren untuk tagihan multi-item.",
};

export default async function AdminJenisPembayaranPage() {
  const rows = await listJenisPembayaran();

  return (
    <>
      <PageHeading
        kicker="Pembayaran"
        title="Jenis pembayaran"
        description="Jenis untuk menyusun tagihan multi-item (SPP bulanan, daftar ulang, perlengkapan, kegiatan, denda) beserta tarif bawaannya."
      />
      <JenisPembayaranClient rows={rows} />
    </>
  );
}
