import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listTarifSpp } from "@/db/queries/pembayaran";
import { listKelasDetail, getTahunAjaranAktif } from "@/db/queries/admin";
import { TarifClient } from "./tarif-client";

export const metadata: Metadata = {
  title: "Tarif SPP",
  description: "Kelola tarif SPP — nominal tidak di-hard-code di sistem.",
};

export default async function AdminTarifPage() {
  const [rows, kelasRows, taAktif] = await Promise.all([
    listTarifSpp(),
    listKelasDetail(),
    getTahunAjaranAktif(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Tarif SPP"
        description="Tarif berasal dari database dengan periode berlaku. Tagihan lama menyimpan snapshot nominal."
      />
      <TarifClient
        rows={rows}
        kelasOptions={kelasRows
          .filter((k) => !taAktif || k.tahunAjaranId === taAktif.id)
          .map((k) => ({ id: k.id, nama: k.nama }))}
      />
    </>
  );
}
