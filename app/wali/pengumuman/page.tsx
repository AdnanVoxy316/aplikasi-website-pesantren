import type { Metadata } from "next";
import { PengumumanSection } from "@/components/shared/sections";

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Pengumuman untuk wali santri.",
};

export default function WaliPengumumanPage() {
  return <PengumumanSection role="wali_santri" roleLabel="wali santri" />;
}
