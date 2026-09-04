import type { Role } from "@/lib/nav";

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  roleLabel: string;
  role: Role;
};

/**
 * Kredensial demo — hanya untuk development/testing.
 * Harus sinkron dengan db/seed.ts. Jangan pernah dipakai sebagai credential production.
 */
export const demoAccounts: DemoAccount[] = [
  { email: "admin@pesantren.sch.id", password: "admin1234", name: "Ahmad Fauzi", roleLabel: "Administrator", role: "admin" },
  { email: "guru@pesantren.sch.id", password: "guru1234", name: "Nisa Karimah", roleLabel: "Guru / Ustadzah", role: "guru" },
  { email: "santri@pesantren.sch.id", password: "santri1234", name: "Aisyah Fitria", roleLabel: "Santri · Ibtida A", role: "santri" },
  { email: "wali@pesantren.sch.id", password: "wali1234", name: "Rizal Hidayat", roleLabel: "Wali Santri", role: "wali" },
];
