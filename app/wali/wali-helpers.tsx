import "server-only";
import Link from "next/link";
import { listAnakWali } from "@/db/queries/santri";
import { Icon } from "@/lib/icons";

export type AnakRow = {
  santriId: string;
  nama: string;
  nis: string;
  kelasNama: string | null;
};

export async function getAnakUntukWali(
  waliUserId: string,
  santriIdParam?: string,
): Promise<{ anakRows: AnakRow[]; selected: AnakRow | null }> {
  const anakRows = await listAnakWali(waliUserId);
  if (anakRows.length === 0) return { anakRows, selected: null };
  const selected =
    anakRows.find((a) => a.santriId === santriIdParam) ?? anakRows[0];
  return { anakRows, selected: selected ?? null };
}

export function AnakSwitcher({
  anakRows,
  selectedId,
  basePath,
}: {
  anakRows: AnakRow[];
  selectedId: string;
  basePath: string;
}) {
  if (anakRows.length <= 1) return null;
  return (
    <div className="anak-switcher" role="tablist" aria-label="Pilih anak">
      <span className="anak-switcher-label">
        <Icon name="users" />
        Pilih anak
      </span>
      {anakRows.map((anak) => {
        const active = anak.santriId === selectedId;
        return (
          <Link
            key={anak.santriId}
            href={`${basePath}?anak=${anak.santriId}`}
            className={`anak-chip${active ? " active" : ""}`}
            aria-current={active ? "true" : undefined}
          >
            {anak.nama}
            <small>NIS {anak.nis}</small>
          </Link>
        );
      })}
    </div>
  );
}
