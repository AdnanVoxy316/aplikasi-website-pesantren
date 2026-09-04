"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import { ToastButton } from "@/components/toast-button";
import { EmptyState } from "@/components/ui/panel";

export type ActivityEntry = {
  id: string;
  action: string;
  filterText: string;
  meta: string;
  date: string;
};

export function ActivityLogList({ activities }: { activities: ActivityEntry[] }) {
  const [query, setQuery] = useState("");
  const visible = activities.filter((activity) =>
    activity.filterText.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Cari aksi atau pengguna"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="select-control" aria-label="Filter entitas">
            <option>Semua entitas</option>
            <option>Nilai</option>
            <option>Akun</option>
            <option>Pembayaran</option>
            <option>Tugas</option>
          </select>
        </div>
      </div>
      <div className="activity-list" id="activityTable">
        {visible.map((activity) => (
          <article className="activity-item" key={activity.id}>
            <span className="activity-marker" />
            <div>
              <div className="activity-action">{activity.action}</div>
              <div className="activity-meta">{activity.meta}</div>
            </div>
            <time className="activity-date">{activity.date}</time>
          </article>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState>Tidak ada aktivitas yang cocok dengan pencarian.</EmptyState>
      ) : null}
      <div className="pagination">
        <span>Menampilkan 5 dari 1.284 aktivitas</span>
        <div className="pagination-buttons">
          <ToastButton
            className="pagination-button active"
            message="Halaman 1 log aktivitas siap dibuka."
          >
            1
          </ToastButton>
          <ToastButton
            className="pagination-button"
            message="Halaman 2 log aktivitas siap dibuka."
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
