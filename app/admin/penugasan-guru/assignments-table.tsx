"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type AssignmentRow = {
  id: string;
  initials: string;
  tone?: "blue" | "gold" | "coral";
  name: string;
  meta: string;
  className: string;
  subject: string;
  meetings: string;
};

export function AssignmentsTable({ assignments }: { assignments: AssignmentRow[] }) {
  const [query, setQuery] = useState("");
  const visible = assignments.filter((assignment) =>
    assignment.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari guru atau kelas"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="select-control" aria-label="Filter mapel">
            <option>Semua mapel</option>
            <option>Tahfidz Qur&apos;an</option>
            <option>Matematika</option>
          </select>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table" id="assignmentTable">
          <thead>
            <tr>
              <th>Guru</th>
              <th>Kelas</th>
              <th>Mapel</th>
              <th>Pertemuan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <div className="person-cell">
                    <span
                      className={
                        assignment.tone
                          ? `avatar-sm ${assignment.tone}`
                          : "avatar-sm"
                      }
                    >
                      {assignment.initials}
                    </span>
                    <div>
                      <span className="person-name">{assignment.name}</span>
                      <span className="person-meta">{assignment.meta}</span>
                    </div>
                  </div>
                </td>
                <td>{assignment.className}</td>
                <td>{assignment.subject}</td>
                <td>{assignment.meetings}</td>
                <td>
                  <StatusBadge variant="success">Aktif</StatusBadge>
                </td>
                <td>
                  <div className="table-actions">
                    <ToastButton
                      className="table-action"
                      message="Penugasan siap diedit."
                      ariaLabel="Edit penugasan"
                    >
                      <Icon name="edit" />
                    </ToastButton>
                    <ToastButton
                      className="table-action danger"
                      message="Penugasan siap dihapus."
                      ariaLabel="Hapus penugasan"
                    >
                      <Icon name="trash" />
                    </ToastButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada penugasan yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 3 dari 58 penugasan</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar penugasan siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar penugasan siap dibuka."
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
