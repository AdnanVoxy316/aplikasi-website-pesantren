"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type RelationAction = {
  icon: IconName;
  toast: string;
  ariaLabel: string;
  danger?: boolean;
};

export type GuardianRelationRow = {
  id: string;
  initials: string;
  tone?: "blue" | "gold" | "coral";
  name: string;
  email: string;
  students: string[];
  classes: string[];
  relation: string;
  status: { variant: BadgeVariant; label: string };
  actions: RelationAction[];
};

export function GuardianRelationsTable({
  relations,
}: {
  relations: GuardianRelationRow[];
}) {
  const [query, setQuery] = useState("");
  const visible = relations.filter((relation) =>
    `${relation.name} ${relation.email}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari wali atau santri"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table" id="guardianTable">
          <thead>
            <tr>
              <th>Wali santri</th>
              <th>Santri yang terhubung</th>
              <th>Kelas</th>
              <th>Hubungan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((relation) => (
              <tr key={relation.id}>
                <td>
                  <div className="person-cell">
                    <span
                      className={
                        relation.tone
                          ? `avatar-sm ${relation.tone}`
                          : "avatar-sm"
                      }
                    >
                      {relation.initials}
                    </span>
                    <div>
                      <span className="person-name">{relation.name}</span>
                      <span className="person-meta">{relation.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{relation.students[0]}</strong>
                  {relation.students.slice(1).map((student) => (
                    <span className="person-meta" key={student}>
                      <br />
                      {student}
                    </span>
                  ))}
                </td>
                <td>
                  {relation.classes.map((kelas, index) =>
                    index === 0 ? (
                      kelas
                    ) : (
                      <span className="person-meta" key={kelas}>
                        <br />
                        {kelas}
                      </span>
                    ),
                  )}
                </td>
                <td>{relation.relation}</td>
                <td>
                  <StatusBadge variant={relation.status.variant}>
                    {relation.status.label}
                  </StatusBadge>
                </td>
                <td>
                  <div className="table-actions">
                    {relation.actions.map((action) => (
                      <ToastButton
                        key={action.icon}
                        className={
                          action.danger
                            ? "table-action danger"
                            : "table-action"
                        }
                        message={action.toast}
                        ariaLabel={action.ariaLabel}
                      >
                        <Icon name={action.icon} />
                      </ToastButton>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada relasi yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 3 dari 489 relasi</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar relasi siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar relasi siap dibuka."
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
