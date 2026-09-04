import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listAllPengumumanAdmin, listKelasDetail } from "@/db/queries/admin";
import { getTahunAjaranAktif } from "@/db/queries/admin";
import { PengumumanClient } from "./pengumuman-client";

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Broadcast pengumuman ke seluruh warga pesantren.",
};

export default async function AdminPengumumanPage() {
  const [rows, kelasRows, taAktif] = await Promise.all([
    listAllPengumumanAdmin(),
    listKelasDetail(),
    getTahunAjaranAktif(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Layanan pesantren"
        title="Pengumuman"
        description="Broadcast informasi resmi ke guru, santri, dan wali santri."
      />
      <PengumumanClient
        rows={rows}
        kelasOptions={kelasRows
          .filter((k) => !taAktif || k.tahunAjaranId === taAktif.id)
          .map((k) => ({ id: k.id, nama: k.nama }))}
      />
    </>
  );
}
