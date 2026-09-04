import type { Metadata } from "next";
import { PengumumanSection } from "@/components/shared/sections";

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Pengumuman untuk guru dan warga pesantren.",
};

export default function GuruPengumumanPage() {
  return <PengumumanSection role="guru" roleLabel="guru/ustadz(ah)" />;
}
