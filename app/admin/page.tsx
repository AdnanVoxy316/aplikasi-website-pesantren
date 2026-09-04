import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { AnnouncementList } from "@/components/ui/lists";
import { PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { AdminTaskList, type AdminTask } from "@/app/admin/admin-task-list";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Dashboard ELMS Pesantren untuk mengelola aktivitas akademik, tugas, kehadiran, rapor, dan pembayaran SPP.",
};

const TASKS: AdminTask[] = [
  {
    id: "hafalan-juz-amma",
    name: "Setoran hafalan Juz Amma",
    meta: "Tahfidz · Ibtida A",
    icon: "book",
    dueDate: "12 Feb 2026",
    dueNote: "2 hari lagi",
    submissions: "18 / 28",
    submissionsLabel: "submission",
    badge: { variant: "warning", label: "Segera berakhir" },
    filter: "soon",
  },
  {
    id: "kitab-talim",
    name: "Ringkasan Kitab Ta'lim Muta'allim",
    meta: "Kitab Kuning · Tsanawiyah 1",
    icon: "file",
    dueDate: "15 Feb 2026",
    dueNote: "5 hari lagi",
    submissions: "31 / 31",
    submissionsLabel: "submission",
    badge: { variant: "neutral", label: "12 perlu dinilai" },
    filter: "review",
  },
  {
    id: "persamaan-linear",
    name: "Latihan persamaan linear",
    meta: "Matematika · Ulya B",
    icon: "chart",
    dueDate: "18 Feb 2026",
    dueNote: "8 hari lagi",
    submissions: "24 / 30",
    submissionsLabel: "submission",
    badge: { variant: "success", label: "Berjalan" },
    filter: "all",
  },
  {
    id: "tilawah-ibtida-b",
    name: "Praktik membaca Al-Qur'an",
    meta: "Tilawah · Ibtida B",
    icon: "book",
    dueDate: "20 Feb 2026",
    dueNote: "10 hari lagi",
    submissions: "22 / 25",
    submissionsLabel: "submission",
    badge: { variant: "neutral", label: "5 perlu dinilai" },
    filter: "review",
  },
];

const CHART = [
  { label: "Sen", height: 81, title: "Senin 92,4%" },
  { label: "Sel", height: 90, title: "Selasa 95,8%" },
  { label: "Rab", height: 86, title: "Rabu 94,1%" },
  { label: "Kam", height: 96, title: "Kamis 97,2%" },
  { label: "Jum", height: 88, title: "Jumat 94,6%" },
  { label: "Sab", height: 77, title: "Sabtu 91,8%" },
  { label: "Ini", height: 93, title: "Hari ini 96,4%", today: true },
];

const ANNOUNCEMENTS = [
  {
    icon: "megaphone" as const,
    title: "Jadwal ujian tengah semester",
    text: "Ujian akan dilaksanakan pada 2-7 Maret 2026. Mohon wali kelas memperbarui jadwal.",
    date: "Hari ini",
  },
  {
    icon: "calendar" as const,
    title: "Libur Isra Mi'raj",
    text: "Kegiatan belajar diliburkan pada 16 Februari. Kegiatan kembali normal keesokan harinya.",
    date: "Kemarin",
  },
  {
    icon: "shield" as const,
    title: "Pembaruan keamanan akun",
    text: "Seluruh pengguna diminta memperbarui kata sandi secara berkala untuk keamanan bersama.",
    date: "3 hari lalu",
  },
];

const QUICK_ACTIONS = [
  {
    icon: "user" as const,
    title: "Tambah akun santri",
    note: "Daftarkan santri baru",
    toast: "Form akun santri siap digunakan.",
  },
  {
    icon: "book" as const,
    title: "Buat kelas & mapel",
    note: "Atur struktur akademik",
    toast: "Form kelas dan mapel siap digunakan.",
  },
  {
    icon: "users" as const,
    title: "Assign guru",
    note: "Hubungkan kelas dan mapel",
    toast: "Form penugasan guru siap digunakan.",
  },
  {
    icon: "file" as const,
    title: "Generate rapor",
    note: "Buat snapshot semester",
    toast: "Generator rapor siap digunakan.",
  },
];

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeading
        kicker="Ringkasan pesantren"
        title="Selamat datang, Ustadz Ahmad."
        description="Pantau aktivitas akademik dan operasional pesantren dalam satu ruang yang tertata."
        actions={
          <>
            <ToastButton className="button button-secondary" message="Kalender akademik siap dibuka.">
              <Icon name="calendar" />
              Kalender
            </ToastButton>
            <ToastButton className="button button-primary" message="Form pengumuman baru siap digunakan.">
              <Icon name="plus" />
              Pengumuman baru
            </ToastButton>
          </>
        }
      />

      <section className="welcome-card" aria-labelledby="welcomeTitle">
        <div className="welcome-copy">
          <span className="welcome-label">
            <Icon name="sparkle" />
            Ruang kerja administrator
          </span>
          <h2 className="welcome-title" id="welcomeTitle">
            Menata ilmu, menjaga amanah, menguatkan langkah.
          </h2>
          <p className="welcome-text">
            Hari ini ada 24 tugas aktif dan 86 tagihan SPP yang perlu dipantau.
            Terima kasih telah menjaga ritme belajar santri.
          </p>
          <div className="welcome-actions">
            <ToastButton className="button button-primary" message="Menu tugas dibuka pada prototype.">
              Kelola tugas <Icon name="chevron-right" />
            </ToastButton>
            <ToastButton className="button button-secondary" message="Ringkasan rapor siap dibuka.">
              Lihat rapor
            </ToastButton>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <svg viewBox="0 0 230 195" fill="none">
            <circle cx="117" cy="89" r="69" stroke="#bdd58e" strokeOpacity=".3" />
            <circle cx="117" cy="89" r="51" stroke="#bdd58e" strokeOpacity=".18" />
            <path d="M74 155V88c0-24 19-43 43-43s43 19 43 43v67" fill="#2b8062" fillOpacity=".55" stroke="#cfe3ae" strokeOpacity=".65" strokeWidth="1.5" />
            <path d="M86 155V91c0-17 14-31 31-31s31 14 31 31v64" fill="#0d5d4b" stroke="#d8e8b8" strokeOpacity=".4" />
            <path d="M104 155v-38a13 13 0 0 1 26 0v38" fill="#bad284" fillOpacity=".75" />
            <path d="M117 28v17M108 37h18" stroke="#d9e99a" strokeWidth="2" strokeLinecap="round" />
            <path d="M54 155h127M44 164h147" stroke="#bcd18d" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
            <path d="M49 155c6-7 12-9 18-6M173 155c-6-7-12-9-18-6" stroke="#a8c87e" strokeWidth="2" strokeLinecap="round" />
            <circle cx="39" cy="45" r="3" fill="#d9e99a" />
            <circle cx="190" cy="67" r="2" fill="#d9e99a" fillOpacity=".8" />
            <circle cx="183" cy="25" r="1.5" fill="#d9e99a" fillOpacity=".7" />
          </svg>
        </div>
      </section>

      <section className="stats-grid" aria-label="Statistik utama">
        <StatCard icon="users" tone="icon-green" label="Total santri" value="486" note="Dari 18 kelas aktif" change="8,4%" />
        <StatCard icon="user" tone="icon-blue" label="Guru & ustadz" value="32" note="29 aktif mengajar" change="4,1%" />
        <StatCard icon="book" tone="icon-gold" label="Kelas aktif" value="18" note="Ibtida hingga Ulya" change="2 kelas" />
        <StatCard icon="clipboard" tone="icon-coral" label="Tugas aktif" value="24" note="7 mendekati deadline" change="12%" />
        <StatCard icon="wallet" tone="icon-green" label="SPP periode ini" value="Rp 128,4 jt" note="Pembaruan terakhir hari ini" change="78% lunas" changeDirection="flat" />
      </section>

      <div className="dashboard-grid">
        <Panel
          id="tugas"
          title="Tugas dan submission"
          subtitle="Aktivitas tugas yang perlu perhatian"
          actions={
            <ToastButton className="text-link" message="Daftar seluruh tugas siap dibuka.">
              Lihat semua <Icon name="chevron-right" />
            </ToastButton>
          }
        >
          <AdminTaskList tasks={TASKS} />
        </Panel>

        <Panel
          className="attendance-panel"
          id="nilai"
          title="Kehadiran santri"
          subtitle="Rata-rata 7 hari terakhir"
          actions={
            <ToastButton className="text-link" message="Rekap kehadiran siap dibuka.">
              Lihat rekap <Icon name="chevron-right" />
            </ToastButton>
          }
        >
          <div className="attendance-summary">
            <div>
              <strong className="attendance-number">94,8%</strong>
              <span className="attendance-caption">Kehadiran rata-rata</span>
            </div>
            <span className="attendance-growth">
              <Icon name="arrow-up" />
              2,6% vs pekan lalu
            </span>
          </div>
          <div className="chart-wrap">
            <div className="chart" aria-label="Grafik kehadiran dari Senin sampai Minggu">
              {CHART.map((item) => (
                <div className="chart-column" key={item.label}>
                  <span
                    className={`chart-bar${item.today ? " today" : ""}`}
                    style={{ height: `${item.height}%` }}
                    title={item.title}
                  />
                  <span className="chart-label">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item"><i className="legend-dot legend-present" />Hadir 94,8%</span>
              <span className="legend-item"><i className="legend-dot legend-permit" />Izin / sakit 3,1%</span>
              <span className="legend-item"><i className="legend-dot legend-absent" />Alpa 2,1%</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel
          id="pembayaran"
          title="Pembayaran SPP"
          subtitle="Ringkasan periode Februari 2026"
          actions={
            <ToastButton className="text-link" message="Monitoring transaksi pembayaran siap dibuka.">
              Kelola pembayaran <Icon name="chevron-right" />
            </ToastButton>
          }
        >
          <div className="payment-content">
            <div className="payment-highlight">
              <div className="payment-ring" aria-label="78 persen pembayaran berhasil">
                <strong>78%</strong>
              </div>
              <div>
                <span className="payment-label">Total pembayaran berhasil</span>
                <strong className="payment-amount">Rp 128.400.000</strong>
                <span className="payment-note">Dari 486 tagihan · Terhubung dengan Mayar</span>
              </div>
            </div>
            <div className="payment-stats">
              <div className="payment-stat"><strong>378</strong><span>Sudah lunas</span></div>
              <div className="payment-stat"><strong>86</strong><span>Belum dibayar</span></div>
              <div className="payment-stat"><strong>22</strong><span>Menunggu pembayaran</span></div>
            </div>
          </div>
        </Panel>

        <Panel
          id="pengumuman"
          title="Pengumuman terbaru"
          subtitle="Informasi untuk warga pesantren"
          actions={
            <ToastButton className="text-link" message="Daftar pengumuman siap dibuka.">
              Lihat semua <Icon name="chevron-right" />
            </ToastButton>
          }
        >
          <AnnouncementList items={ANNOUNCEMENTS} />
        </Panel>
      </div>

      <Panel
        className="quick-panel"
        title="Akses cepat"
        subtitle="Selesaikan pekerjaan rutin lebih singkat"
      >
        <div className="quick-grid">
          {QUICK_ACTIONS.map((action) => (
            <ToastButton
              key={action.title}
              className="quick-action"
              message={action.toast}
            >
              <span className="quick-action-icon">
                <Icon name={action.icon} />
              </span>
              <span className="quick-action-copy">
                <span className="quick-action-title">{action.title}</span>
                <span className="quick-action-note">{action.note}</span>
              </span>
            </ToastButton>
          ))}
        </div>
      </Panel>

      <PageFooter />
    </>
  );
}
