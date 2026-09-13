import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listTarifSppSantri, listTarifDefault } from "@/db/queries/pembayaran";
import { listSantriWithKelas } from "@/db/queries/admin";
import { TarifSantriClient } from "./tarif-santri-client";

export const metadata: Metadata = {
  title: "Tarif khusus santri",
  description: "Atur nominal SPP khusus per santri sesuai kemampuan membayar.",
};

export default async function AdminTarifSantriPage() {
  const [rows, santriRows, tarifDefault] = await Promise.all([
    listTarifSppSantri(),
    listSantriWithKelas(),
    listTarifDefault(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Tarif khusus santri"
        description="Santri dengan tarif khusus membayar sesuai kemampuannya, walaupun sekelas dengan santri lain."
      />
      <TarifSantriClient
        rows={rows}
        santriOptions={santriRows.map((s) => ({
          id: s.id,
          label: `${s.nama} · NIS ${s.nis}${s.kelasNama ? ` · ${s.kelasNama}` : ""}`,
        }))}
        tarifDefault={tarifDefault.map((t) => ({
          id: t.id,
          nama: t.nama,
          nominal: t.nominal,
          kelasNama: t.kelasNama,
        }))}
      />
    </>
  );
}
