"use client";

import { useState } from "react";

export type GradeRow = {
  id: string;
  no: string;
  initials: string;
  tone?: "gold" | "blue" | "coral";
  name: string;
  nis: string;
  score: string;
  predikat: string;
  predikatTone?: "mid" | "low";
  note: string;
  updated: string;
};

export function GradeTable({ rows }: { rows: GradeRow[] }) {
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.score] as const)),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.note] as const)),
  );
  return (
    <div className="table-shell">
      <table className="data-table grade-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Santri</th>
            <th>Nilai</th>
            <th>Predikat</th>
            <th>Catatan</th>
            <th>Terakhir diubah</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.no}</td>
              <td>
                <div className="person-cell">
                  <span className={row.tone ? `avatar-sm ${row.tone}` : "avatar-sm"}>
                    {row.initials}
                  </span>
                  <div>
                    <span className="person-name">{row.name}</span>
                    <span className="person-meta">{row.nis}</span>
                  </div>
                </div>
              </td>
              <td>
                <input
                  className="grade-input"
                  type="number"
                  min={0}
                  max={100}
                  value={scores[row.id] ?? ""}
                  aria-label={`Nilai ${row.name}`}
                  onChange={(event) =>
                    setScores((prev) => ({ ...prev, [row.id]: event.target.value }))
                  }
                />
              </td>
              <td>
                <span
                  className={
                    row.predikatTone ? `grade-score ${row.predikatTone}` : "grade-score"
                  }
                >
                  {row.predikat}
                </span>
              </td>
              <td>
                <input
                  className="table-input"
                  value={notes[row.id] ?? ""}
                  aria-label={`Catatan ${row.name}`}
                  onChange={(event) =>
                    setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))
                  }
                />
              </td>
              <td>{row.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
