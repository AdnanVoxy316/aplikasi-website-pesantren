import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listWaliWithAnak, listSantriWithKelas } from "@/db/queries/admin";
import { WaliSantriClient } from "./wali-client";

export const metadata: Metadata = {
  title: "Relasi wali santri",
  description: "Hubungkan akun wali santri dengan akun santri (anak).",
};

export default async function AdminWaliSantriPage() {
  const [groups, santriRows] = await Promise.all([
    listWaliWithAnak(),
    listSantriWithKelas(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Relasi wali santri"
        description="Wali santri hanya dapat memantau anak yang terhubung melalui relasi ini."
      />
      <WaliSantriClient
        groups={groups}
        santriOptions={santriRows.map((s) => ({
          id: s.id,
          label: `${s.nama} · NIS ${s.nis}${s.kelasNama ? ` · ${s.kelasNama}` : ""}`,
        }))}
      />
    </>
  );
}
