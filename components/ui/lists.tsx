import type { ReactNode } from "react";
import { Icon, type IconName } from "@/lib/icons";

export type AnnouncementItem = {
  icon: IconName;
  title: string;
  text: string;
  date: string;
};

export function AnnouncementList({ items }: { items: AnnouncementItem[] }) {
  return (
    <div className="announcement-list">
      {items.map((item) => (
        <article className="announcement" key={item.title}>
          <span className="announcement-icon">
            <Icon name={item.icon} />
          </span>
          <div>
            <div className="announcement-title">{item.title}</div>
            <div className="announcement-text">{item.text}</div>
          </div>
          <time className="announcement-date">{item.date}</time>
        </article>
      ))}
    </div>
  );
}

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <div className="check-list">
      {items.map((item, index) => (
        <div className="check-row" key={index}>
          <Icon name="check-circle" />
          {item}
        </div>
      ))}
    </div>
  );
}

export function ProgressRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="progress-row">
      <span>{label}</span>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}
