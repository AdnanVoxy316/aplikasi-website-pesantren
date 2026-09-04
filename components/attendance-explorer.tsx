"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/app-shell";
import { Icon } from "@/lib/icons";

type AttendanceStatus = "present" | "permit" | "sick" | "absent";

const LETTERS: Record<AttendanceStatus, string> = {
  present: "H",
  permit: "I",
  sick: "S",
  absent: "A",
};

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const STRIP_STATUSES: AttendanceStatus[] = [
  "present", "present", "present", "permit", "present", "present", "present",
  "present", "present", "present", "present", "sick", "present", "present",
  "present", "present", "present", "present", "present", "absent", "present",
  "present", "present", "present", "permit", "present", "present", "present",
  "present", "present", "present",
];

const MATRIX_STATUSES: AttendanceStatus[] = [
  "present", "present", "present", "present", "permit", "present", "present",
  "present", "present", "present", "sick", "present", "present", "present",
  "present", "present", "present", "present", "absent", "present", "present",
  "present", "permit", "present", "present", "present", "present", "present",
  "present", "present", "present",
];

const MONTHS = [
  { value: "2026-02", label: "Februari 2026" },
  { value: "2026-01", label: "Januari 2026" },
  { value: "2025-12", label: "Desember 2025" },
];

export type ExplorerVariant = "self" | "teacher" | "guardian";

function monthInfo(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return { year, monthNumber, dayCount: new Date(year, monthNumber, 0).getDate() };
}

function recapText(counts: Record<AttendanceStatus, number>): string {
  const parts = [
    counts.present ? `${counts.present} hadir` : "",
    counts.permit ? `${counts.permit} izin` : "",
    counts.sick ? `${counts.sick} sakit` : "",
    counts.absent ? `${counts.absent} alpa` : "",
  ].filter(Boolean);
  return parts.join(", ") || "Belum ada pertemuan";
}

const COPY: Record<
  ExplorerVariant,
  {
    title: string;
    overviewHeading: string;
    overviewSubject: string;
    matrixLead: string;
    statusRate: string;
  }
> = {
  self: {
    title: "Kehadiran lengkap saya",
    overviewHeading: "Kehadiran saya",
    overviewSubject: "Ibtida A",
    matrixLead: "Tanggal",
    statusRate: "97,2%",
  },
  teacher: {
    title: "Kehadiran lengkap kelas",
    overviewHeading: "Kehadiran santri",
    overviewSubject: "118 santri",
    matrixLead: "Santri / kelas",
    statusRate: "94,8%",
  },
  guardian: {
    title: "Kehadiran lengkap anak",
    overviewHeading: "Kehadiran anak",
    overviewSubject: "Aisyah Fitria",
    matrixLead: "Anak / kelas",
    statusRate: "97,2%",
  },
};

export function AttendanceExplorer({ variant }: { variant: ExplorerVariant }) {
  const showToast = useToast();
  const [month, setMonth] = useState("2026-02");
  const copy = COPY[variant];
  const monthLabel = MONTHS.find((item) => item.value === month)?.label ?? month;

  const stripDays = useMemo(() => {
    const { year, monthNumber, dayCount } = monthInfo(month);
    return Array.from({ length: dayCount }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, monthNumber - 1, day);
      return {
        day,
        dayName: DAY_NAMES[date.getDay()],
        weekend: date.getDay() === 0 || date.getDay() === 6,
        current: day === 9 && monthNumber === 2,
        status: STRIP_STATUSES[index % STRIP_STATUSES.length],
      };
    });
  }, [month]);

  const matrixRows = useMemo(() => {
    const { year, monthNumber, dayCount } = monthInfo(month);
    const people =
      variant === "teacher"
        ? [
            { name: "Aisyah Fitria", meta: "Ibtida A" },
            { name: "Fauzan Ramadhan", meta: "Tsanawiyah 1" },
          ]
        : variant === "guardian"
          ? [{ name: "Aisyah Fitria", meta: "Ibtida A" }]
          : [{ name: "Bulan terpilih", meta: monthLabel }];

    return people.map((person, rowIndex) => {
      const counts: Record<AttendanceStatus, number> = {
        present: 0, permit: 0, sick: 0, absent: 0,
      };
      const cells = Array.from({ length: dayCount }, (_, index) => {
        const day = index + 1;
        const date = new Date(year, monthNumber - 1, day);
        if (date.getDay() === 0) return { day, cell: null };
        const status = MATRIX_STATUSES[(index + rowIndex * 2) % MATRIX_STATUSES.length];
        counts[status] += 1;
        return { day, cell: status };
      });
      return { ...person, cells, recap: recapText(counts) };
    });
  }, [month, monthLabel, variant]);

  const exportCsv = () => {
    const header = [copy.matrixLead, ...stripDays.map((d) => `${d.dayName} ${String(d.day).padStart(2, "0")}`), "Rekap"];
    const rows = matrixRows.map((row) => [
      `${row.name} (${row.meta})`,
      ...row.cells.map((c) => (c.cell ? LETTERS[c.cell] : "-")),
      row.recap,
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((value) => `"${value}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rekap-kehadiran.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast("Rekap kehadiran berhasil diekspor untuk Excel.");
  };

  return (
    <section
      className="panel attendance-explorer is-open"
      aria-labelledby="attendanceExplorerTitle"
    >
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="attendanceExplorerTitle">{copy.title}</h2>
          <p className="panel-subtitle">Geser rentang tanggal untuk melihat catatan harian</p>
        </div>
        <span className="role-chip">{monthLabel}</span>
      </div>
      <div className="attendance-explorer-body">
        <div className="attendance-toolbar">
          <div className="toolbar-right">
            {variant === "guardian" ? (
              <select className="select-control" aria-label="Pilih anak">
                <option>Aisyah Fitria</option>
                <option>Maya Salsabila</option>
              </select>
            ) : null}
            <select
              className="select-control"
              aria-label="Pilih bulan"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            >
              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              className="button button-secondary attendance-excel-button"
              type="button"
              aria-label="Ekspor kehadiran ke Excel"
              onClick={exportCsv}
            >
              <Icon name="download" />
              Ekspor Excel
            </button>
          </div>
        </div>

        <div className="attendance-explorer-grid">
          <div>
            <div className="attendance-scroll">
              <div className="attendance-strip">
                {stripDays.map((item) => (
                  <div
                    key={item.day}
                    className={`attendance-day${item.weekend ? " weekend" : ""}${item.current ? " current" : ""}`}
                  >
                    <span>{String(item.day).padStart(2, "0")}</span>
                    <small>{item.dayName}</small>
                    <i className={`attendance-day-mark ${item.status}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="attendance-scroll-caption">
              <Icon name="chevron-right" />
              <span>
                Geser ke kanan untuk melihat seluruh hari pada <strong>{monthLabel}</strong>.
              </span>
            </div>
          </div>

          <div>
            <div className="attendance-overview-box">
              <div className="attendance-overview-heading">
                <strong>{copy.overviewHeading}</strong>
                <span>{copy.overviewSubject}</span>
              </div>
              <div className="attendance-status-list">
                <div className="attendance-status-line">
                  <i className="present" />
                  <span>Hadir</span>
                  <strong>{copy.statusRate}</strong>
                </div>
                <div className="attendance-status-line">
                  <i className="permit" />
                  <span>Izin</span>
                  <strong>1,8%</strong>
                </div>
                <div className="attendance-status-line">
                  <i className="sick" />
                  <span>Sakit</span>
                  <strong>1,3%</strong>
                </div>
                <div className="attendance-status-line">
                  <i className="absent" />
                  <span>Alpa</span>
                  <strong>{variant === "teacher" ? "2,1%" : "0%"}</strong>
                </div>
              </div>
            </div>
            <div className="attendance-scope" style={{ marginTop: 10 }}>
              {variant === "teacher" ? (
                <>
                  <strong>Kehadiran saya</strong>
                  <p>38 hadir mengajar dari 40 jadwal pada semester ini.</p>
                  <span className="status-badge success">95% hadir</span>
                </>
              ) : (
                <>
                  <strong>{variant === "guardian" ? "Akses wali santri" : "Data pribadi"}</strong>
                  <p>
                    {variant === "guardian"
                      ? "Hanya kehadiran anak yang terhubung dengan akun ini."
                      : "Hanya kamu yang dapat melihat rekap kehadiran ini."}
                  </p>
                  <span className="status-badge success">Data tersedia</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="attendance-matrix-wrap" style={{ marginTop: 20 }}>
          <table className="data-table attendance-matrix">
            <thead>
              <tr>
                <th>{copy.matrixLead}</th>
                {stripDays.map((item) => (
                  <th key={item.day}>
                    <span>{String(item.day).padStart(2, "0")}</span>
                    <small>{item.dayName}</small>
                  </th>
                ))}
                <th>Rekap</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <strong>{row.name}</strong>
                    <span className="person-meta">{row.meta}</span>
                  </td>
                  {row.cells.map((cell) =>
                    cell.cell ? (
                      <td key={cell.day}>
                        <span className={`attendance-cell ${cell.cell}`}>
                          {LETTERS[cell.cell]}
                        </span>
                      </td>
                    ) : (
                      <td key={cell.day}>-</td>
                    ),
                  )}
                  <td>{row.recap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="attendance-matrix-legend">
          <span><i className="present" />H Hadir</span>
          <span><i className="permit" />I Izin</span>
          <span><i className="sick" />S Sakit</span>
          <span><i className="absent" />A Alpa</span>
        </div>
      </div>
    </section>
  );
}
