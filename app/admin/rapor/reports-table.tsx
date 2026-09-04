"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type ReportRow = {
  id: string;
  initials: string;
  tone?: "blue" | "gold" | "coral";
  name: string;
  filterText: string;
  meta: string;
  className: string;
  score: string;
  scoreMid?: boolean;
  attendance: string;
  published: string;
  status: { variant: BadgeVariant; label: string };
  action: { icon: IconName; toast: string; ariaLabel: string };
};

export function ReportsTable({ reports }: { reports: ReportRow[] }) {
  const [query, setQuery] = useState("");
  const visible = reports.filter((report) =>
    report.filterText.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari nama atau NIS"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="select-control" aria-label="Filter kelas">
            <option>Semua kelas</option>
            <option>Ibtida A</option>
            <option>Tsanawiyah 1</option>
            <option>Ulya B</option>
          </select>
          <select className="select-control" aria-label="Filter status">
            <option>Semua status</option>
            <option>Sudah terbit</option>
            <option>Menunggu</option>
          </select>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table" id="reportTable">
          <thead>
            <tr>
              <th>Santri</th>
              <th>Kelas</th>
              <th>Rata-rata nilai</th>
              <th>Kehadiran</th>
              <th>Terbit pada</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((report) => (
              <tr key={report.id}>
                <td>
                  <div className="person-cell">
                    <span
                      className={
                        report.tone ? `avatar-sm ${report.tone}` : "avatar-sm"
                      }
                    >
                      {report.initials}
                    </span>
                    <div>
                      <span className="person-name">{report.name}</span>
                      <span className="person-meta">{report.meta}</span>
                    </div>
                  </div>
                </td>
                <td>{report.className}</td>
                <td>
                  <span
                    className={report.scoreMid ? "grade-score mid" : "grade-score"}
                  >
                    {report.score}
                  </span>
                </td>
                <td>{report.attendance}</td>
                <td>{report.published}</td>
                <td>
                  <StatusBadge variant={report.status.variant}>
                    {report.status.label}
                  </StatusBadge>
                </td>
                <td>
                  <ToastButton
                    className="table-action"
                    message={report.action.toast}
                    ariaLabel={report.action.ariaLabel}
                  >
                    <Icon name={report.action.icon} />
                  </ToastButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada rapor yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 4 dari 486 santri</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar rapor siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar rapor siap dibuka."
          >
            2
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman berikutnya siap dibuka."
            ariaLabel="Halaman berikutnya"
          >
            <Icon name="chevron-right" />
          </ToastButton>
        </div>
      </div>
    </>
  );
}
