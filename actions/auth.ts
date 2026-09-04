"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getSession } from "@/lib/auth/session";

export async function signOutAction() {
  const session = await getSession();
  if (session) {
    await auth.api.signOut({ headers: await headers() });
  }
  redirect("/login");
}
