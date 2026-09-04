import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { AnnouncementList } from "@/components/ui/lists";
import { ProgressRow } from "@/components/ui/lists";
import {
  getAdminStats,
  listAllPengumumanAdmin,
  listNilaiCountByMapel,
  getRekapKehadiranPerKelas,
} from "@/db/queries/admin";
import { rupiah, tanggalIndo, persenHadir } from "@/lib/format";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Dashboard ELMS Pesantren dengan data akademik dan pembayaran real-time.",
};

export default async function AdminDashboardPage() {
  const [stats, pengumuman, nilaiMapel, kehadiranKelas] = await Promise.all([
    getAdminStats(),
    listAllPengumumanAdmin(),
    listNilaiCountByMapel(),
    getRekapKehadiranPerKelas(),
  ]);

  const maxKehadiran = Math.max(...kehadiranKelas.map((k) => k.total), 1);

  return (
    <>
      <PageHeading
        kicker="Overview"
        title="Beranda"
        description="Ringkasan operasional akademik, tugas, kehadiran, rapor, dan pembayaran SPP."
        actions={
          <Link className="button button-primary" href="/admin/akun">
            Kelola akun pengguna
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard
          icon="users"
          tone="icon-green"
          label="Total santri"
          value={String(stats.totalSantri)}
          note="Santri terdaftar aktif"
        />
        <StatCard
          icon="users"
          tone="icon-blue"
          label="Total guru"
          value={String(stats.totalGuru)}
          note="Guru / ustadz(ah) terdaftar"
        />
        <StatCard
          icon="book"
          tone="icon-gold"
          label="Total kelas"
          value={String(stats.totalKelas)}
          note="Kelas pada tahun ajaran aktif"
        />
        <StatCard
          icon="clipboard"
          tone="icon-coral"
          label="Tugas aktif"
          value={String(stats.tugasAktif)}
          note="Deadline belum terlewati"
        />
      </div>

      <div className="form-layout">
        <Panel
          title="Kehadiran per kelas"
          subtitle="Rekap status kehadiran seluruh waktu"
        >
          {kehadiranKelas.length === 0 ? (
            <p className="panel-subtitle">Belum ada data kehadiran.</p>
          ) : (
            <div>
              {kehadiranKelas.map((k) => (
                <ProgressRow
                  key={k.kelas_nama}
                  label={`${k.kelas_nama} · hadir ${k.hadir}/${k.total}`}
                  value={`${persenHadir(k.hadir, k.total)}%`}
                  percent={Math.round((k.total === 0 ? 0 : k.hadir / maxKehadiran) * 100)}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Nilai tercatat per mapel" subtitle="Rata-rata nilai seluruh santri">
          {nilaiMapel.length === 0 ? (
            <p className="panel-subtitle">Belum ada nilai yang diinput guru.</p>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mapel</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {nilaiMapel.map((m) => (
                    <tr key={m.mapelNama}>
                      <td>
                        <strong>{m.mapelNama}</strong>
                      </td>
                      <td>{m.kategori}</td>
                      <td>{m.jumlahNilai}</td>
                      <td>{m.rataRata}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="form-layout">
        <Panel title="Pembayaran SPP" subtitle="Ringkasan tagihan tahun ajaran berjalan">
          <div className="stats-grid">
            <StatCard
              icon="wallet"
              tone="icon-green"
              label="Sudah lunas"
              value={String(stats.tagihanLunas.jumlah)}
              note={rupiah(stats.tagihanLunas.total)}
            />
            <StatCard
              icon="wallet"
              tone="icon-coral"
              label="Belum dibayar"
              value={String(stats.tagihanBelumBayar.jumlah)}
              note={rupiah(stats.tagihanBelumBayar.total)}
            />
          </div>
          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
            <Link className="button button-secondary" href="/admin/pembayaran">
              Buka dashboard pembayaran
            </Link>
          </div>
        </Panel>

        <Panel
          title="Pengumuman terbaru"
          subtitle={`${pengumuman.length} pengumuman`}
        >
          <AnnouncementList
            items={pengumuman.slice(0, 4).map((p) => ({
              icon: "megaphone" as const,
              title: p.judul,
              text: p.targetKelasNama
                ? `${p.isi} · target kelas ${p.targetKelasNama}`
                : `${p.isi} · target ${p.targetRole}`,
              date: tanggalIndo(p.createdAt),
            }))}
          />
        </Panel>
      </div>

      <PageFooter />
    </>
  );
}
