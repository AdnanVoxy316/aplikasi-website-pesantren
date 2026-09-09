"use client";

import { useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { simpanKehadiranForm } from "@/actions/forms";

export type SantriRow = { id: string; nama: string; nis: string };

const STATUS_OPTIONS = ["hadir", "izin", "sakit", "alpa"] as const;

const STATUS_VARIANT: Record<string, string> = {
  hadir: "success",
  izin: "warning",
  sakit: "warning",
  alpa: "danger",
};

export function KehadiranClient({
  kelasId,
  mapelId,
  tahunAjaranId,
  tanggal,
  santri,
  existing,
}: {
  kelasId: string;
  mapelId: string;
  tahunAjaranId: string;
  tanggal: string;
  santri: SantriRow[];
  existing: Record<string, string>;
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
        fd.set("tanggal", tanggal);
        startTransition(async () => {
          const result = await simpanKehadiranForm(fd);
          showToast(result.ok ? result.message ?? "Kehadiran tersimpan." : result.error ?? "Gagal.");
        });
      }}
    >
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Santri</th>
              <th>Status kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {santri.map((s) => {
              const current = existing[s.id] ?? "hadir";
              return (
                <tr key={s.id}>
                  <td>
                    <strong>{s.nama}</strong>
                    <div className="person-meta">NIS {s.nis}</div>
                  </td>
                  <td>
                    <div className="attendance-value">
                      <select
                        name={`status__${s.id}`}
                        defaultValue={current}
                        aria-label={`Kehadiran ${s.nama}`}
                        className="status-select"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <span className={`status-badge ${STATUS_VARIANT[current] ?? "neutral"}`}>
                        {current}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {santri.length === 0 ? (
          <p className="panel-subtitle empty-table-note">
            Kelas ini belum memiliki santri.
          </p>
        ) : null}
      </div>
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={pending || santri.length === 0}>
          {pending ? "Menyimpan..." : "Simpan kehadiran"}
        </button>
      </div>
    </form>
  );
}
