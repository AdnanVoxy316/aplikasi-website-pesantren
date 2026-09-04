import type { Role } from "@/lib/nav";

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  initials: string;
  roleLabel: string;
  role: Role;
};

export const demoAccounts: DemoAccount[] = [
  {
    email: "admin@pesantren.sch.id",
    password: "admin123",
    name: "Ahmad Fauzi",
    initials: "AF",
    roleLabel: "Administrator",
    role: "admin",
  },
  {
    email: "guru@pesantren.sch.id",
    password: "guru123",
    name: "Nisa Karimah",
    initials: "NK",
    roleLabel: "Guru / Ustadzah",
    role: "guru",
  },
  {
    email: "santri@pesantren.sch.id",
    password: "santri123",
    name: "Aisyah Fitria",
    initials: "AF",
    roleLabel: "Santri · Ibtida A",
    role: "santri",
  },
  {
    email: "wali@pesantren.sch.id",
    password: "wali123",
    name: "Rizal Hidayat",
    initials: "RH",
    roleLabel: "Wali Santri",
    role: "wali",
  },
];

export function findDemoAccount(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return demoAccounts.find(
    (account) => account.email === normalized && account.password === password,
  );
}
