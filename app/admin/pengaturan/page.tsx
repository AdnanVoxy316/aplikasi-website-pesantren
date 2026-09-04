import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { getPesantrenSettings, listTahunAjaran, listJenisNilai } from "@/db/queries/admin";
import { PengaturanClient } from "./pengaturan-client";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Pengaturan situs, tahun ajaran, dan jenis nilai pesantren.",
};

export default async function AdminPengaturanPage() {
  const [settingsRow, taRows, jenisRows] = await Promise.all([
    getPesantrenSettings(),
    listTahunAjaran(),
    listJenisNilai(),
  ]);

  return (
    <>
      <PageHeading
        kicker="Layanan pesantren"
        title="Pengaturan"
        description="Identitas pesantren, tahun ajaran aktif, dan konfigurasi penilaian."
      />
      <PengaturanClient
        settings={
          settingsRow
            ? {
                namaPesantren: settingsRow.settings.namaPesantren,
                alamat: settingsRow.settings.alamat,
                deskripsi: settingsRow.settings.deskripsi,
                logoUrl: settingsRow.settings.logoUrl,
                semesterAktif: settingsRow.settings.semesterAktif,
              }
            : null
        }
        taRows={taRows.map((t) => ({
          id: t.id,
          label: t.label,
          isActive: t.isActive,
          tanggalMulai: t.tanggalMulai,
          tanggalSelesai: t.tanggalSelesai,
        }))}
        jenisRows={jenisRows.map((j) => ({ id: j.id, nama: j.nama, bobot: j.bobot }))}
      />
    </>
  );
}
