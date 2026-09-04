import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState, PageFooter } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import {
  listAnakWali,
  getRekapKehadiranSantri,
  listNilaiSantri,
  listTagihanAnak,
} from "@/db/queries/santri";
import { getTahunAjaranAktif } from "@/db/queries/admin";
import { persenHadir, rupiah, labelPeriode } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard wali santri",
  description: "Pantau nilai, kehadiran, rapor, dan pembayaran anak.",
};

export default async function WaliDashboardPage() {
  const session = await requireRole("wali");
  const anakRows = await listAnakWali(session.user.id);
  const taAktif = await getTahunAjaranAktif();

  if (anakRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Workspace" title="Dashboard wali santri" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>
            Akun wali Anda belum dihubungkan dengan santri mana pun. Hubungi admin pesantren
            untuk menghubungkan anak Anda.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const ringkasanAnak = await Promise.all(
    anakRows.map(async (anak) => {
      const [kehadiran, nilaiRows, tagihan] = await Promise.all([
        getRekapKehadiranSantri(anak.santriId, taAktif?.id),
        taAktif
          ? listNilaiSantri(anak.santriId, taAktif.id, "ganjil")
          : Promise.resolve([]),
        listTagihanAnak([anak.santriId]),
      ]);
      const tagihanAktif = tagihan.filter(
        (t) => t.status === "unpaid" || t.status === "pending" || t.status === "processing",
      );
      return {
        ...anak,
        kehadiran,
        jumlahMapelDinilai: nilaiRows.length,
        rataNilai:
          nilaiRows.length > 0
            ? Math.round(
                (nilaiRows.reduce((s, n) => s + (n.nilaiAkhir ?? 0), 0) / nilaiRows.length) * 100,
              ) / 100
            : null,
        tagihanAktif: tagihanAktif.length,
        tagihanNominal: tagihanAktif.reduce((s, t) => s + t.totalTagihan, 0),
        terdekat: tagihanAktif[0] ?? null,
      };
    }),
  );

  return (
    <>
      <PageHeading
        kicker="Workspace"
        title={`Assalamu'alaikum, ${session.user.name}`}
        description="Ringkasan perkembangan akademik dan keuangan anak Anda."
      />

      {ringkasanAnak.length > 1 ? (
        <p className="panel-subtitle" style={{ padding: "0 0 10px" }}>
          Anda memiliki {ringkasanAnak.length} anak terdaftar. Pilih anak untuk detail lengkap.
        </p>
      ) : null}

      {ringkasanAnak.map((anak) => (
        <Panel
          key={anak.santriId}
          title={anak.nama}
          subtitle={`NIS ${anak.nis}${anak.kelasNama ? ` · Kelas ${anak.kelasNama}` : ""}`}
          actions={
            <Link className="button button-secondary" href={`/wali/nilai?anak=${anak.santriId}`}>
              Detail akademik
            </Link>
          }
        >
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Rata-rata nilai</span>
              <strong className="stat-value">{anak.rataNilai ?? "—"}</strong>
              <span className="stat-note">{anak.jumlahMapelDinilai} mapel dinilai</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Kehadiran</span>
              <strong className="stat-value">
                {persenHadir(anak.kehadiran.hadir, anak.kehadiran.total)}%
              </strong>
              <span className="stat-note">
                {anak.kehadiran.hadir}/{anak.kehadiran.total} hadir
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tagihan aktif</span>
              <strong className="stat-value">{String(anak.tagihanAktif)}</strong>
              <span className="stat-note">{rupiah(anak.tagihanNominal)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Jatuh tempo terdekat</span>
              <strong className="stat-value" style={{ fontSize: 14 }}>
                {anak.terdekat
                  ? labelPeriode(anak.terdekat.periodeBulan, anak.terdekat.periodeTahun)
                  : "—"}
              </strong>
              <span className="stat-note">
                {anak.terdekat ? rupiah(anak.terdekat.totalTagihan) : "tidak ada tagihan"}
              </span>
            </div>
          </div>
        </Panel>
      ))}

      <PageFooter />
    </>
  );
}
