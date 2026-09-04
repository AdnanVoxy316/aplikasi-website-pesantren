import type { Metadata } from "next";
import { PengumumanSection } from "@/components/shared/sections";

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Pengumuman untuk santri.",
};

export default function SantriPengumumanPage() {
  return <PengumumanSection role="santri" roleLabel="santri" />;
}
