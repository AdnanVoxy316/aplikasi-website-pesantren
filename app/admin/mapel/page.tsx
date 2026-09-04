import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { listMapelDetail } from "@/db/queries/admin";
import { MapelClient } from "./mapel-client";

export const metadata: Metadata = {
  title: "Mapel",
  description: "Kelola mata pelajaran pesantren.",
};

export default async function AdminMapelPage() {
  const rows = await listMapelDetail();
  return (
    <>
      <PageHeading
        kicker="Akademik"
        title="Mapel"
        description="Mata pelajaran fleksibel sesuai kebijakan pesantren — tidak baku."
      />
      <MapelClient rows={rows} />
    </>
  );
}
