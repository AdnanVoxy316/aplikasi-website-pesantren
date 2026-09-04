import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import { getShellData } from "@/lib/shell-data";

export default async function adminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const shell = await getShellData("admin");
  return (
    <AppShell
      role="admin"
      user={shell.user}
      notifications={shell.notifications}
      tahunAjaranLabel={shell.tahunAjaranLabel}
      semesterLabel={shell.semesterLabel}
    >
      {children}
    </AppShell>
  );
}
