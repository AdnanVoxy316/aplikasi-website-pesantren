"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/lib/icons";

export type AttendanceStatus = "present" | "permit" | "sick" | "absent";

export type AttendanceChoice = {
  value: AttendanceStatus;
  label: string;
  className?: string;
};

export type AttendanceRow = {
  id: string;
  no: string;
  initials: string;
  tone?: "gold" | "blue" | "coral";
  name: string;
  nis: string;
  status: AttendanceStatus;
  note?: string;
  recap: string;
  choices: AttendanceChoice[];
};

export function AttendancePanel({ rows }: { rows: AttendanceRow[] }) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.status] as const)),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.note ?? ""] as const)),
  );
  return (
    <Panel
      title="Presensi pertemuan"
      subtitle="Senin, 09 Februari 2026 · Tahfidz Qur'an"
      actions={
        <div className="toolbar-right">
          <select className="select-control">
            <option>Ibtida A</option>
            <option>Tsanawiyah 1</option>
            <option>Ulya A</option>
          </select>
          <input
            className="date-input"
            type="date"
            defaultValue="2026-02-09"
            aria-label="Tanggal presensi"
          />
        </div>
      }
    >
      <div className="panel-body-tight">
        <div className="attendance-legend">
          <span>
            <i className="attendance-dot present" />
            Hadir
          </span>
          <span>
            <i className="attendance-dot permit" />
            Izin
          </span>
          <span>
            <i className="attendance-dot sick" />
            Sakit
          </span>
          <span>
            <i className="attendance-dot absent" />
            Alpa
          </span>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table attendance-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Santri</th>
              <th>Status kehadiran</th>
              <th>Catatan</th>
              <th>Rekap</th>
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
                  <div className="attendance-options">
                    {row.choices.map((choice) => (
                      <label key={choice.value}>
                        <input
                          type="radio"
                          name={row.id}
                          checked={statuses[row.id] === choice.value}
                          onChange={() =>
                            setStatuses((prev) => ({ ...prev, [row.id]: choice.value }))
                          }
                        />
                        <span
                          className={
                            choice.className
                              ? `attendance-choice ${choice.className}`
                              : "attendance-choice"
                          }
                        >
                          {choice.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </td>
                <td>
                  <input
                    className="table-input"
                    placeholder="Catatan opsional"
                    aria-label={`Catatan ${row.name}`}
                    value={notes[row.id] ?? ""}
                    onChange={(event) =>
                      setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))
                    }
                  />
                </td>
                <td>{row.recap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>Menampilkan 3 dari 28 santri</span>
        <div className="pagination-buttons">
          <button className="pagination-button active" type="button">
            1
          </button>
          <button className="pagination-button" type="button">
            2
          </button>
          <button className="pagination-button" type="button">
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>
    </Panel>
  );
}
