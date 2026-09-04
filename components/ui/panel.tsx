import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  actions,
  id,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  id?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={className ? `panel ${className}` : "panel"} id={id}>
      {title ? (
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{title}</h2>
            {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {bodyClassName ? (
        <div className={bodyClassName}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

export function PanelToolbar({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="panel-toolbar">
      <div className="toolbar-left">{left}</div>
      <div className="toolbar-right">{right}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-task show">{children}</div>;
}

export function PageFooter() {
  const now = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <footer className="footer">
      <span className="footer-brand">ELMS Pesantren</span>
      <span className="footer-note">Data diperbarui langsung dari database · {now}</span>
    </footer>
  );
}
