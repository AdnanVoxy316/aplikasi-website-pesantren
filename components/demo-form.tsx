"use client";

import { useState, type ReactNode } from "react";
import { useToast } from "@/components/app-shell";

export function DemoForm({
  children,
  className,
  success = "Perubahan berhasil disimpan.",
  actions,
  onSubmit,
}: {
  children: ReactNode;
  className?: string;
  success?: string;
  actions?: ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(event);
        setLoading(true);
        window.setTimeout(() => {
          setLoading(false);
          showToast(success);
        }, 550);
      }}
    >
      {children}
      {actions ? (
        <div className="form-actions" data-loading={loading || undefined}>
          {actions}
        </div>
      ) : null}
    </form>
  );
}
