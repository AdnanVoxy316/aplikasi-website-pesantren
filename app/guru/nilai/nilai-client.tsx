"use client";

import { useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { simpanNilaiMassalForm } from "@/actions/forms";

export type SantriNilaiRow = {
  id: string;
  nama: string;
  nis: string;
};

export type JenisRow = { id: string; nama: string; bobot: number };

export function NilaiGridClient({
  kelasId,
  mapelId,
  tahunAjaranId,
  semester,
  santri,
  jenisNilai,
  existing,
}: {
  kelasId: string;
  mapelId: string;
  tahunAjaranId: string;
  semester: "ganjil" | "genap";
  santri: SantriNilaiRow[];
  jenisNilai: JenisRow[];
  existing: Record<string, Record<string, number>>;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("kelasId", kelasId);
        fd.set("mapelId", mapelId);
        fd.set("tahunAjaranId", tahunAjaranId);
        fd.set("semester", semester);
        startTransition(async () => {
          const result = await simpanNilaiMassalForm(fd);
          showToast(result.ok ? result.message ?? "Nilai tersimpan." : result.error ?? "Gagal.");
        });
      }}
    >
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Santri</th>
              {jenisNilai.map((j) => (
                <th key={j.id}>
                  {j.nama}
                  <div className="table-column-note">bobot {j.bobot}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {santri.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.nama}</strong>
                  <div className="person-meta">NIS {s.nis}</div>
                </td>
                {jenisNilai.map((j) => (
                  <td key={j.id}>
                    <input
                      className="grade-input"
                      name={`nilai__${s.id}__${j.id}`}
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      defaultValue={existing[s.id]?.[j.id] ?? ""}
                      aria-label={`Nilai ${j.nama} untuk ${s.nama}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {santri.length === 0 ? (
          <p className="panel-subtitle empty-table-note">
            Kelas ini belum memiliki santri.
          </p>
        ) : null}
      </div>
      <div className="form-actions form-actions-inset">
        <button className="button button-outline-primary" type="submit" disabled={pending || santri.length === 0}>
          {pending ? "Menyimpan..." : "Simpan semua nilai"}
        </button>
      </div>
    </form>
  );
}
