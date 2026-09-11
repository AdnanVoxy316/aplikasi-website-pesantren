import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import AppShell from "@/components/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { getShellDataAnyRole } from "@/lib/shell-data";
import { db } from "@/db";
import {
  account,
  guruProfile,
  kelas,
  santriProfile,
  user,
  waliSantriProfile,
} from "@/db/schema";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { ProfilePhotoForm } from "@/components/shared/profile-photo-form";
import { GoogleAccountPanel } from "@/components/admin/google-account-panel";
import { tanggalIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Profil & pengaturan akun",
  description: "Informasi akun dan pengaturan keamanan.",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru / Ustadz(ah)",
  santri: "Santri",
  wali: "Wali Santri",
};

export default async function ProfilPage() {
  const shell = await getShellDataAnyRole();

  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
  const [googleRow] = googleConfigured
    ? await db
        .select({ id: account.id })
        .from(account)
        .where(and(eq(account.userId, shell.userId), eq(account.providerId, "google")))
        .limit(1)
    : [];

  const [detail] = await db
    .select({
      nip: guruProfile.nip,
      noTelp: guruProfile.noTelp,
      nis: santriProfile.nis,
      kelasNama: kelas.nama,
      tempatLahir: santriProfile.tempatLahir,
      tanggalLahir: santriProfile.tanggalLahir,
      alamat: santriProfile.alamat,
      waliTelp: waliSantriProfile.noTelp,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(guruProfile, eq(guruProfile.userId, user.id))
    .leftJoin(santriProfile, eq(santriProfile.userId, user.id))
    .leftJoin(kelas, eq(santriProfile.kelasId, kelas.id))
    .leftJoin(waliSantriProfile, eq(waliSantriProfile.userId, user.id))
    .where(eq(user.id, shell.userId))
    .limit(1);

  const rows: [string, string][] = [
    ["Nama", shell.user.name],
    ["Email", shell.user.email ?? "—"],
    ["Peran", ROLE_LABEL[shell.role] ?? shell.role],
    ["Bergabung", tanggalIndo(detail?.createdAt ?? null)],
  ];

  if (shell.role === "guru") {
    rows.push(["NIP", detail?.nip || "—"]);
    rows.push(["No. telepon", detail?.noTelp || "—"]);
  } else if (shell.role === "santri") {
    rows.push(["NIS", detail?.nis || "—"]);
    rows.push(["Kelas", detail?.kelasNama || "—"]);
    if (detail?.tempatLahir) rows.push(["Tempat lahir", detail.tempatLahir]);
    if (detail?.tanggalLahir) rows.push(["Tanggal lahir", detail.tanggalLahir]);
    if (detail?.alamat) rows.push(["Alamat", detail.alamat]);
  } else if (shell.role === "wali") {
    rows.push(["No. telepon", detail?.waliTelp || "—"]);
  }

  return (
    <AppShell
      role={shell.role}
      user={shell.user}
      notifications={shell.notifications}
      tahunAjaranLabel={shell.tahunAjaranLabel}
      semesterLabel={shell.semesterLabel}
      brandLogo={shell.brandLogo}
    >
      <PageHeading
        kicker="Akun"
        title="Profil & pengaturan akun"
        description="Kelola informasi akun dan keamanan Anda dari satu tempat."
      />

      <div className="form-layout profile-layout">
        <Panel title="Informasi akun" subtitle="Data dikelola oleh admin pesantren">
          <div className="table-shell profile-table-shell">
            <table className="data-table profile-info-table">
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label}>
                    <td>
                      <strong>{label}</strong>
                    </td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Foto profil"
          subtitle="Ganti foto tampilan akun Anda di sini"
          bodyClassName="panel-body"
        >
          <ProfilePhotoForm
            name={shell.user.name}
            initials={shell.user.initials}
            image={shell.user.image ?? null}
          />
        </Panel>

        <Panel
          title="Keamanan akun"
          subtitle="Ubah kata sandi Anda secara berkala"
          bodyClassName="panel-body"
        >
          <ChangePasswordForm />
        </Panel>

        {googleConfigured && shell.role !== "admin" ? (
          <Panel
            title="Akun Google"
            subtitle="Masuk tanpa kata sandi — bisa dilepas kapan saja"
            bodyClassName="panel-body"
          >
            <GoogleAccountPanel
              terhubung={Boolean(googleRow)}
              terkonfigurasi={googleConfigured}
              kembali="/profil"
            />
          </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}
