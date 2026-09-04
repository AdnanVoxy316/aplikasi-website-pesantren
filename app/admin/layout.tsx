import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";

export default function adminLayout({ children }: { children: ReactNode }) {
  return <AppShell role="admin">{children}</AppShell>;
}
