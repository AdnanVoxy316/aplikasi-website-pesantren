import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, listPengajaranGuru, listNilaiKelasMapel } from "@/db/queries/guru";
import { getPesantrenSettings } from "@/db/queries/admin";
import { NilaiGridClient } from "./nilai-client";

export const metadata: Metadata = {
  title: "Input nilai",
  description: "Input nilai massal per kelas, mapel, dan jenis penilaian.",
};

export default async function GuruNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ pengajaranId?: string }>;
}) {
  const session = await requireRole("guru");
  const params = await searchParams;
  const guru = await getGuruProfile(session.user.id);

  if (!guru) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil guru belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const pengajaranRows = await listPengajaranGuru(guru.id);
  if (pengajaranRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Kegiatan mengajar" title="Input nilai" />
        <Panel title="Belum ada penugasan">
          <EmptyState>
            Anda belum ditugaskan ke kelas/mapel mana pun. Hubungi admin pesantren.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const selected =
    pengajaranRows.find((p) => p.id === params.pengajaranId) ?? pengajaranRows[0];
  const settings = await getPesantrenSettings();
  const semester = settings?.settings.semesterAktif ?? "ganjil";

  const { santri, jenisNilai, nilai } = await listNilaiKelasMapel(
    selected.kelasId,
    selected.mapelId,
    selected.tahunAjaranId,
    semester,
  );

  const existing: Record<string, Record<string, number>> = {};
  for (const row of nilai) {
    existing[row.santriId] = existing[row.santriId] ?? {};
    existing[row.santriId][row.jenisNilaiId] = row.nilai;
  }

  return (
    <>
      <PageHeading
        kicker="Kegiatan mengajar"
        title="Input nilai"
        description={`Nilai dihitung berbobot sesuai jenis nilai yang dikonfigurasi admin. Semester ${semester}.`}
      />

      <div className="panel-toolbar" style={{ padding: "0 0 14px" }}>
        <div className="toolbar-left">
          {pengajaranRows.map((p) => (
            <Link
              key={p.id}
              href={`/guru/nilai?pengajaranId=${p.id}`}
              className={`table-button${p.id === selected.id ? " button-primary" : ""}`}
              style={{
                marginRight: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: p.id === selected.id ? "var(--brand)" : "var(--surface)",
                color: p.id === selected.id ? "#fff" : "inherit",
              }}
            >
              {p.kelasNama} · {p.mapelNama}
            </Link>
          ))}
        </div>
      </div>

      <Panel
        title={`${selected.kelasNama} — ${selected.mapelNama}`}
        subtitle={`${santri.length} santri · ${jenisNilai.length} jenis nilai`}
      >
        <NilaiGridClient
          kelasId={selected.kelasId}
          mapelId={selected.mapelId}
          tahunAjaranId={selected.tahunAjaranId}
          semester={semester}
          santri={santri}
          jenisNilai={jenisNilai.map((j) => ({ id: j.id, nama: j.nama, bobot: j.bobot }))}
          existing={existing}
        />
      </Panel>
    </>
  );
}
