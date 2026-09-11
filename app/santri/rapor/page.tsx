import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { SantriRaporActions } from "@/components/shared/rapor-pdf-button";
import { requireRole } from "@/lib/auth/session";
import { getSantriProfile, listRaporSantri } from "@/db/queries/santri";
import { tanggalWaktuIndo } from "@/lib/format";
import { Icon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Rapor",
  description: "Rapor snapshot per semester.",
};

type RingkasanNilai = {
  mapelId: string;
  nama: string;
  kategori: string;
  nilaiAkhir: number | null;
};

type RingkasanKehadiran = {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
};

function parseSnapshot<T>(
  raw: string,
  isValid: (value: unknown) => value is T,
  fallback: T,
): { value: T; valid: boolean } {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? { value: parsed, valid: true } : { value: fallback, valid: false };
  } catch {
    return { value: fallback, valid: false };
  }
}

function isRingkasanNilai(value: unknown): value is RingkasanNilai[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const row = item as Partial<RingkasanNilai>;
      return typeof row.mapelId === "string" && typeof row.nama === "string";
    })
  );
}

function isRingkasanKehadiran(value: unknown): value is RingkasanKehadiran {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<RingkasanKehadiran>;
  return [row.hadir, row.izin, row.sakit, row.alpa, row.total].every(
    (item) => typeof item === "number" && Number.isFinite(item),
  );
}

export default async function SantriRaporPage() {
  const session = await requireRole("santri");
  const profile = await getSantriProfile(session.user.id);

  if (!profile) {
    return (
      <Panel title="Profil belum ada">
        <EmptyState>Profil santri belum dibuat admin.</EmptyState>
      </Panel>
    );
  }

  const rows = await listRaporSantri(profile.id);

  return (
    <>
      <PageHeading
        kicker="Belajar"
        title="Rapor"
        description="Snapshot nilai & kehadiran saat rapor digenerate — tidak berubah walau data mentah diedit."
      />
      {rows.length === 0 ? (
        <Panel title="Belum ada rapor">
          <EmptyState>
            Rapor belum digenerate. Rapor tersedia setelah guru/wali kelas menerbitkannya akhir
            semester.
          </EmptyState>
        </Panel>
      ) : (
        rows.map((row) => {
          const nilaiSnapshot = parseSnapshot(row.ringkasanNilai, isRingkasanNilai, []);
          const kehadiranSnapshot = parseSnapshot(row.ringkasanKehadiran, isRingkasanKehadiran, {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpa: 0,
            total: 0,
          });
          const nilai = nilaiSnapshot.value;
          const kehadiran = kehadiranSnapshot.value;
          return (
            <Panel
              key={row.id}
              title={`Rapor ${row.tahunAjaranLabel} — Semester ${row.semester === "ganjil" ? "Ganjil" : "Genap"}`}
              subtitle={`Digenerate ${tanggalWaktuIndo(row.generatedAt)}`}
              actions={<SantriRaporActions raporId={row.id} />}
            >
                <div className="form-layout">
                {nilaiSnapshot.valid ? (
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mapel</th>
                        <th>Nilai akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilai.map((n) => (
                        <tr key={n.mapelId}>
                          <td>
                            <strong>{n.nama}</strong>
                          </td>
                          <td>{n.nilaiAkhir ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : null}
                <div>
                  {kehadiranSnapshot.valid ? (
                    <div className="check-list">
                      <div className="check-row">Hadir: {kehadiran.hadir}</div>
                      <div className="check-row">Izin: {kehadiran.izin}</div>
                      <div className="check-row">Sakit: {kehadiran.sakit}</div>
                      <div className="check-row">Alpa: {kehadiran.alpa}</div>
                    </div>
                  ) : null}
                  {!nilaiSnapshot.valid || !kehadiranSnapshot.valid ? (
                    <div className="notice error report-note-spacing">
                      <Icon name="alert" />
                      <div>
                        <strong>Data rapor perlu diperiksa</strong>
                        <span>Ringkasan yang tersimpan tidak lengkap. Hubungi admin pesantren.</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {row.catatan ? (
                <div className="rapor-catatan">
                  <div className="notice">
                    <strong>Catatan wali kelas</strong>
                    {row.catatan}
                  </div>
                </div>
              ) : null}
            </Panel>
          );
        })
      )}
    </>
  );
}
