"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { santriProfile, tugas, tugasSubmission } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getSantriProfileId } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { storage } from "@/lib/storage";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

type SubmissionTipe = "file" | "link_gdrive" | "link_youtube" | "link_lainnya";

function classifyLink(url: string): SubmissionTipe {
  if (/drive\.google\.com|docs\.google\.com/i.test(url)) return "link_gdrive";
  if (/youtube\.com|youtu\.be/i.test(url)) return "link_youtube";
  return "link_lainnya";
}

const submitSchema = z
  .object({
    tugasId: z.string().min(1),
    url: z.string().trim().url("URL tidak valid").optional(),
    catatan: z.string().trim().optional(),
  })
  .refine((data) => data.url !== undefined, {
    message: "URL wajib diisi untuk submission link.",
    path: ["url"],
  });

export async function submitLink(
  input: z.input<typeof submitSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "santri") return fail("Hanya santri yang dapat mengumpulkan tugas.");

    const data = submitSchema.parse(input);
    const santriId = await getSantriProfileId(session.user.id);

    const [tugasRow] = await db
      .select({ kelasId: tugas.kelasId, deadline: tugas.deadline, tahunAjaranId: tugas.tahunAjaranId })
      .from(tugas)
      .where(eq(tugas.id, data.tugasId))
      .limit(1);
    if (!tugasRow) return fail("Tugas tidak ditemukan.");

    const [santri] = await db
      .select({ kelasId: santriProfile.kelasId })
      .from(santriProfile)
      .where(eq(santriProfile.id, santriId))
      .limit(1);
    if (santri?.kelasId !== tugasRow.kelasId) {
      return fail("Tugas ini tidak ditujukan untuk kelas Anda.");
    }

    const url = data.url!;
    const tipe = classifyLink(url);
    const isLate = Date.now() > tugasRow.deadline.getTime();

    await db
      .insert(tugasSubmission)
      .values({
        tugasId: data.tugasId,
        santriId,
        tipe,
        url,
        status: isLate ? "terlambat" : "dikumpulkan",
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [tugasSubmission.tugasId, tugasSubmission.santriId],
        set: {
          tipe,
          url,
          status: isLate ? "terlambat" : "dikumpulkan",
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

    await logActivity({
      userId: session.user.id,
      aksi: "submit_tugas_link",
      entitas: "tugas_submission",
      detail: { tugasId: data.tugasId, tipe },
    });

    revalidatePath("/santri/tugas");
    return ok(undefined, isLate
      ? "Link tugas dikirim dengan status terlambat."
      : "Link tugas berhasil dikumpulkan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function submitFile(
  tugasId: string,
  file: File,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "santri") return fail("Hanya santri yang dapat mengumpulkan tugas.");
    if (!file || file.size === 0) return fail("File wajib dipilih.");

    const santriId = await getSantriProfileId(session.user.id);

    const [tugasRow] = await db
      .select({ kelasId: tugas.kelasId, deadline: tugas.deadline })
      .from(tugas)
      .where(eq(tugas.id, tugasId))
      .limit(1);
    if (!tugasRow) return fail("Tugas tidak ditemukan.");

    const [santri] = await db
      .select({ kelasId: santriProfile.kelasId })
      .from(santriProfile)
      .where(eq(santriProfile.id, santriId))
      .limit(1);
    if (santri?.kelasId !== tugasRow.kelasId) {
      return fail("Tugas ini tidak ditujukan untuk kelas Anda.");
    }

    const [existing] = await db
      .select({ filePath: tugasSubmission.filePath })
      .from(tugasSubmission)
      .where(and(eq(tugasSubmission.tugasId, tugasId), eq(tugasSubmission.santriId, santriId)))
      .limit(1);

    const uploaded = await storage.upload(file, `tugas/${tugasId}`);

    const isLate = Date.now() > tugasRow.deadline.getTime();
    await db
      .insert(tugasSubmission)
      .values({
        tugasId,
        santriId,
        tipe: "file",
        filePath: uploaded.filePath,
        fileNamaAsli: uploaded.fileName,
        fileMimeType: uploaded.mimeType,
        fileSize: uploaded.size,
        status: isLate ? "terlambat" : "dikumpulkan",
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [tugasSubmission.tugasId, tugasSubmission.santriId],
        set: {
          tipe: "file",
          filePath: uploaded.filePath,
          fileNamaAsli: uploaded.fileName,
          fileMimeType: uploaded.mimeType,
          fileSize: uploaded.size,
          url: null,
          status: isLate ? "terlambat" : "dikumpulkan",
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

    if (existing?.filePath && existing.filePath !== uploaded.filePath) {
      await storage.delete(existing.filePath);
    }

    await logActivity({
      userId: session.user.id,
      aksi: "submit_tugas_file",
      entitas: "tugas_submission",
      detail: { tugasId, file: uploaded.fileName },
    });

    revalidatePath("/santri/tugas");
    return ok(undefined, isLate
      ? "File dikirim dengan status terlambat."
      : "File tugas berhasil dikumpulkan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSubmission(
  submissionId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "santri") return fail("Hanya santri yang dapat menghapus submission sendiri.");

    const santriId = await getSantriProfileId(session.user.id);
    const [row] = await db
      .select({
        santriId: tugasSubmission.santriId,
        filePath: tugasSubmission.filePath,
        deadline: tugas.deadline,
      })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmission.id, submissionId))
      .limit(1);
    if (!row) return fail("Submission tidak ditemukan.");
    if (row.santriId !== santriId) return fail("Submission ini bukan milik Anda.");
    if (Date.now() > row.deadline.getTime()) {
      return fail("Deadline sudah terlewati, submission tidak dapat dihapus.");
    }

    await db.delete(tugasSubmission).where(eq(tugasSubmission.id, submissionId));
    if (row.filePath) await storage.delete(row.filePath);

    await logActivity({
      userId: session.user.id,
      aksi: "delete_submission",
      entitas: "tugas_submission",
      entitasId: submissionId,
    });

    revalidatePath("/santri/tugas");
    return ok(undefined, "Submission berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSubmissionFile(
  submissionId: string,
  file: File,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "santri") return fail("Hanya santri yang dapat mengubah submission sendiri.");

    const santriId = await getSantriProfileId(session.user.id);
    const [row] = await db
      .select({
        santriId: tugasSubmission.santriId,
        filePath: tugasSubmission.filePath,
        deadline: tugas.deadline,
        tugasId: tugasSubmission.tugasId,
      })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmission.id, submissionId))
      .limit(1);
    if (!row) return fail("Submission tidak ditemukan.");
    if (row.santriId !== santriId) return fail("Submission ini bukan milik Anda.");
    if (Date.now() > row.deadline.getTime()) {
      return fail("Deadline sudah terlewati, submission tidak dapat diubah.");
    }

    const uploaded = await storage.upload(file, `tugas/${row.tugasId}`);
    await db
      .update(tugasSubmission)
      .set({
        filePath: uploaded.filePath,
        fileNamaAsli: uploaded.fileName,
        fileMimeType: uploaded.mimeType,
        fileSize: uploaded.size,
        updatedBy: session.user.id,
      })
      .where(eq(tugasSubmission.id, submissionId));

    if (row.filePath && row.filePath !== uploaded.filePath) {
      await storage.delete(row.filePath);
    }

    await logActivity({
      userId: session.user.id,
      aksi: "update_submission_file",
      entitas: "tugas_submission",
      entitasId: submissionId,
    });

    revalidatePath("/santri/tugas");
    return ok(undefined, "File submission berhasil diperbarui.");
  } catch (error) {
    return toActionError(error);
  }
}
