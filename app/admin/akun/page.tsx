import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { ToastButton } from "@/components/toast-button";
import {
  AccountsTable,
  type AccountRow,
} from "@/app/admin/akun/accounts-table";

export const metadata: Metadata = {
  title: "Manajemen Akun",
  description:
    "Kelola akses admin, guru, santri, dan wali santri dari satu tempat.",
};

const ACCOUNTS: AccountRow[] = [
  {
    id: "adm-0001",
    initials: "AF",
    name: "Ahmad Fauzi",
    filterText: "Ahmad Fauzi admin administrator",
    meta: "ID ADM-0001",
    role: "Admin",
    email: "ahmad@alhikmah.sch.id",
    status: { variant: "success", label: "Aktif" },
    activity: "5 menit lalu",
    actions: [
      { icon: "eye", toast: "Profil Ahmad Fauzi siap dibuka.", ariaLabel: "Lihat akun" },
      { icon: "edit", toast: "Form edit akun siap dibuka.", ariaLabel: "Edit akun" },
    ],
  },
  {
    id: "guru-nur",
    initials: "NK",
    tone: "blue",
    name: "Nur Kholis",
    filterText: "Nur Kholis guru ustadz",
    meta: "NIP 19870214 001",
    role: "Guru",
    email: "nur.kholis@alhikmah.sch.id",
    status: { variant: "success", label: "Aktif" },
    activity: "Hari ini, 08:31",
    actions: [
      { icon: "eye", toast: "Profil Nur Kholis siap dibuka.", ariaLabel: "Lihat akun" },
      { icon: "edit", toast: "Form edit akun siap dibuka.", ariaLabel: "Edit akun" },
    ],
  },
  {
    id: "santri-aisyah",
    initials: "AF",
    tone: "gold",
    name: "Aisyah Fitria",
    filterText: "Aisyah Fitria santri 20260124",
    meta: "NIS 20260124 · Ibtida A",
    role: "Santri",
    email: "aisyah.fitria@santri.sch.id",
    status: { variant: "success", label: "Aktif" },
    activity: "Kemarin, 19:12",
    actions: [
      { icon: "eye", toast: "Profil Aisyah Fitria siap dibuka.", ariaLabel: "Lihat akun" },
      { icon: "edit", toast: "Form edit akun siap dibuka.", ariaLabel: "Edit akun" },
    ],
  },
  {
    id: "wali-rizal",
    initials: "RH",
    tone: "coral",
    name: "Rizal Hidayat",
    filterText: "Rizal Hidayat wali santri",
    meta: "Wali dari 2 santri",
    role: "Wali santri",
    email: "rizal.hidayat@email.id",
    status: { variant: "success", label: "Aktif" },
    activity: "Kemarin, 16:45",
    actions: [
      { icon: "eye", toast: "Profil Rizal Hidayat siap dibuka.", ariaLabel: "Lihat akun" },
      { icon: "edit", toast: "Form edit akun siap dibuka.", ariaLabel: "Edit akun" },
    ],
  },
  {
    id: "santri-maya",
    initials: "MS",
    name: "Maya Salsabila",
    filterText: "Maya Salsabila santri",
    meta: "NIS 20260147 · Tsanawiyah 1",
    role: "Santri",
    email: "maya.salsabila@santri.sch.id",
    status: { variant: "warning", label: "Menunggu aktivasi" },
    activity: "Belum pernah masuk",
    actions: [
      { icon: "external", toast: "Undangan aktivasi dikirim.", ariaLabel: "Kirim undangan" },
      {
        icon: "trash",
        toast: "Aksi nonaktifkan akun siap digunakan.",
        ariaLabel: "Nonaktifkan akun",
        danger: true,
      },
    ],
  },
];

export default function AdminAkunPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Administrasi pengguna"
        title="Akun pengguna"
        description="Kelola akses admin, guru, santri, dan wali santri dari satu tempat."
        actions={
          <>
            <ToastButton
              className="button button-secondary"
              message="Template CSV siap diunduh."
            >
              <Icon name="download" />
              Import CSV
            </ToastButton>
            <ToastButton
              className="button button-primary"
              message="Form akun baru siap digunakan."
            >
              <Icon name="plus" />
              Tambah akun
            </ToastButton>
          </>
        }
      />
      <section className="metric-grid" aria-label="Ringkasan akun">
        <MetricCard
          icon="users"
          label="Total akun aktif"
          value="567"
          note="+18 akun bulan ini"
        />
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="user" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Guru / ustadz</span>
            <strong className="metric-value">32</strong>
            <span className="metric-note">29 aktif mengajar</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="book" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Santri</span>
            <strong className="metric-value">486</strong>
            <span className="metric-note">18 kelas terdaftar</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="users" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Wali santri</span>
            <strong className="metric-value">217</strong>
            <span className="metric-note">Terhubung dengan anak</span>
          </div>
        </article>
      </section>
      <Panel
        title="Daftar akun"
        subtitle="567 akun terdaftar pada tahun ajaran aktif"
        actions={
          <span className="role-chip">
            <Icon name="shield" />
            RBAC aktif
          </span>
        }
      >
        <AccountsTable accounts={ACCOUNTS} />
      </Panel>
      <PageFooter />
    </>
  );
}
