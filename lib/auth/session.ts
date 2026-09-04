import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { roleDashboard, type Role } from "@/lib/nav";

export type AppRole = Extract<Role, "admin" | "guru" | "santri" | "wali">;

export type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: Role;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
};

export const getSession = cache(async (): Promise<AppSession | null> => {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) return null;
  // Normalisasi: DB memakai "wali_santri", UI memakai "wali"
  const uiRole =
    session.user.role === "wali_santri" ? "wali" : (session.user.role as Role);
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      role: uiRole,
    },
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    },
  };
});

export async function requireAuth(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...allowed: AppRole[]): Promise<AppSession> {
  const session = await requireAuth();
  const path = roleDashboard[session.user.role as AppRole] ?? "/login";
  if (!allowed.includes(session.user.role as AppRole)) {
    redirect(path);
  }
  return session;
}

export async function getActiveUserRole(): Promise<Role | null> {
  const session = await getSession();
  return session?.user.role ?? null;
}
