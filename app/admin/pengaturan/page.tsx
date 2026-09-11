import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { EmailAdminPanel } from "@/components/admin/email-admin-panel";
import { GoogleAccountPanel } from "@/components/admin/google-account-panel";
import { getPesantrenSettings, listTahunAjaran, listJenisNilai } from "@/db/queries/admin";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { PengaturanClient } from "./pengaturan-client";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Pengaturan situs, tahun ajaran, dan jenis nilai pesantren.",
};

export default async function AdminPengaturanPage() {
  const session = await requireRole("admin");
  const [settingsRow, taRows, jenisRows] = await Promise.all([
    getPesantrenSettings(),
    listTahunAjaran(),
    listJenisNilai(),
  ]);

  const [adminRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  const [googleRow] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, session.user.id), eq(account.providerId, "google")))
    .limit(1);
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return (
    <>
      <PageHeading
        kicker="Layanan pesantren"
        title="Pengaturan"
        description="Identitas pesantren, tahun ajaran aktif, dan konfigurasi penilaian."
      />
      <PengaturanClient
        settings={
          settingsRow
            ? {
                namaPesantren: settingsRow.settings.namaPesantren,
                alamat: settingsRow.settings.alamat,
                deskripsi: settingsRow.settings.deskripsi,
                logoUrl: settingsRow.settings.logoUrl,
                namaPimpinan: settingsRow.settings.namaPimpinan,
                kotaRapor: settingsRow.settings.kotaRapor,
                semesterAktif: settingsRow.settings.semesterAktif,
              }
            : null
        }
        taRows={taRows.map((t) => ({
          id: t.id,
          label: t.label,
          isActive: t.isActive,
          tanggalMulai: t.tanggalMulai,
          tanggalSelesai: t.tanggalSelesai,
        }))}
        jenisRows={jenisRows.map((j) => ({ id: j.id, nama: j.nama, bobot: j.bobot }))}
      />

      <div className="form-layout" style={{ marginTop: 16 }}>
        <Panel
          title="Email admin"
          subtitle="Diubah dengan verifikasi kode OTP ke email baru"
          bodyClassName="panel-body"
        >
          <EmailAdminPanel emailSekarang={adminRow?.email ?? null} />
        </Panel>

        <Panel
          title="Akun Google"
          subtitle="Masuk tanpa kata sandi — bisa dilepas kapan saja"
          bodyClassName="panel-body"
        >
          <GoogleAccountPanel terhubung={Boolean(googleRow)} terkonfigurasi={googleConfigured} />
        </Panel>
      </div>
    </>
  );
}
