"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { createTugasForm } from "@/actions/forms";

export type PengajaranOption = {
  id: string;
  label: string;
  kelasId: string;
  mapelId: string;
  tahunAjaranId: string;
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function TugasBaruClient({ pengajaranOptions }: { pengajaranOptions: PengajaranOption[] }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<PengajaranOption | null>(
    pengajaranOptions[0] ?? null,
  );

  if (pengajaranOptions.length === 0) {
    return (
      <p className="panel-subtitle">
        Anda belum ditugaskan ke kelas/mapel. Hubungi admin untuk penugasan.
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        if (selected) {
          fd.set("kelasId", selected.kelasId);
          fd.set("mapelId", selected.mapelId);
          fd.set("tahunAjaranId", selected.tahunAjaranId);
        }
        startTransition(async () => {
          const result = await createTugasForm(fd);
          showToast(result.ok ? result.message ?? "Tugas dibuat." : result.error ?? "Gagal.");
          if (result.ok) form.reset();
        });
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="t-judul">Judul tugas</label>
          <input id="t-judul" name="judul" required placeholder="misal Setoran hafalan Juz Amma" style={inputStyle} />
        </div>
        <div className="field">
          <label htmlFor="t-pengajaran">Kelas & mapel tujuan</label>
          <select
            id="t-pengajaran"
            value={selected?.id ?? ""}
            onChange={(event) =>
              setSelected(pengajaranOptions.find((p) => p.id === event.target.value) ?? null)
            }
            style={inputStyle}
          >
            {pengajaranOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="t-deskripsi">Deskripsi / instruksi</label>
          <textarea id="t-deskripsi" name="deskripsi" required style={{ ...inputStyle, minHeight: 95 }} />
        </div>
        <div className="field">
          <label htmlFor="t-deadline">Deadline</label>
          <input id="t-deadline" name="deadline" type="datetime-local" required style={inputStyle} />
        </div>
      </div>
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Terbitkan tugas"}
        </button>
      </div>
    </form>
  );
}
