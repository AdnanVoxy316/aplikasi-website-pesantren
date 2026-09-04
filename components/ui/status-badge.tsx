export type BadgeVariant =
  | "success"
  | "warning"
  | "neutral"
  | "danger";

export function StatusBadge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
}) {
  return <span className={`status-badge ${variant}`}>{children}</span>;
}
