"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type AccountAction = {
  icon: IconName;
  toast: string;
  ariaLabel?: string;
  danger?: boolean;
};

export type AccountRow = {
  id: string;
  initials: string;
  tone?: "blue" | "gold" | "coral";
  name: string;
  filterText: string;
  meta: string;
  role: string;
  email: string;
  status: { variant: BadgeVariant; label: string };
  activity: string;
  actions: AccountAction[];
};

export function AccountsTable({ accounts }: { accounts: AccountRow[] }) {
  const [query, setQuery] = useState("");
  const visible = accounts.filter((account) =>
    account.filterText.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari nama, email, atau NIS"
              aria-label="Cari akun"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="select-control" aria-label="Filter role">
            <option>Semua role</option>
            <option>Admin</option>
            <option>Guru</option>
            <option>Santri</option>
            <option>Wali santri</option>
          </select>
        </div>
        <div className="toolbar-right">
          <ToastButton
            className="button button-secondary"
            message="Filter lanjutan siap digunakan."
          >
            <Icon name="filter" />
            Filter
          </ToastButton>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table" id="accountTable">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Role</th>
              <th>Kontak</th>
              <th>Status</th>
              <th>Aktivitas terakhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((account) => (
              <tr key={account.id}>
                <td>
                  <div className="person-cell">
                    <span
                      className={
                        account.tone
                          ? `avatar-sm ${account.tone}`
                          : "avatar-sm"
                      }
                    >
                      {account.initials}
                    </span>
                    <div>
                      <span className="person-name">{account.name}</span>
                      <span className="person-meta">{account.meta}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="status-badge neutral">{account.role}</span>
                </td>
                <td>{account.email}</td>
                <td>
                  <StatusBadge variant={account.status.variant}>
                    {account.status.label}
                  </StatusBadge>
                </td>
                <td>{account.activity}</td>
                <td>
                  <div className="table-actions">
                    {account.actions.map((action) => (
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
        <EmptyState>Tidak ada akun yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 1-5 dari 567 akun</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar akun siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar akun siap dibuka."
          >
            2
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 3 daftar akun siap dibuka."
          >
            3
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
