import { Icon, type IconName } from "@/lib/icons";

export type MetricItem = {
  icon: IconName;
  tone?: "blue" | "gold" | "coral";
  label: string;
  value: string;
  note: string;
};

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <section className="metric-grid">
      {items.map((item) => (
        <article className="metric-card" key={item.label}>
          <span className={item.tone ? `metric-icon ${item.tone}` : "metric-icon"}>
            <Icon name={item.icon} />
          </span>
          <div className="metric-copy">
            <span className="metric-label">{item.label}</span>
            <strong className="metric-value">{item.value}</strong>
            <span className="metric-note">{item.note}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
