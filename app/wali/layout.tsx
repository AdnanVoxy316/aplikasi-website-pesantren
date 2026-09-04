import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";

export default function waliLayout({ children }: { children: ReactNode }) {
  return <AppShell role="wali">{children}</AppShell>;
}
