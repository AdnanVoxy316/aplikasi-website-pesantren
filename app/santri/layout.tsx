import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";

export default function santriLayout({ children }: { children: ReactNode }) {
  return <AppShell role="santri">{children}</AppShell>;
}
