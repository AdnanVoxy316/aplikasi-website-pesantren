"use client";

export type TabDefinition = { id: string; label: string };

export function Tabs({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: TabDefinition[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="task-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            className={`tab-button${isActive ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
