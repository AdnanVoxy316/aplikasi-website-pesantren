import type { Metadata } from "next";
import { PengumumanContent } from "@/components/pages/pengumuman-content";

export const metadata: Metadata = {
  title: "Pengumuman",
  description:
    "Bagikan informasi ke semua role, kelas tertentu, atau kelompok warga pesantren.",
};

export default function AdminPengumumanPage() {
  return <PengumumanContent />;
}
