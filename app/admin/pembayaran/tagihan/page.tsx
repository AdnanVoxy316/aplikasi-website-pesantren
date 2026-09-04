import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listTagihanDetail, listKelasDetail, listTahunAjaran, getTahunAjaranAktif } from "@/db/queries/admin";
import { listSantriWithKelas } from "@/db/queries/admin";
import { TagihanClient } from "./tagihan-client";

export const metadata: Metadata = {
  title: "Tagihan SPP",
  description: "Generate dan kelola tagihan SPP santri.",
};

export default async function AdminTagihanPage() {
  const [rows, kelasRows, santriRows, taRows, taAktif] = await Promise.all([
    listTagihanDetail(),
    listKelasDetail(),
    listSantriWithKelas(),
    listTahunAjaran(),
    getTahunAjaranAktif(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Pembayaran SPP"
        title="Tagihan"
        description="Tagihan menyimpan snapshot nominal saat dibuat — perubahan tarif tidak memengaruhi histori."
      />
      <TagihanClient
        rows={rows}
        kelasOptions={kelasRows.map((k) => ({ id: k.id, nama: k.nama }))}
        santriOptions={santriRows.map((s) => ({
          id: s.id,
          label: `${s.nama} · NIS ${s.nis}${s.kelasNama ? ` · ${s.kelasNama}` : ""}`,
        }))}
        taOptions={taRows.map((t) => ({ id: t.id, label: t.label }))}
        tahunAjaranId={taAktif?.id ?? ""}
      />
    </>
  );
}
