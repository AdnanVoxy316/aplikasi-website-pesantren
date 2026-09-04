import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { getRekapKehadiranPerKelas } from "@/db/queries/admin";
import { persenHadir } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rekap kehadiran",
  description: "Rekap kehadiran santri per kelas.",
};

export default async function AdminKehadiranPage() {
  const rows = await getRekapKehadiranPerKelas();
  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Nilai & kehadiran"
        description="Rekap kehadiran per kelas. Input detail dilakukan oleh guru pengampu."
      />
      <Panel title="Rekap kehadiran per kelas" subtitle="Akumulasi seluruh catatan guru">
        {rows.length === 0 ? (
          <EmptyState>
            Belum ada data kehadiran. Guru mencatat kehadiran dari menu Kehadiran mereka.
          </EmptyState>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Hadir</th>
                  <th>Izin</th>
                  <th>Sakit</th>
                  <th>Alpa</th>
                  <th>Total</th>
                  <th>% Hadir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.kelas_nama}>
                    <td>
                      <strong>{row.kelas_nama}</strong>
                    </td>
                    <td>{row.hadir}</td>
                    <td>{row.izin}</td>
                    <td>{row.sakit}</td>
                    <td>{row.alpa}</td>
                    <td>{row.total}</td>
                    <td>
                      <strong>{persenHadir(row.hadir, row.total)}%</strong>
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
