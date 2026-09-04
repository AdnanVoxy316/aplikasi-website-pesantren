import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { requireRole } from "@/lib/auth/session";
import { getPesantrenSettings } from "@/db/queries/admin";
import { getSantriProfile } from "@/db/queries/santri";
import type { ShellUser, ShellNotification } from "@/components/app-shell";
import type { Role } from "@/lib/nav";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru / Ustadz(ah)",
  wali: "Wali Santri",
};

export async function getShellData(
  allowedRole: "admin" | "guru" | "santri" | "wali",
): Promise<{
  user: ShellUser;
  notifications: ShellNotification[];
  tahunAjaranLabel: string;
  semesterLabel: string;
}> {
  const session = await requireRole(allowedRole);
  const role = session.user.role;
  const settings = await getPesantrenSettings();

  let roleLabel = ROLE_LABEL[role] ?? role;
  if (role === "santri") {
    const profile = await getSantriProfile(session.user.id);
    roleLabel = profile?.kelasNama
      ? `Santri · ${profile.kelasNama}`
      : "Santri";
  }

  const notifRows = await db
    .select()
    .from(notifikasi)
    .where(eq(notifikasi.userId, session.user.id))
    .orderBy(asc(notifikasi.isRead), asc(notifikasi.createdAt))
    .limit(15);

  return {
    user: {
      name: session.user.name,
      initials: initialsOf(session.user.name),
      roleLabel,
    },
    notifications: notifRows.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.message,
      read: n.isRead,
    })),
    tahunAjaranLabel: settings?.tahunAjaranLabel ?? "",
    semesterLabel: settings
      ? `Semester ${settings.settings.semesterAktif === "ganjil" ? "Ganjil" : "Genap"} · Sistem aktif`
      : "Semester aktif belum diatur",
  };
}

export type { Role };
