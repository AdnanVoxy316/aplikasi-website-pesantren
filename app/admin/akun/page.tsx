import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listAkunWithProfile, listKelasDetail } from "@/db/queries/admin";
import { getTahunAjaranAktif } from "@/db/queries/admin";
import { AkunClient } from "./akun-client";

export const metadata: Metadata = {
  title: "Akun pengguna",
  description: "Kelola akun guru, santri, dan wali santri pesantren.",
};

export default async function AdminAkunPage() {
  const [rows, kelasRows, taAktif] = await Promise.all([
    listAkunWithProfile(),
    listKelasDetail(),
    getTahunAjaranAktif(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Akun pengguna"
        description="Tambah, edit, nonaktifkan, atau reset kata sandi akun guru, santri, dan wali santri."
      />
      <AkunClient
        rows={rows}
        kelasOptions={kelasRows
          .filter((k) => !taAktif || k.tahunAjaranId === taAktif.id)
          .map((k) => ({ id: k.id, nama: k.nama }))}
      />
    </>
  );
}
