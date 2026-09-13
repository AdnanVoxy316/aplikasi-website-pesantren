import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, listPengajaranGuru } from "@/db/queries/guru";
import { TugasBaruClient } from "./tugas-baru-client";

export const metadata: Metadata = {
  title: "Buat tugas baru",
  description: "Buat tugas untuk kelas yang diampu.",
};

export default async function GuruTugasBaruPage() {
  const session = await requireRole("guru");
  const guru = await getGuruProfile(session.user.id);
  const pengajaranRows = guru ? await listPengajaranGuru(guru.id) : [];

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Buat tugas baru"
        description="Santri dapat mengumpulkan file (semua jenis, maks 10 MB per file, hingga 10 file) dan/atau link."
      />
      <Panel
        title="Formulir tugas"
        subtitle="Tugas langsung terlihat oleh santri di kelas tujuan"
        actions={
          <Link className="button button-secondary form-cancel-header" href="/guru/tugas">
            Batal
          </Link>
        }
        bodyClassName="panel-body"
        className="form-shell"
      >
        <TugasBaruClient
          pengajaranOptions={pengajaranRows.map((p) => ({
            id: p.id,
            label: `${p.kelasNama} · ${p.mapelNama}`,
            kelasId: p.kelasId,
            mapelId: p.mapelId,
            tahunAjaranId: p.tahunAjaranId,
          }))}
        />
      </Panel>
    </>
  );
}
