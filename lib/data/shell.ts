import type { Role } from "@/lib/nav";
import { demoAccounts } from "@/lib/data/accounts";

export type ShellUser = {
  name: string;
  initials: string;
  roleLabel: string;
};

export type ShellNotification = {
  title: string;
  description: string;
  read?: boolean;
};

export const shellUsers: Record<Role, ShellUser> = demoAccounts.reduce(
  (users, account) => {
    users[account.role] = {
      name: account.name,
      initials: account.initials,
      roleLabel: account.roleLabel,
    };
    return users;
  },
  {} as Record<Role, ShellUser>,
);

export const shellNotifications: Record<Role, ShellNotification[]> = {
  admin: [
    { title: "12 submission perlu dinilai", description: "Ringkasan Kitab Ta'lim Muta'allim" },
    { title: "Pengumuman baru diterbitkan", description: "Jadwal ujian tengah semester" },
    {
      title: "Pembayaran SPP masuk",
      description: "Transaksi Mayar #INV-0206 berhasil",
      read: true,
    },
  ],
  guru: [
    { title: "18 submission masuk", description: "Setoran hafalan Juz Amma · Ibtida A" },
    { title: "Deadline tugas hari ini", description: "Latihan persamaan linear · Ulya B" },
    {
      title: "Nilai rapor perlu dilengkapi",
      description: "Tsanawiyah 1 · Semester Ganjil",
      read: true,
    },
  ],
  santri: [
    { title: "Tugas baru ditambahkan", description: "Praktik membaca Al-Qur'an · Tilawah" },
    { title: "Nilai tugas sudah keluar", description: "Ringkasan Kitab Ta'lim Muta'allim: 88" },
    {
      title: "Tagihan SPP Februari tersedia",
      description: "Jatuh tempo 20 Februari 2026",
      read: true,
    },
  ],
  wali: [
    { title: "Rapor semester siap diunduh", description: "Aisyah Fitria · Semester Ganjil" },
    { title: "Kehadiran anak diperbarui", description: "Hadir 27 dari 28 hari pada Februari" },
    {
      title: "Pembayaran SPP diterima",
      description: "Tagihan Februari Aisyah Fitria lunas",
      read: true,
    },
  ],
};

export const academicYears = ["2026 / 2027", "2025 / 2026"];

export const semesterStatus = "Semester Ganjil · Sistem aktif";
