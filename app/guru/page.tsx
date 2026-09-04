import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState, PageFooter } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth/session";
import { getGuruProfile, getGuruDashboardStats, listTugasGuru } from "@/db/queries/guru";
import { tanggalIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard guru",
  description: "Kelas yang diampu, tugas aktif, dan submission menunggu dinilai.",
};

export default async function GuruDashboardPage() {
  const session = await requireRole("guru");
  const guru = await getGuruProfile(session.user.id);

  if (!guru) {
    return (
      <>
        <PageHeading kicker="Workspace" title="Dashboard guru" />
        <Panel title="Profil guru belum ada">
          <EmptyState>
            Profil guru untuk akun Anda belum dibuat admin. Hubungi admin pesantren.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const [stats, tugasRows] = await Promise.all([
    getGuruDashboardStats(guru.id),
    listTugasGuru(guru.id),
  ]);

  return (
    <>
      <PageHeading
        kicker="Workspace"
        title={`Assalamu'alaikum, ${session.user.name}`}
        description="Kelas yang diampu, tugas berjalan, dan submission yang perlu dinilai."
        actions={
          <Link className="button button-primary" href="/guru/tugas/baru">
            Buat tugas baru
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard icon="book" tone="icon-blue" label="Kelas diampu" value={String(stats.jumlahKelasDiampu)} note={`${stats.jumlahMapelDiampu} mapel`} />
        <StatCard icon="users" tone="icon-green" label="Santri diampu" value={String(stats.totalSantri)} note="Total seluruh kelas" />
        <StatCard icon="clipboard" tone="icon-gold" label="Tugas aktif" value={String(stats.tugasAktif)} note="Deadline belum lewat" />
        <StatCard icon="file" tone="icon-coral" label="Menunggu dinilai" value={String(stats.submissionMenunggu)} note="Submission dikumpulkan" />
      </div>

      <div className="form-layout">
        <Panel title="Kelas & mapel diampu" subtitle={`${stats.pengajaran.length} penugasan`}>
          {stats.pengajaran.length === 0 ? (
            <EmptyState>
              Belum ada penugasan mengajar. Admin harus menugaskan Anda lewat menu Penugasan Guru.
            </EmptyState>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kelas</th>
                    <th>Mapel</th>
                    <th>Santri</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pengajaran.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.kelasNama}</strong>
                      </td>
                      <td>{p.mapelNama}</td>
                      <td>{p.jumlahSantri}</td>
                      <td>
                        <div className="table-actions">
                          <Link className="table-action" href={`/guru/nilai?pengajaranId=${p.id}`} title="Input nilai">
                            nilai
                          </Link>
                          <Link className="table-action" href={`/guru/kehadiran?pengajaranId=${p.id}`} title="Input kehadiran">
                            kehadiran
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Tugas saya" subtitle={`${tugasRows.length} tugas dibuat`}>
          {tugasRows.length === 0 ? (
            <EmptyState>Belum ada tugas. Buat tugas pertama untuk santri Anda.</EmptyState>
          ) : (
            <div className="announcement-list">
              {tugasRows.slice(0, 5).map((t) => {
                return (
                  <article className="announcement" key={t.id}>
                    <span className="announcement-icon">
                      <Icon name="clipboard" />
                    </span>
                    <div>
                      <div className="announcement-title">{t.judul}</div>
                      <div className="announcement-text">
                        {t.kelasNama} · {t.mapelNama} · {t.totalSubmission}/{t.totalSantri} submission
                        {t.totalDinilai > 0 ? ` · ${t.totalDinilai} dinilai` : ""}
                      </div>
                    </div>
                    <time className="announcement-date">{tanggalIndo(t.deadline)}</time>
                  </article>
                );
              })}
            </div>
          )}
          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
            <Link className="button button-secondary" href="/guru/tugas">
              Lihat semua tugas
            </Link>
          </div>
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
