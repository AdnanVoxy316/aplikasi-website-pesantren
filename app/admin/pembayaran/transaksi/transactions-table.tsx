"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type TransactionAction = {
  icon: IconName;
  toast: string;
  ariaLabel: string;
};

export type TransactionRow = {
  id: string;
  invoice: string;
  filterText: string;
  reference: string;
  name: string;
  meta: string;
  amount: string;
  method: string;
  webhook: string;
  status: { variant: BadgeVariant; label: string };
  action: TransactionAction;
};

export function TransactionsTable({
  transactions,
}: {
  transactions: TransactionRow[];
}) {
  const [query, setQuery] = useState("");
  const visible = transactions.filter((transaction) =>
    transaction.filterText.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari invoice atau santri"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="select-control" aria-label="Filter status transaksi">
            <option>Semua status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Failed</option>
            <option>Refunded</option>
          </select>
          <select className="select-control" aria-label="Filter bulan">
            <option>Februari 2026</option>
            <option>Januari 2026</option>
          </select>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table" id="transactionTable">
          <thead>
            <tr>
              <th>Invoice / provider ID</th>
              <th>Santri</th>
              <th>Nominal dibayar</th>
              <th>Metode</th>
              <th>Webhook terakhir</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <strong>{transaction.invoice}</strong>
                  <span className="person-meta">
                    <br />
                    {transaction.reference}
                  </span>
                </td>
                <td>
                  {transaction.name}
                  <br />
                  <span className="person-meta">{transaction.meta}</span>
                </td>
                <td>{transaction.amount}</td>
                <td>{transaction.method}</td>
                <td>{transaction.webhook}</td>
                <td>
                  <StatusBadge variant={transaction.status.variant}>
                    {transaction.status.label}
                  </StatusBadge>
                </td>
                <td>
                  <ToastButton
                    className="table-action"
                    message={transaction.action.toast}
                    ariaLabel={transaction.action.ariaLabel}
                  >
                    <Icon name={transaction.action.icon} />
                  </ToastButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada transaksi yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 4 dari 402 transaksi</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 daftar transaksi siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 daftar transaksi siap dibuka."
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
