"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { Panel, PanelToolbar, EmptyState } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { santriTaskBadges, type SantriTask } from "./tasks";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "belum", label: "Belum dikumpulkan" },
  { value: "dikumpulkan", label: "Sudah dikumpulkan" },
  { value: "dinilai", label: "Sudah dinilai" },
];

const SUBJECT_OPTIONS = [
  { value: "all", label: "Semua mapel" },
  { value: "Tahfidz Qur'an", label: "Tahfidz Qur'an" },
  { value: "Kitab Kuning", label: "Kitab Kuning" },
  { value: "Matematika", label: "Matematika" },
];

export function SantriTaskTable({ tasks }: { tasks: SantriTask[] }) {
  const [status, setStatus] = useState("all");
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");

  const visible = tasks.filter((task) => {
    const statusMatch = status === "all" || task.status === status;
    const subjectMatch = subject === "all" || task.subject === subject;
    const queryMatch =
      query.trim() === "" ||
      task.title.toLowerCase().includes(query.trim().toLowerCase());
    return statusMatch && subjectMatch && queryMatch;
  });

  return (
    <Panel
      title="Daftar tugas"
      subtitle="Tugas dari seluruh mapel kelas Ibtida A"
      actions={
        <div className="toolbar-right">
          <select
            className="select-control"
            aria-label="Filter status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="select-control"
            aria-label="Filter mapel"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <PanelToolbar
        left={
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari tugas"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        }
      />
      {visible.length === 0 ? (
        <EmptyState>Tidak ada tugas yang sesuai filter.</EmptyState>
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tugas</th>
                <th>Mapel</th>
                <th>Deadline</th>
                <th>Submission</th>
                <th>Nilai</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => {
                const badge = santriTaskBadges[task.status];
                return (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                      <span className="person-meta">{task.teacher}</span>
                    </td>
                    <td>{task.subject}</td>
                    <td>
                      <strong>{task.dueDate}</strong>
                      <br />
                      <span className="person-meta">{task.dueNote}</span>
                    </td>
                    <td>
                      <StatusBadge variant={badge.variant}>
                        {badge.label}
                      </StatusBadge>
                    </td>
                    <td>
                      {task.status === "dinilai" ? (
                        <span className="grade-score">{task.grade}</span>
                      ) : (
                        task.grade
                      )}
                    </td>
                    <td>
                      <Link
                        className={`button ${
                          task.actionPrimary
                            ? "button-primary"
                            : "button-secondary"
                        } table-button`}
                        href={`/santri/tugas/${task.id}`}
                      >
                        {task.actionLabel}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span>Menampilkan 4 dari 27 tugas</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 sedang ditampilkan."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 tersedia pada versi aplikasi berikutnya."
          >
            2
          </ToastButton>
          <ToastButton
            className="pagination-button"
            ariaLabel="Halaman berikutnya"
            message="Navigasi halaman tersedia pada versi aplikasi berikutnya."
          >
            <Icon name="chevron-right" />
          </ToastButton>
        </div>
      </div>
    </Panel>
  );
}
