import type { Metadata } from "next";
import { PengumumanContent } from "@/components/pages/pengumuman-content";

export const metadata: Metadata = { title: "Pengumuman" };

export default function GuruPengumumanPage() {
  return <PengumumanContent />;
}
