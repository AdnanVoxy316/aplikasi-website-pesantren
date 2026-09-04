import "server-only";
import { listAnakWali } from "@/db/queries/santri";

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
    <div className="panel-toolbar" style={{ padding: "0 0 14px" }}>
      <div className="toolbar-left">
        {anakRows.map((anak) => (
          <a
            key={anak.santriId}
            href={`${basePath}?anak=${anak.santriId}`}
            className="table-button"
            style={{
              marginRight: 6,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: anak.santriId === selectedId ? "var(--brand)" : "var(--surface)",
              color: anak.santriId === selectedId ? "#fff" : "inherit",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {anak.nama}
          </a>
        ))}
      </div>
    </div>
  );
}
