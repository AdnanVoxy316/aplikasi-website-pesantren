"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { generateRaporForm } from "@/actions/forms";

export type KelasGroup = {
  id: string;
  nama: string;
  santri: { id: string; nama: string; nis: string }[];
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

export function GenerateRaporClient({
  kelasGroups,
  tahunAjaranId,
  tahunAjaranLabel,
  semesterAktif,
}: {
  kelasGroups: KelasGroup[];
  tahunAjaranId: string;
  tahunAjaranLabel: string;
  semesterAktif: "ganjil" | "genap";
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [kelasId, setKelasId] = useState(kelasGroups[0]?.id ?? "");
  const kelasAktif = kelasGroups.find((k) => k.id === kelasId);

  return (
    <section className="panel form-card">
      <h2 className="form-card-title">Generate rapor</h2>
      <p className="form-card-description">
        Snapshot nilai + kehadiran saat digenerate. Rapor yang sudah ada akan diperbarui, bukan
        diduplikat.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const fd = new FormData(form);
          startTransition(async () => {
            const result = await generateRaporForm(fd);
            showToast(result.ok ? result.message ?? "Rapor digenerate." : result.error ?? "Gagal.");
            if (result.ok) form.reset();
          });
        }}
      >
        <input type="hidden" name="tahunAjaranId" value={tahunAjaranId} />
        <input type="hidden" name="semester" value={semesterAktif} />
        <div className="form-grid">
          <div className="field">
            <label htmlFor="r-kelas">Kelas</label>
            <select
              id="r-kelas"
              name="kelasId"
              value={kelasId}
              onChange={(event) => setKelasId(event.target.value)}
              required
              style={inputStyle}
            >
              {kelasGroups.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="r-santri">Santri</label>
            <select id="r-santri" name="santriId" required style={inputStyle}>
              {(kelasAktif?.santri ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} · NIS {s.nis}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="r-catatan">
              Catatan wali kelas <span className="optional">(opsional)</span>
            </label>
            <textarea id="r-catatan" name="catatanWaliKelas" style={{ ...inputStyle, minHeight: 70 }} />
          </div>
        </div>
        <p className="panel-subtitle">
          Tahun ajaran {tahunAjaranLabel} · semester {semesterAktif}
        </p>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={pending || !tahunAjaranId}>
            {pending ? "Mengenerate..." : "Generate rapor"}
          </button>
        </div>
      </form>
    </section>
  );
}
