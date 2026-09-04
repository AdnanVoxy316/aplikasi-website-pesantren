import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listKelasDetail, listGuruForSelect, listTahunAjaran } from "@/db/queries/admin";
import { KelasClient } from "./kelas-client";

export const metadata: Metadata = {
  title: "Kelas",
  description: "Kelola kelas pesantren per tahun ajaran.",
};

export default async function AdminKelasPage() {
  const [rows, guruOptions, taRows] = await Promise.all([
    listKelasDetail(),
    listGuruForSelect(),
    listTahunAjaran(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Kelas"
        description="Buat dan kelola kelas — nama bersifat fleksibel (Ibtida A, Tsanawiyah 1, dst)."
      />
      <KelasClient
        rows={rows}
        guruOptions={guruOptions}
        taOptions={taRows.map((t) => ({ id: t.id, label: t.label, isActive: t.isActive }))}
      />
    </>
  );
}
