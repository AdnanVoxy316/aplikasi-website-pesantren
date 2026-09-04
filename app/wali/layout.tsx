import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import { getShellData } from "@/lib/shell-data";

export default async function waliLayout({
  children,
}: {
  children: ReactNode;
}) {
  const shell = await getShellData("wali");
  return (
    <AppShell
      role="wali"
      user={shell.user}
      notifications={shell.notifications}
      tahunAjaranLabel={shell.tahunAjaranLabel}
      semesterLabel={shell.semesterLabel}
    >
      {children}
    </AppShell>
  );
}
