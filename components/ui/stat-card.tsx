import { Icon, type IconName } from "@/lib/icons";

export type StatTone =
  | "icon-green"
  | "icon-blue"
  | "icon-gold"
  | "icon-coral";

export type StatCardProps = {
  icon: IconName;
  tone: StatTone;
  label: string;
  value: string;
  note: string;
  change?: string;
  changeDirection?: "up" | "down" | "flat";
};

export function StatCard({
  icon,
  tone,
  label,
  value,
  note,
  change,
  changeDirection = "up",
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}>
          <Icon name={icon} />
        </span>
        {change ? (
          <span className="stat-change">
            {changeDirection === "up" ? <Icon name="arrow-up" /> : null}
            {change}
          </span>
        ) : null}
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </article>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: IconName;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="metric-card">
      <span className="metric-icon">
        <Icon name={icon} />
      </span>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        {note ? <span className="metric-note">{note}</span> : null}
      </div>
    </article>
  );
}
