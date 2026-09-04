import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { roleDashboard, type Role } from "@/lib/nav";

export default async function HomePage() {
  const session = await getSession();
  const role = session?.user.role as Role | undefined;
  if (role && role in roleDashboard) {
    redirect(roleDashboard[role as keyof typeof roleDashboard]);
  }
  redirect("/login");
}
