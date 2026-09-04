import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { listAnakWali } from "@/db/queries/santri";
import { db } from "@/db";
import { pembayaranSpp, tagihanSpp, santriProfile, user } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { rupiah, labelPeriode, tanggalWaktuIndo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Riwayat pembayaran anak",
  description: "Histori pembayaran SPP anak yang terhubung.",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  paid: "success",
  pending: "warning",
  processing: "warning",
  unpaid: "neutral",
  cancelled: "danger",
  expired: "danger",
  failed: "danger",
  refunded: "neutral",
};

export default async function WaliRiwayatPage() {
  const session = await requireRole("wali");
  const anakRows = await listAnakWali(session.user.id);

  if (anakRows.length === 0) {
    return (
      <>
        <PageHeading kicker="Keuangan" title="Riwayat pembayaran anak" />
        <Panel title="Belum ada anak terhubung">
          <EmptyState>Akun wali Anda belum dihubungkan dengan santri mana pun.</EmptyState>
        </Panel>
      </>
    );
  }

  const rows = await db
    .select({
      id: pembayaranSpp.id,
      santriNama: user.name,
      periodeBulan: tagihanSpp.periodeBulan,
      periodeTahun: tagihanSpp.periodeTahun,
      nomorTagihan: tagihanSpp.nomorTagihan,
      provider: pembayaranSpp.provider,
      paymentMethod: pembayaranSpp.paymentMethod,
      nominalDibayar: pembayaranSpp.nominalDibayar,
      status: pembayaranSpp.status,
      paidAt: pembayaranSpp.paidAt,
      createdAt: pembayaranSpp.createdAt,
    })
    .from(pembayaranSpp)
    .innerJoin(tagihanSpp, eq(pembayaranSpp.tagihanSppId, tagihanSpp.id))
    .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .where(
      inArray(
        tagihanSpp.santriId,
        anakRows.map((a) => a.santriId),
      ),
    )
    .orderBy(desc(pembayaranSpp.createdAt))
    .limit(100);

  return (
    <>
      <PageHeading
        kicker="Keuangan"
        title="Riwayat pembayaran anak"
        description="Pembayaran online via Mayar dan catatan manual dari admin."
      />
      <Panel title="Histori transaksi" subtitle={`${rows.length} transaksi`}>
        {rows.length === 0 ? (
          <EmptyState>Belum ada transaksi pembayaran.</EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Anak</th>
                  <th>Periode</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.santriNama}</strong>
                      <div style={{ fontFamily: "monospace", fontSize: 9 }}>{row.nomorTagihan}</div>
                    </td>
                    <td>{labelPeriode(row.periodeBulan, row.periodeTahun)}</td>
                    <td>
                      {row.provider === "manual" ? "manual" : row.paymentMethod ?? row.provider}
                    </td>
                    <td>{rupiah(row.nominalDibayar)}</td>
                    <td>
                      <span className={`status-badge ${STATUS_VARIANT[row.status] ?? "neutral"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{tanggalWaktuIndo(row.paidAt ?? row.createdAt)}</td>
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
