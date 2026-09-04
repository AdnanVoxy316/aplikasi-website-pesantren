import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/stat-card";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import {
  GuardianRelationsTable,
  type GuardianRelationRow,
} from "@/app/admin/wali-santri/guardian-relations-table";

export const metadata: Metadata = {
  title: "Relasi Wali Santri",
  description:
    "Pastikan setiap wali hanya dapat memantau santri yang terhubung dengannya.",
};

const RELATIONS: GuardianRelationRow[] = [
  {
    id: "rizal",
    initials: "RH",
    tone: "coral",
    name: "Rizal Hidayat",
    email: "rizal.hidayat@email.id",
    students: ["Aisyah Fitria", "Maya Salsabila"],
    classes: ["Ibtida A", "Tsanawiyah 1"],
    relation: "Ayah",
    status: { variant: "success", label: "Terverifikasi" },
    actions: [
      { icon: "eye", toast: "Relasi siap dilihat.", ariaLabel: "Lihat relasi" },
      { icon: "edit", toast: "Form relasi siap diedit.", ariaLabel: "Edit relasi" },
    ],
  },
  {
    id: "laila",
    initials: "LM",
    tone: "gold",
    name: "Laila Mardhiyah",
    email: "laila.mardhiyah@email.id",
    students: ["Fauzan Ramadhan"],
    classes: ["Tsanawiyah 2"],
    relation: "Ibu",
    status: { variant: "success", label: "Terverifikasi" },
    actions: [
      { icon: "eye", toast: "Relasi siap dilihat.", ariaLabel: "Lihat relasi" },
      { icon: "edit", toast: "Form relasi siap diedit.", ariaLabel: "Edit relasi" },
    ],
  },
  {
    id: "hana",
    initials: "HS",
    tone: "blue",
    name: "Hana Salsabila",
    email: "hana.salsabila@email.id",
    students: ["Ilham Akbar"],
    classes: ["Ulya A"],
    relation: "Wali",
    status: { variant: "warning", label: "Menunggu verifikasi" },
    actions: [
      {
        icon: "check-circle",
        toast: "Relasi siap diverifikasi.",
        ariaLabel: "Verifikasi relasi",
      },
      {
        icon: "trash",
        toast: "Relasi siap dihapus.",
        ariaLabel: "Hapus relasi",
        danger: true,
      },
    ],
  },
];

export default function AdminWaliSantriPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Hubungan keluarga"
        title="Relasi wali santri"
        description="Pastikan setiap wali hanya dapat memantau santri yang terhubung dengannya."
        actions={
          <ToastButton
            className="button button-primary"
            message="Form relasi wali santri siap digunakan."
          >
            <Icon name="plus" />
            Hubungkan akun
          </ToastButton>
        }
      />
      <section className="metric-grid">
        <MetricCard
          icon="users"
          label="Wali terhubung"
          value="217"
          note="Dari 219 akun wali"
        />
        <article className="metric-card">
          <span className="metric-icon blue">
            <Icon name="user" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Santri terpantau</span>
            <strong className="metric-value">486</strong>
            <span className="metric-note">Seluruh santri aktif</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon gold">
            <Icon name="link" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Relasi aktif</span>
            <strong className="metric-value">489</strong>
            <span className="metric-note">Beberapa wali punya 2 anak</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral">
            <Icon name="alert" />
          </span>
          <div className="metric-copy">
            <span className="metric-label">Perlu ditinjau</span>
            <strong className="metric-value">2</strong>
            <span className="metric-note">Akun belum punya relasi</span>
          </div>
        </article>
      </section>
      <div className="content-grid">
        <Panel
          title="Daftar relasi"
          subtitle="Akses wali dibatasi melalui hubungan ini"
        >
          <GuardianRelationsTable relations={RELATIONS} />
        </Panel>
        <aside className="panel">
          <div className="form-card">
            <h2 className="form-card-title">Hubungkan wali dan santri</h2>
            <p className="form-card-description">
              Satu akun wali dapat terhubung ke lebih dari satu santri.
            </p>
            <DemoForm
              success="Relasi wali dan santri berhasil disimpan."
              actions={
                <>
                  <button className="button button-secondary" type="reset">
                    Reset
                  </button>
                  <button className="button button-primary" type="submit">
                    Simpan relasi
                  </button>
                </>
              }
            >
              <div className="form-grid single">
                <div className="field">
                  <label htmlFor="guardian">Akun wali</label>
                  <select id="guardian" required defaultValue="">
                    <option value="">Pilih wali santri</option>
                    <option>Rizal Hidayat</option>
                    <option>Laila Mardhiyah</option>
                    <option>Hana Salsabila</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="student">Akun santri</label>
                  <select id="student" required defaultValue="">
                    <option value="">Pilih santri</option>
                    <option>Aisyah Fitria</option>
                    <option>Fauzan Ramadhan</option>
                    <option>Ilham Akbar</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="relation">Hubungan</label>
                  <select id="relation">
                    <option>Ayah</option>
                    <option>Ibu</option>
                    <option>Wali</option>
                  </select>
                </div>
              </div>
            </DemoForm>
          </div>
        </aside>
      </div>
      <PageFooter />
    </>
  );
}
