"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { Icon } from "@/lib/icons";

export type TaskAction =
  | { kind: "view"; ariaLabel: string }
  | { kind: "edit"; message: string; ariaLabel: string }
  | { kind: "export"; message: string; ariaLabel: string };

export type TaskRow = {
  id: string;
  title: string;
  created: string;
  mapel: string;
  kelas: string;
  deadline: string;
  deadlineNote: string;
  submissions: string;
  badge: { variant: BadgeVariant; label: string };
  action: TaskAction;
};

export function TaskTable({ tasks, total }: { tasks: TaskRow[]; total: number }) {
  const [query, setQuery] = useState("");
  const visible = tasks.filter((task) =>
    task.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari judul tugas"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada tugas yang cocok dengan pencarian.</EmptyState>
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Judul tugas</th>
                <th>Mapel / kelas</th>
                <th>Deadline</th>
                <th>Submission</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                    <span className="person-meta">{task.created}</span>
                  </td>
                  <td>
                    {task.mapel}
                    <br />
                    <span className="person-meta">{task.kelas}</span>
                  </td>
                  <td>
                    {task.deadline}
                    <br />
                    <span className="person-meta">{task.deadlineNote}</span>
                  </td>
                  <td>{task.submissions}</td>
                  <td>
                    <StatusBadge variant={task.badge.variant}>{task.badge.label}</StatusBadge>
                  </td>
                  <td>
                    <div className="table-actions">
                      {task.action.kind === "view" ? (
                        <Link
                          className="table-action"
                          href="/guru/tugas/submission"
                          aria-label={task.action.ariaLabel}
                        >
                          <Icon name="eye" />
                        </Link>
                      ) : (
                        <ToastButton
                          className="table-action"
                          message={task.action.message}
                          ariaLabel={task.action.ariaLabel}
                        >
                          <Icon name={task.action.kind === "edit" ? "edit" : "download"} />
                        </ToastButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span>
          Menampilkan {visible.length} dari {total} tugas
        </span>
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
    </>
  );
}
