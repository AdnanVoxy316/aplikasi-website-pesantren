"use client";

import type { ReactNode } from "react";
import { useToast } from "@/components/app-shell";

export function ToastButton({
  message,
  className,
  children,
  ariaLabel,
}: {
  message: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const showToast = useToast();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => showToast(message)}
    >
      {children}
    </button>
  );
}

export function ToastLink({
  message,
  className,
  children,
  href,
  ariaLabel,
}: {
  message: string;
  className?: string;
  children: ReactNode;
  href?: string;
  ariaLabel?: string;
}) {
  const showToast = useToast();
  return (
    <a
      href={href ?? "#"}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (!href || href.startsWith("#")) event.preventDefault();
        showToast(message);
      }}
    >
      {children}
    </a>
  );
}
