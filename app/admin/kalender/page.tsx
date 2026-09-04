import type { Metadata } from "next";
import { KalenderSection } from "@/components/shared/sections";

export const metadata: Metadata = {
  title: "Kalender akademik",
  description: "Tahun ajaran dan semester aktif pesantren.",
};

export default function AdminKalenderPage() {
  return <KalenderSection />;
}
