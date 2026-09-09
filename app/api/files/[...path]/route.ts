import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  guruProfile,
  pengajaran,
  santriProfile,
  tugas,
  tugasLampiran,
  tugasSubmission,
  tugasSubmissionFile,
  waliSantriAnak,
  waliSantriProfile,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { storage, UPLOAD_MIME_BY_EXTENSION } from "@/lib/storage";

type FileInfo = {
  namaAsli: string;
  mimeType: string | null;
  ownerSantriId: string | null;
};

function resolveMimeType(info: FileInfo, namaFile: string): string {
  const extension = namaFile.split(".").pop()?.toLowerCase() ?? "";
  return UPLOAD_MIME_BY_EXTENSION[extension] ?? info.mimeType ?? "application/octet-stream";
}

async function findFileInfo(
  tugasId: string,
  filePath: string,
): Promise<FileInfo | null> {
  const [lampiran] = await db
    .select({ namaAsli: tugasLampiran.namaAsli, mimeType: tugasLampiran.mimeType })
    .from(tugasLampiran)
    .where(and(eq(tugasLampiran.tugasId, tugasId), eq(tugasLampiran.filePath, filePath)))
    .limit(1);
  if (lampiran) return { ...lampiran, ownerSantriId: null };

  const [subFile] = await db
    .select({
      namaAsli: tugasSubmissionFile.namaAsli,
      mimeType: tugasSubmissionFile.mimeType,
      ownerSantriId: tugasSubmission.santriId,
    })
    .from(tugasSubmissionFile)
    .innerJoin(tugasSubmission, eq(tugasSubmissionFile.submissionId, tugasSubmission.id))
    .where(
      and(
        eq(tugasSubmission.tugasId, tugasId),
        eq(tugasSubmissionFile.filePath, filePath),
      ),
    )
    .limit(1);
  return subFile ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Sesi tidak ditemukan.", { status: 401 });
  }

  const { path: segments } = await params;
  if (segments[0] !== "tugas" || segments.length < 3) {
    return new NextResponse("File tidak ditemukan.", { status: 404 });
  }
  const tugasId = segments[1];
  const filePath = segments.join("/");

  const [tugasRow] = await db
    .select({ kelasId: tugas.kelasId, guruId: tugas.guruId })
    .from(tugas)
    .where(eq(tugas.id, tugasId))
    .limit(1);
  if (!tugasRow) {
    return new NextResponse("File tidak ditemukan.", { status: 404 });
  }

  const info = await findFileInfo(tugasId, filePath);
  if (!info) {
    return new NextResponse("File tidak ditemukan.", { status: 404 });
  }

  // Kontrol akses berbasis peran.
  let allowed = false;
  if (session.user.role === "admin") {
    allowed = true;
  } else if (session.user.role === "guru") {
    const [guru] = await db
      .select({ id: guruProfile.id })
      .from(guruProfile)
      .where(eq(guruProfile.userId, session.user.id))
      .limit(1);
    if (guru) {
      if (guru.id === tugasRow.guruId) {
        allowed = true;
      } else {
        const [ajar] = await db
          .select({ id: pengajaran.id })
          .from(pengajaran)
          .where(and(eq(pengajaran.guruId, guru.id), eq(pengajaran.kelasId, tugasRow.kelasId)))
          .limit(1);
        allowed = Boolean(ajar);
      }
    }
  } else if (session.user.role === "santri") {
    const [santri] = await db
      .select({ id: santriProfile.id, kelasId: santriProfile.kelasId })
      .from(santriProfile)
      .where(eq(santriProfile.userId, session.user.id))
      .limit(1);
    allowed =
      santri?.kelasId === tugasRow.kelasId &&
      (info.ownerSantriId === null || info.ownerSantriId === santri.id);
  } else if (session.user.role === "wali") {
    const [anak] = await db
      .select({ id: waliSantriAnak.id })
      .from(waliSantriProfile)
      .innerJoin(waliSantriAnak, eq(waliSantriAnak.waliSantriId, waliSantriProfile.id))
      .innerJoin(santriProfile, eq(waliSantriAnak.santriId, santriProfile.id))
      .where(
        and(
          eq(waliSantriProfile.userId, session.user.id),
          eq(santriProfile.kelasId, tugasRow.kelasId),
          info.ownerSantriId ? eq(waliSantriAnak.santriId, info.ownerSantriId) : undefined,
        ),
      )
      .limit(1);
    allowed = Boolean(anak);
  }

  if (!allowed) {
    return new NextResponse("Anda tidak memiliki akses ke file ini.", { status: 403 });
  }

  try {
    const absPath = storage.getAbsolutePath(filePath);
    const data = await fs.readFile(absPath);
    const encoded = encodeURIComponent(info.namaAsli.replace(/[\r\n"]/g, "_"));
    const mimeType = resolveMimeType(info, info.namaAsli);
    const canRenderInline = mimeType === "application/pdf" || mimeType.startsWith("image/");
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${canRenderInline ? "inline" : "attachment"}; filename="file"; filename*=UTF-8''${encoded}`,
        "Content-Length": String(data.length),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("File tidak ditemukan di penyimpanan.", { status: 404 });
  }
}
