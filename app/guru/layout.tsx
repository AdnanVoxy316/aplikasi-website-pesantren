import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";

export default function guruLayout({ children }: { children: ReactNode }) {
  return <AppShell role="guru">{children}</AppShell>;
}
