import type { ReactNode } from "react";
import { Icon, type IconName } from "@/lib/icons";

export function PageHeading({
  kicker,
  title,
  description,
  actions,
  compact = false,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`page-heading${compact ? " page-heading-compact" : ""}`}
      aria-labelledby="pageTitle"
    >
      <div>
        <span className="page-kicker">{kicker}</span>
        <h1 className="page-title" id="pageTitle">
          {title}
        </h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  );
}

export function RoleChip({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <span className="role-chip">
      <Icon name={icon} />
      {children}
    </span>
  );
}
