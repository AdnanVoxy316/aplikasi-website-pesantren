"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type BillAction = {
  icon: IconName;
  toast: string;
  ariaLabel?: string;
};

export type BillRow = {
  id: string;
  initials: string;
  tone?: "blue" | "gold" | "coral";
  name: string;
  filterText: string;
  meta: string;
  number: string;
  period: string;
  amount: string;
  dueDate: string;
  status: { variant: BadgeVariant; label: string };
  action: BillAction;
};

export function BillsTable({ bills }: { bills: BillRow[] }) {
  const [query, setQuery] = useState("");
  const visible = bills.filter((bill) =>
    `${bill.filterText} ${bill.number}`
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
              placeholder="Cari santri atau nomor tagihan"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="toolbar-right">
          <ToastButton
            className="button button-secondary"
            message="Tagihan yang sudah ada akan dilewati, bukan dibuat duplikat."
          >
            <Icon name="refresh" />
            Uji idempotency
          </ToastButton>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table" id="billTable">
          <thead>
            <tr>
              <th>Santri</th>
              <th>Nomor tagihan</th>
              <th>Periode</th>
              <th>Snapshot nominal</th>
              <th>Jatuh tempo</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((bill) => (
              <tr key={bill.id}>
                <td>
                  <div className="person-cell">
                    <span
                      className={
                        bill.tone ? `avatar-sm ${bill.tone}` : "avatar-sm"
                      }
                    >
                      {bill.initials}
                    </span>
                    <div>
                      <span className="person-name">{bill.name}</span>
                      <span className="person-meta">{bill.meta}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{bill.number}</strong>
                </td>
                <td>{bill.period}</td>
                <td>{bill.amount}</td>
                <td>{bill.dueDate}</td>
                <td>
                  <StatusBadge variant={bill.status.variant}>
                    {bill.status.label}
                  </StatusBadge>
                </td>
                <td>
                  <ToastButton
                    className="table-action"
                    message={bill.action.toast}
                    ariaLabel={bill.action.ariaLabel}
                  >
                    <Icon name={bill.action.icon} />
                  </ToastButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada tagihan yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 4 dari 486 tagihan</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar tagihan siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar tagihan siap dibuka."
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
