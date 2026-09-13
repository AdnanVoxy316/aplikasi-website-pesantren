import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import {
  listTagihanDetail,
  listKelasDetail,
  listTahunAjaran,
  getTahunAjaranAktif,
} from "@/db/queries/admin";
import { listSantriWithKelas } from "@/db/queries/admin";
import { listItemTagihan, listJenisPembayaran, mapItemTagihan } from "@/db/queries/pembayaran";
import { TagihanClient } from "./tagihan-client";

export const metadata: Metadata = {
  title: "Tagihan",
  description: "Generate tagihan SPP massal dan susun tagihan multi-item untuk santri.",
};

export default async function AdminTagihanPage() {
  const [rows, kelasRows, santriRows, taRows, taAktif, jenisRows] = await Promise.all([
    listTagihanDetail(),
    listKelasDetail(),
    listSantriWithKelas(),
    listTahunAjaran(),
    getTahunAjaranAktif(),
    listJenisPembayaran(),
  ]);

  const itemRows = await listItemTagihan(rows.map((r) => r.id));
  const itemMap = Object.fromEntries(mapItemTagihan(itemRows));

  return (
    <>
      <PageHeading
        kicker="Pembayaran"
        title="Tagihan"
        description="Tagihan SPP dibuat massal; tagihan lain (daftar ulang, perlengkapan, dll.) disusun manual dan bisa berisi beberapa item dengan sekali bayar."
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
        jenisOptions={jenisRows.map((j) => ({
          id: j.id,
          kode: j.kode,
          nama: j.nama,
          kategori: j.kategori,
          tarif: j.tarif,
          isActive: j.isActive,
        }))}
        itemMap={itemMap}
      />
    </>
  );
}
