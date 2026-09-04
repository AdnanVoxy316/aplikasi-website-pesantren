"use client";

import { useState } from "react";
import { Tabs } from "@/components/tabs";
import { EmptyState } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { Icon, type IconName } from "@/lib/icons";

export type AdminTask = {
  id: string;
  name: string;
  meta: string;
  icon: IconName;
  dueDate: string;
  dueNote: string;
  submissions: string;
  submissionsLabel: string;
  badge: { variant: BadgeVariant; label: string };
  filter: "soon" | "review" | "all";
};

const TABS = [
  { id: "all", label: "Semua tugas" },
  { id: "review", label: "Perlu dinilai" },
  { id: "soon", label: "Deadline dekat" },
];

export function AdminTaskList({ tasks }: { tasks: AdminTask[] }) {
  const [active, setActive] = useState("all");
  const visible = tasks.filter(
    (task) => active === "all" || task.filter === active,
  );
  return (
    <>
      <Tabs tabs={TABS} active={active} onChange={setActive} ariaLabel="Filter tugas" />
      <div className="task-list">
        {visible.map((task) => (
          <article className="task-row" key={task.id}>
            <div className="task-main">
              <span className="task-mark">
                <Icon name={task.icon} />
              </span>
              <div>
                <div className="task-name">{task.name}</div>
                <div className="task-meta">{task.meta}</div>
              </div>
            </div>
            <div className="task-cell">
              <strong>{task.dueDate}</strong>
              <span>{task.dueNote}</span>
            </div>
            <div className="task-cell">
              <strong>{task.submissions}</strong>
              <span>{task.submissionsLabel}</span>
            </div>
            <StatusBadge variant={task.badge.variant}>{task.badge.label}</StatusBadge>
            <ToastButton
              className="row-action"
              message={`Detail tugas ${task.name}.`}
              ariaLabel={`Lihat ${task.name}`}
            >
              <Icon name="more" />
            </ToastButton>
          </article>
        ))}
        {visible.length === 0 ? (
          <EmptyState>Tidak ada tugas pada filter ini.</EmptyState>
        ) : null}
      </div>
    </>
  );
}
