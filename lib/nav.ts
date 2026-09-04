import type { IconName } from "@/lib/icons";

export type Role = "admin" | "guru" | "santri" | "wali";

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  count?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const roleDashboard: Record<Role, string> = {
  admin: "/admin",
  guru: "/guru",
  santri: "/santri",
  wali: "/wali",
};

export const roleLabels: Record<Role, string> = {
  admin: "admin",
  guru: "guru",
  santri: "santri",
  wali: "wali santri",
};

export const navigation: Record<Role, NavSection[]> = {
  admin: [
    {
      label: "Overview",
      items: [
        { label: "Beranda", href: "/admin", icon: "grid" },
        { label: "Kalender akademik", href: "/admin/kalender", icon: "calendar" },
      ],
    },
    {
      label: "Akademik",
      items: [
        { label: "Akun pengguna", href: "/admin/akun", icon: "users" },
        { label: "Kelas", href: "/admin/kelas", icon: "book" },
        { label: "Mapel", href: "/admin/mapel", icon: "book" },
        { label: "Penugasan guru", href: "/admin/penugasan-guru", icon: "clipboard" },
        { label: "Relasi wali santri", href: "/admin/wali-santri", icon: "users" },
        { label: "Tugas & submission", href: "/admin#tugas", icon: "clipboard", count: "24" },
        { label: "Nilai & kehadiran", href: "/admin/kehadiran", icon: "chart" },
        { label: "Rapor", href: "/admin/rapor", icon: "file" },
      ],
    },
    {
      label: "Pembayaran SPP",
      items: [
        { label: "Dashboard pembayaran", href: "/admin/pembayaran", icon: "wallet", count: "86" },
        { label: "Tarif SPP", href: "/admin/pembayaran/tarif-spp", icon: "settings" },
        { label: "Tagihan", href: "/admin/pembayaran/tagihan", icon: "file" },
        { label: "Transaksi", href: "/admin/pembayaran/transaksi", icon: "chart" },
        { label: "Pengaturan pembayaran", href: "/admin/pembayaran/pengaturan", icon: "settings" },
      ],
    },
    {
      label: "Layanan pesantren",
      items: [
        { label: "Pengumuman", href: "/admin/pengumuman", icon: "megaphone" },
        { label: "Pengaturan", href: "/admin/pengaturan", icon: "settings" },
        { label: "Log aktivitas", href: "/admin/log-aktivitas", icon: "shield" },
      ],
    },
  ],
  guru: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/guru", icon: "grid" },
        { label: "Kalender akademik", href: "/guru/kalender", icon: "calendar" },
      ],
    },
    {
      label: "Kegiatan mengajar",
      items: [
        { label: "Input nilai", href: "/guru/nilai", icon: "chart" },
        { label: "Kehadiran", href: "/guru/kehadiran", icon: "users" },
        { label: "Tugas & submission", href: "/guru/tugas", icon: "clipboard", count: "12" },
        { label: "Rapor", href: "/guru/rapor", icon: "file" },
      ],
    },
    {
      label: "Akun",
      items: [
        { label: "Pengumuman", href: "/guru/pengumuman", icon: "megaphone" },
        { label: "Keluar", href: "/logout", icon: "log-out" },
      ],
    },
  ],
  santri: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/santri", icon: "grid" },
        { label: "Kalender akademik", href: "/santri/kalender", icon: "calendar" },
      ],
    },
    {
      label: "Belajar",
      items: [
        { label: "Tugas saya", href: "/santri/tugas", icon: "clipboard", count: "4" },
        { label: "Nilai", href: "/santri/nilai", icon: "chart" },
        { label: "Kehadiran", href: "/santri/kehadiran", icon: "users" },
        { label: "Rapor", href: "/santri/rapor", icon: "file" },
      ],
    },
    {
      label: "Keuangan",
      items: [
        { label: "Pembayaran SPP", href: "/santri/pembayaran/tagihan", icon: "wallet" },
        { label: "Riwayat pembayaran", href: "/santri/pembayaran/riwayat", icon: "clock" },
      ],
    },
    {
      label: "Akun",
      items: [
        { label: "Pengumuman", href: "/santri/pengumuman", icon: "megaphone" },
        { label: "Keluar", href: "/logout", icon: "log-out" },
      ],
    },
  ],
  wali: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/wali", icon: "grid" },
        { label: "Kalender akademik", href: "/wali/kalender", icon: "calendar" },
      ],
    },
    {
      label: "Pantau anak",
      items: [
        { label: "Nilai anak", href: "/wali/nilai", icon: "chart" },
        { label: "Kehadiran anak", href: "/wali/kehadiran", icon: "users" },
        { label: "Rapor anak", href: "/wali/rapor", icon: "file" },
      ],
    },
    {
      label: "Keuangan",
      items: [
        { label: "Pembayaran SPP", href: "/wali/pembayaran/tagihan", icon: "wallet" },
        { label: "Riwayat pembayaran", href: "/wali/pembayaran/riwayat", icon: "clock" },
      ],
    },
    {
      label: "Akun",
      items: [
        { label: "Pengumuman", href: "/wali/pengumuman", icon: "megaphone" },
        { label: "Keluar", href: "/logout", icon: "log-out" },
      ],
    },
  ],
};

const pageTitles: Partial<Record<Role, Record<string, string>>> = {
  guru: {
    "/guru/tugas/baru": "Buat tugas baru",
    "/guru/tugas/submission": "Submission santri",
  },
  santri: {
    "/santri/tugas/": "Detail tugas",
  },
};

export function resolveBreadcrumb(
  pathname: string,
  role: Role,
): [string, string] {
  const roleNav = navigation[role];
  let best: { section: string; label: string; href: string } | undefined;
  for (const section of roleNav) {
    for (const item of section.items) {
      const path = item.href.split("#")[0] ?? item.href;
      if (!path || !isNavItemActive(pathname, path)) continue;
      if (!best || path.length > best.href.length) {
        best = { section: section.label, label: item.label, href: path };
      }
    }
  }
  if (!best) return ["Workspace", "ELMS Pesantren"];
  const overrides = pageTitles[role];
  if (overrides) {
    for (const [prefix, title] of Object.entries(overrides)) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return [best.label, title];
      }
    }
  }
  return [best.section, best.label];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href.startsWith("#")) return false;
  const [path, hash] = href.split("#");
  if (!path) return false;
  if (hash) return pathname === path;
  if (path === "/admin" || path === "/guru" || path === "/santri" || path === "/wali") {
    return pathname === path;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
