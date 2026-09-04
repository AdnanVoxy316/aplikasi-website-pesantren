import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/lib/icons";
import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Dashboard Wali Santri",
  description: "Pantau perkembangan akademik, kehadiran, dan pembayaran anak dalam satu ruang.",
};

type Metric = {
  icon: IconName;
  tone?: "blue" | "gold" | "coral";
  label: string;
  value: string;
  note: string;
};

const METRICS: Metric[] = [
  { icon: "chart", label: "Rata-rata nilai", value: "88,4", note: "Naik 3,2 poin" },
  { icon: "users", tone: "blue", label: "Kehadiran", value: "97,2%", note: "24 hadir dari 25" },
  { icon: "clipboard", tone: "gold", label: "Tugas belum selesai", value: "4", note: "1 deadline 2 hari lagi" },
  { icon: "wallet", tone: "coral", label: "Tagihan aktif", value: "Rp 350 rb", note: "Jatuh tempo 10 Feb" },
];

const GRADE_ROWS = [
  { name: "Tahfidz Qur'an", meta: "Hafalan · 94", score: "Mumtaz", mid: false },
  { name: "Akhlak", meta: "Tugas · 88", score: "Jayyid", mid: false },
  { name: "Matematika", meta: "Ulangan · 84", score: "Jayyid", mid: true },
];

export default function WaliDashboardPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Pendampingan belajar"
        title="Assalamu'alaikum, Pak Rizal."
        description="Pantau perkembangan akademik, kehadiran, dan pembayaran anak dalam satu ruang."
        actions={
          <RoleChip icon="users">2 anak terhubung</RoleChip>
        }
      />

      <section className="child-switcher">
        <span className="avatar-sm gold">AF</span>
        <div className="child-switcher-copy">
          <span className="child-switcher-name">Aisyah Fitria</span>
          <span className="child-switcher-meta">NIS 20260124 · Ibtida A</span>
        </div>
        <select className="select-control" aria-label="Pilih anak">
          <option>Aisyah Fitria</option>
          <option>Maya Salsabila</option>
        </select>
      </section>

      <section className="metric-grid" style={{ marginTop: "15px" }} aria-label="Ringkasan anak">
        {METRICS.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-icon${metric.tone ? ` ${metric.tone}` : ""}`}>
              <Icon name={metric.icon} />
            </span>
            <div className="metric-copy">
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-note">{metric.note}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="content-grid">
        <Panel
          title="Perkembangan nilai"
          subtitle="Ringkasan semester ganjil Aisyah"
          bodyClassName="panel-body"
          actions={
            <Link className="text-link" href="/wali/nilai">
              Lihat nilai <Icon name="chevron-right" />
            </Link>
          }
        >
          <div className="score-overview">
            <div className="score-ring">
              <strong>88,4</strong>
            </div>
            <div>
              <div className="score-overview-title">Performa sangat baik</div>
              <div className="score-overview-text">Nilai tertinggi pada Tahfidz Qur&apos;an dan Bahasa Arab.</div>
            </div>
          </div>
          <div className="setting-list" style={{ marginTop: "9px" }}>
            {GRADE_ROWS.map((row) => (
              <div className="setting-row" key={row.name}>
                <div>
                  <div className="setting-name">{row.name}</div>
                  <div className="setting-description">{row.meta}</div>
                </div>
                <span className={row.mid ? "grade-score mid" : "grade-score"}>{row.score}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Kehadiran"
          subtitle="Semester Ganjil 2026 / 2027"
          bodyClassName="panel-body"
          actions={
            <Link className="text-link" href="/wali/kehadiran">
              Lihat rekap <Icon name="chevron-right" />
            </Link>
          }
        >
          <div className="progress-row">
            <span>Hadir</span>
            <strong>24 pertemuan</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "97%" }} />
          </div>
          <div className="progress-row" style={{ marginTop: "16px" }}>
            <span>Izin</span>
            <strong>1 pertemuan</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill gold" style={{ width: "4%" }} />
          </div>
          <div className="notice" style={{ marginTop: "19px" }}>
            <Icon name="check-circle" />
            <div>
              <strong>Kehadiran baik</strong>
              Belum ada catatan alpa untuk Aisyah.
            </div>
          </div>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel
          title="SPP Aisyah"
          subtitle="Tagihan Februari 2026"
          bodyClassName="panel-body"
          actions={
            <Link className="text-link" href="/wali/pembayaran/tagihan">
              Bayar sekarang <Icon name="chevron-right" />
            </Link>
          }
        >
          <div className="bill-row">
            <div>
              <div className="bill-period">SPP Reguler</div>
              <div className="bill-number">#BILL-0206 · Jatuh tempo 10 Feb</div>
            </div>
            <strong className="bill-amount">Rp 350.000</strong>
            <StatusBadge variant="warning">Belum dibayar</StatusBadge>
          </div>
        </Panel>

        <Panel
          title="Pengumuman untuk wali"
          subtitle="Informasi terbaru pesantren"
          bodyClassName="panel-body"
          actions={
            <Link className="text-link" href="/wali/pengumuman">
              Semua <Icon name="chevron-right" />
            </Link>
          }
        >
          <div className="announcement-text-block">
            <strong>Jadwal ujian tengah semester</strong>
            <span>Ujian dilaksanakan pada 2-7 Maret 2026. Mohon mendampingi persiapan anak.</span>
            <time>Hari ini</time>
          </div>
        </Panel>
      </div>

      <footer className="footer">
        <span className="footer-brand">
          <Icon name="mosque" />
          ELMS Pesantren · Prototype HTML
        </span>
        <span className="footer-note">Akses wali dibatasi pada anak yang terhubung</span>
      </footer>
    </>
  );
}
