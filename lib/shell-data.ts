import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { requireRole, requireAuth } from "@/lib/auth/session";
import { getPesantrenSettings } from "@/db/queries/admin";
import { getSantriProfile } from "@/db/queries/santri";
import type { ShellUser, ShellNotification } from "@/components/app-shell";

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

export type ShellData = {
  role: "admin" | "guru" | "santri" | "wali";
  userId: string;
  user: ShellUser;
  notifications: ShellNotification[];
  tahunAjaranLabel: string;
  semesterLabel: string;
};

export async function getShellData(
  allowedRole: "admin" | "guru" | "santri" | "wali",
): Promise<ShellData> {
  const session = await requireRole(allowedRole);
  const data = await buildShellData(session);
  return { role: allowedRole, ...data };
}

export async function getShellDataAnyRole(): Promise<ShellData> {
  const session = await requireAuth();
  const data = await buildShellData(session);
  return { role: session.user.role as ShellData["role"], ...data };
}

async function buildShellData(session: {
  user: { id: string; name: string; email: string; role: string };
}): Promise<Omit<ShellData, "role">> {
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
    userId: session.user.id,
    user: {
      name: session.user.name,
      initials: initialsOf(session.user.name),
      roleLabel,
      email: session.user.email,
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
