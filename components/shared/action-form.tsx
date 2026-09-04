"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";

export type ActionState = { ok: boolean; error?: string; message?: string };

export function ActionForm({
  action,
  children,
  submitLabel = "Simpan",
  pendingLabel = "Menyimpan...",
  className,
  resetOnSuccess = true,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [status, setStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      setStatus(result);
      if (result.ok) {
        showToast(result.message ?? "Berhasil disimpan.");
        if (resetOnSuccess) form.reset();
      }
    });
  };

  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
      {status && !status.ok ? (
        <div className="notice error" role="alert">
          <Icon name="alert" />
          <span>{status.error}</span>
        </div>
      ) : null}
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function ConfirmActionButton({
  action,
  payload,
  label,
  confirmText,
  danger = false,
  title,
}: {
  action: (payload?: string) => Promise<ActionState>;
  payload?: string;
  label: string;
  confirmText: string;
  danger?: boolean;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  return (
    <button
      className={`table-action${danger ? " danger" : ""}`}
      type="button"
      title={title ?? label}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          const result = await action(payload);
          showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
        });
      }}
    >
      <Icon name={danger ? "trash" : "check"} />
      {pending ? "..." : label}
    </button>
  );
}

export function QuickActionButton({
  action,
  payload,
  label,
  pendingLabel,
  className = "table-button",
}: {
  action: (payload?: string) => Promise<ActionState>;
  payload?: string;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  return (
    <button
      className={className}
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await action(payload);
          if (!result.ok) {
            showToast(result.error ?? "Gagal.");
          }
        });
      }}
    >
      {pending ? pendingLabel ?? "..." : label}
    </button>
  );
}
