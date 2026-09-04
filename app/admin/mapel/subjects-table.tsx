"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { Panel } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type SubjectRow = {
  id: string;
  code: string;
  icon: IconName;
  name: string;
  filterText: string;
  category: { variant: BadgeVariant; label: string };
  description: string;
  weight: string;
  classes: string;
  status: string;
};

export function SubjectsTable({ subjects }: { subjects: SubjectRow[] }) {
  const [query, setQuery] = useState("");
  const visible = subjects.filter((subject) =>
    subject.filterText.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Panel
      title="Daftar mata pelajaran"
      subtitle="Mapel dikonfigurasi untuk tahun ajaran aktif"
      actions={
        <div className="toolbar-right">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari mapel"
              aria-label="Cari mapel"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="select-control" aria-label="Filter kategori">
            <option>Semua kategori</option>
            <option>Pesantren</option>
            <option>Umum</option>
          </select>
        </div>
      }
    >
      <div className="table-shell">
        <table className="data-table" id="subjectTable">
          <thead>
            <tr>
              <th>Mata pelajaran</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Bobot nilai</th>
              <th>Kelas</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((subject) => (
              <tr key={subject.id}>
                <td>
                  <div className="person-cell">
                    <span className="course-icon">
                      <Icon name={subject.icon} />
                    </span>
                    <div>
                      <span className="person-name">{subject.name}</span>
                      <span className="person-meta">Kode: {subject.code}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <StatusBadge variant={subject.category.variant}>
                    {subject.category.label}
                  </StatusBadge>
                </td>
                <td>{subject.description}</td>
                <td>{subject.weight}</td>
                <td>{subject.classes}</td>
                <td>
                  <span className="status-badge success">
                    {subject.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <ToastButton
                      className="table-action"
                      message="Form edit mapel siap dibuka."
                      ariaLabel="Edit mapel"
                    >
                      <Icon name="edit" />
                    </ToastButton>
                    <ToastButton
                      className="table-action danger"
                      message="Konfirmasi hapus mapel siap dibuka."
                      ariaLabel="Hapus mapel"
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
        <EmptyState>Tidak ada mapel yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 4 dari 27 mapel</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar mapel siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar mapel siap dibuka."
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
    </Panel>
  );
}
