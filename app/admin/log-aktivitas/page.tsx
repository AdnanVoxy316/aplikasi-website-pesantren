import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { listActivityLog } from "@/db/queries/admin";
import { tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Log aktivitas",
  description: "Audit trail perubahan data sensitif pesantren.",
};

export default async function AdminLogAktivitasPage() {
  const rows = await listActivityLog(150);
  return (
    <>
      <PageHeading
        kicker="Layanan pesantren"
        title="Log aktivitas"
        description="Jejak audit perubahan akun, nilai, tugas, dan pembayaran."
      />
      <Panel title="Aktivitas terakhir" subtitle={`${rows.length} entri`}>
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada aktivitas tercatat. Setiap perubahan sensitif (nilai, akun, file tugas,
            pembayaran) akan muncul di sini.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{tanggalWaktuIndo(row.createdAt)}</td>
                    <td>
                      <strong>{row.userNama ?? "Sistem"}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: 11 }}>{row.aksi}</code>
                    </td>
                    <td>{row.entitas}</td>
                    <td style={{ maxWidth: 320, overflowWrap: "anywhere" }}>
                      {row.detail ? JSON.stringify(row.detail) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
