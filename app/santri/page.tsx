import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState, PageFooter } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, getSantriDashboardStats, listTugasUntukSantri, getNilaiTerbaruSantri, listPengumumanUntukSantriWali } from "@/db/queries/santri";
import { AnnouncementList } from "@/components/ui/lists";
import { rupiah, tanggalIndo, sisaWaktu, persenHadir, labelPeriode, masihBerjalan } from "@/lib/format";
import { db } from "@/db";
import { tagihanSpp } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Dashboard santri",
  description: "Tugas aktif, nilai terbaru, kehadiran, dan tagihan SPP.",
};

export default async function SantriDashboardPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <>
        <PageHeading kicker="Workspace" title="Dashboard santri" />
        <Panel title="Profil belum ada">
          <EmptyState>Profil santri belum dibuat admin. Hubungi admin pesantren.</EmptyState>
        </Panel>
      </>
    );
  }

  const [stats, tugasRows, nilaiTerbaru, pengumuman] = await Promise.all([
    getSantriDashboardStats(profile.id, profile.kelasId),
    listTugasUntukSantri(profile.id, profile.kelasId),
    getNilaiTerbaruSantri(profile.id),
    listPengumumanUntukSantriWali(profile.kelasId),
  ]);

  const tagihanAktifRows = await db
    .select()
    .from(tagihanSpp)
    .where(
      and(
        eq(tagihanSpp.santriId, profile.id),
        inArray(tagihanSpp.status, ["unpaid", "pending", "processing"]),
      ),
    );

  const tugasBerjalan = tugasRows
    .filter((t) => masihBerjalan(t.deadline) && !t.submissionId)
    .slice(0, 5);

  return (
    <>
      <PageHeading
        kicker="Workspace"
        title={`Assalamu'alaikum, ${session.user.name}`}
        description={profile.kelasNama ? `Kelas ${profile.kelasNama} · NIS ${profile.nis}` : `NIS ${profile.nis}`}
      />

      <div className="stats-grid">
        <StatCard icon="clipboard" tone="icon-coral" label="Tugas belum dikumpulkan" value={String(stats.tugasAktif)} note={`${stats.totalTugas} total tugas`} />
        <StatCard icon="file" tone="icon-gold" label="Menunggu dinilai" value={String(stats.tugasBelumDinilai)} note="Submission terkirim" />
        <StatCard
          icon="users"
          tone="icon-green"
          label="Kehadiran"
          value={`${persenHadir(stats.kehadiran.hadir, stats.kehadiran.total)}%`}
          note={`${stats.kehadiran.hadir}/${stats.kehadiran.total} hadir`}
        />
        <StatCard
          icon="wallet"
          tone="icon-blue"
          label="Tagihan aktif"
          value={String(stats.tagihanAktif)}
          note={rupiah(stats.tagihanNominal)}
        />
      </div>

      <div className="form-layout">
        <Panel title="Tugas berjalan" subtitle="Deadline terdekat">
          {tugasBerjalan.length === 0 ? (
            <EmptyState>
              Tidak ada tugas yang belum dikumpulkan. Mantap!{" "}
              <Link href="/santri/tugas">Lihat semua tugas</Link>.
            </EmptyState>
          ) : (
            <div className="announcement-list">
              {tugasBerjalan.map((t) => {
                const sisa = sisaWaktu(t.deadline);
                return (
                  <Link href={`/santri/tugas/${t.id}`} key={t.id} className="announcement" style={{ display: "flex", textDecoration: "none", color: "inherit" }}>
                    <span className="announcement-icon">
                      <Icon name="clipboard" />
                    </span>
                    <div>
                      <div className="announcement-title">{t.judul}</div>
                      <div className="announcement-text">
                        {t.mapelNama} · deadline {tanggalIndo(t.deadline)}
                      </div>
                    </div>
                    <time className="announcement-date">{sisa.text}</time>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Nilai terbaru" subtitle="5 penilaian terakhir">
          {nilaiTerbaru.length === 0 ? (
            <EmptyState>Belum ada nilai yang diinput guru.</EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <tbody>
                  {nilaiTerbaru.map((n, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{n.mapelNama}</strong> · {n.jenisNama}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong>{n.nilai}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
            <Link className="button button-secondary" href="/santri/nilai">
              Lihat semua nilai
            </Link>
          </div>
        </Panel>
      </div>

      <div className="form-layout">
        <Panel title="Tagihan SPP" subtitle="Periode berjalan">
          {tagihanAktifRows.length === 0 ? (
            <EmptyState>Tidak ada tagihan aktif. Jazakumullahu khairan!</EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <tbody>
                  {tagihanAktifRows.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{labelPeriode(t.periodeBulan, t.periodeTahun)}</strong>
                        <div style={{ fontSize: 10 }}>jatuh tempo {tanggalIndo(t.jatuhTempo)}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong>{rupiah(t.totalTagihan)}</strong>
                        <div>
                          <span className={`status-badge ${t.status === "unpaid" ? "neutral" : "warning"}`}>
                            {t.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
            {tagihanAktifRows.length > 0 ? (
              <Link className="button button-primary" href="/santri/pembayaran/tagihan">
                Bayar sekarang
              </Link>
            ) : (
              <Link className="button button-secondary" href="/santri/pembayaran/riwayat">
                Lihat riwayat pembayaran
              </Link>
            )}
          </div>
        </Panel>

        <Panel title="Pengumuman" subtitle="Untuk santri & wali">
          <AnnouncementList
            items={pengumuman.slice(0, 3).map((p) => ({
              icon: "megaphone" as const,
              title: p.judul,
              text: p.isi,
              date: tanggalIndo(p.createdAt),
            }))}
          />
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
