import type { IconName } from "@/lib/icons";
import type { BadgeVariant } from "@/components/ui/status-badge";

export type SantriTaskStatus = "belum" | "dikumpulkan" | "dinilai";

export type SantriTaskSummary = {
  name: string;
  description: string;
  icon: IconName;
};

export type SantriTask = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  teacherFull: string;
  dueDate: string;
  dueNote: string;
  status: SantriTaskStatus;
  grade: string;
  actionLabel: string;
  actionPrimary: boolean;
  createdNote: string;
  deadlineChip: string;
  instruction: string;
  requirements: string[];
  notice: { strong: string; text: string; warning: boolean };
  summary: SantriTaskSummary[];
};

export const santriTaskBadges: Record<
  SantriTaskStatus,
  { variant: BadgeVariant; label: string }
> = {
  belum: { variant: "warning", label: "Belum dikumpulkan" },
  dikumpulkan: { variant: "success", label: "Sudah dikumpulkan" },
  dinilai: { variant: "neutral", label: "Dinilai" },
};

export const santriTasks: SantriTask[] = [
  {
    id: "setoran-hafalan-juz-amma",
    title: "Setoran hafalan Juz Amma",
    subject: "Tahfidz Qur'an",
    teacher: "Ustz. Nisa Karimah",
    teacherFull: "Ustadzah Nisa Karimah",
    dueDate: "12 Feb 2026",
    dueNote: "2 hari lagi",
    status: "belum",
    grade: "-",
    actionLabel: "Kerjakan",
    actionPrimary: true,
    createdNote: "Dibuat 02 Februari 2026",
    deadlineChip: "Deadline 12 Feb, 23:59",
    instruction:
      "Setorkan hafalan surat An-Naba sampai An-Nas dengan bacaan tartil. Rekam suara dengan durasi yang jelas dan pastikan nama file mencantumkan nama lengkap.",
    requirements: [
      "Hafalkan minimal 5 surat dari Juz Amma.",
      "File dapat berupa rekaman atau link Google Drive.",
      "Pastikan file dapat dibuka sebelum menekan tombol kirim.",
    ],
    notice: {
      strong: "Deadline semakin dekat",
      text: "Tugas ini harus dikumpulkan dalam 2 hari.",
      warning: true,
    },
    summary: [
      { name: "Mapel", description: "Tahfidz Qur'an", icon: "book" },
      { name: "Kelas", description: "Ibtida A", icon: "users" },
      { name: "Nilai", description: "Belum dinilai", icon: "chart" },
      { name: "Format", description: "File atau link", icon: "file" },
    ],
  },
  {
    id: "ringkasan-kitab-talim",
    title: "Ringkasan Kitab Ta'lim",
    subject: "Kitab Kuning",
    teacher: "Ust. Hadi Santoso",
    teacherFull: "Ustadz Hadi Santoso",
    dueDate: "15 Feb 2026",
    dueNote: "5 hari lagi",
    status: "dikumpulkan",
    grade: "-",
    actionLabel: "Lihat",
    actionPrimary: false,
    createdNote: "Dibuat 05 Februari 2026",
    deadlineChip: "Deadline 15 Feb, 23:59",
    instruction:
      "Buat ringkasan materi adab menuntut ilmu dari Kitab Ta'lim Muta'allim minimal dua halaman. Tulis dengan bahasa sendiri dan sertakan halaman rujukan kitab.",
    requirements: [
      "Ringkasan minimal dua halaman dan maksimal empat halaman.",
      "Sebutkan nomor halaman kitab pada setiap poin penting.",
      "Kumpulkan dalam format PDF sebelum deadline.",
    ],
    notice: {
      strong: "Submission terkirim",
      text: "Tugas sudah dikumpulkan dan menunggu penilaian guru.",
      warning: false,
    },
    summary: [
      { name: "Mapel", description: "Kitab Kuning", icon: "book" },
      { name: "Kelas", description: "Ibtida A", icon: "users" },
      { name: "Nilai", description: "Belum dinilai", icon: "chart" },
      { name: "Format", description: "File atau link", icon: "file" },
    ],
  },
  {
    id: "latihan-persamaan-linear",
    title: "Latihan persamaan linear",
    subject: "Matematika",
    teacher: "Ust. Farid Maulana",
    teacherFull: "Ustadz Farid Maulana",
    dueDate: "18 Feb 2026",
    dueNote: "8 hari lagi",
    status: "belum",
    grade: "-",
    actionLabel: "Kerjakan",
    actionPrimary: true,
    createdNote: "Dibuat 06 Februari 2026",
    deadlineChip: "Deadline 18 Feb, 23:59",
    instruction:
      "Kerjakan 15 soal latihan persamaan linear satu variabel pada buku paket halaman 74 sampai 76. Tuliskan langkah penyelesaian secara lengkap dan rapi.",
    requirements: [
      "Tuliskan langkah penyelesaian untuk setiap nomor.",
      "Soal boleh dikumpulkan dalam tulisan tangan yang difoto.",
      "Pastikan hasil pindaian terbaca jelas sebelum dikirim.",
    ],
    notice: {
      strong: "Belum dikumpulkan",
      text: "Selesaikan latihan ini sebelum 18 Februari.",
      warning: true,
    },
    summary: [
      { name: "Mapel", description: "Matematika", icon: "book" },
      { name: "Kelas", description: "Ibtida A", icon: "users" },
      { name: "Nilai", description: "Belum dinilai", icon: "chart" },
      { name: "Format", description: "File atau link", icon: "file" },
    ],
  },
  {
    id: "kuis-adab-menuntut-ilmu",
    title: "Kuis adab menuntut ilmu",
    subject: "Akhlak",
    teacher: "Ustz. Nisa Karimah",
    teacherFull: "Ustadzah Nisa Karimah",
    dueDate: "Selesai",
    dueNote: "05 Feb 2026",
    status: "dinilai",
    grade: "92",
    actionLabel: "Feedback",
    actionPrimary: false,
    createdNote: "Dibuat 28 Januari 2026",
    deadlineChip: "Ditutup 05 Feb, 23:59",
    instruction:
      "Jawab 10 pertanyaan kuis tentang adab menuntut ilmu berdasarkan materi pertemuan pekan lalu. Kerjakan secara mandiri tanpa membuka catatan.",
    requirements: [
      "Kuis terdiri dari 10 pertanyaan pilihan ganda.",
      "Kuis hanya dapat dikerjakan satu kali.",
      "Nilai muncul otomatis setelah jawaban dikirim.",
    ],
    notice: {
      strong: "Sudah dinilai",
      text: "Nilai 92 dengan feedback dari Ustadzah Nisa Karimah.",
      warning: false,
    },
    summary: [
      { name: "Mapel", description: "Akhlak", icon: "book" },
      { name: "Kelas", description: "Ibtida A", icon: "users" },
      { name: "Nilai", description: "92", icon: "chart" },
      { name: "Format", description: "Pilihan ganda", icon: "file" },
    ],
  },
];
