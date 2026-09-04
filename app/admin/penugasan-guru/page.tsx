import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import {
  listPengajaranDetail,
  listGuruForSelect,
  listKelasDetail,
  listMapelDetail,
  listTahunAjaran,
} from "@/db/queries/admin";
import { PengajaranClient } from "./pengajaran-client";

export const metadata: Metadata = {
  title: "Penugasan guru",
  description: "Assign guru ke kelas dan mapel tertentu.",
};

export default async function AdminPenugasanPage() {
  const [rows, guru, kelas, mapel, ta] = await Promise.all([
    listPengajaranDetail(),
    listGuruForSelect(),
    listKelasDetail(),
    listMapelDetail(),
    listTahunAjaran(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Penugasan guru"
        description="Guru hanya dapat menilai kelas & mapel yang ditugaskan kepadanya."
      />
      <PengajaranClient
        rows={rows}
        guruOptions={guru.map((g) => ({ id: g.id, label: g.nama }))}
        kelasOptions={kelas.map((k) => ({ id: k.id, label: `${k.nama} (${k.tahunAjaranLabel})` }))}
        mapelOptions={mapel.map((m) => ({ id: m.id, label: m.nama }))}
        taOptions={ta.map((t) => ({ id: t.id, label: t.label }))}
      />
    </>
  );
}
