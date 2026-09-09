"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { santriProfile, tugas, tugasSubmission, tugasSubmissionFile } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getSantriProfileId } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { MAX_FILES_PER_SUBMIT, storage } from "@/lib/storage";
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

    // Link dan file dapat terkirim bersamaan: link disimpan pada submission,
    // file yang sudah diunggah tidak dihapus.
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: tugasSubmission.id, status: tugasSubmission.status })
        .from(tugasSubmission)
        .where(and(eq(tugasSubmission.tugasId, data.tugasId), eq(tugasSubmission.santriId, santriId)))
        .limit(1);
      if (current?.status === "dinilai") {
        throw new Error("Submission sudah dinilai guru dan tidak dapat diubah.");
      }

      if (current) {
        await tx
          .update(tugasSubmission)
          .set({
            tipe,
            url,
            status: isLate ? "terlambat" : "dikumpulkan",
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(tugasSubmission.id, current.id));
      } else {
        await tx.insert(tugasSubmission).values({
          tugasId: data.tugasId,
          santriId,
          tipe,
          url,
          status: isLate ? "terlambat" : "dikumpulkan",
          updatedBy: session.user.id,
        });
      }
    });

    await logActivity({
      userId: session.user.id,
      aksi: "submit_tugas_link",
      entitas: "tugas_submission",
      detail: { tugasId: data.tugasId, tipe },
    });

    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${data.tugasId}`);
    return ok(undefined, isLate
      ? "Link tugas dikirim dengan status terlambat."
      : "Link tugas berhasil dikumpulkan.");
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Mengungguh SATU file ke submission tugas santri.
 * Dipanggil berulang oleh client (satu file per permintaan) sehingga setiap
 * request tetap di bawah batas body Server Action. Format yang diizinkan mencakup
 * PDF, dokumen Office, gambar, ZIP, dan file teks; maksimum 10 MB per file dan
 * 10 file per tugas.
 */
export async function submitFile(
  tugasId: string,
  file: File,
): Promise<ActionResult<undefined>> {
  let uploadedPath: string | null = null;
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

    const uploaded = await storage.upload(file, `tugas/${tugasId}`);
    uploadedPath = uploaded.filePath;
    const isLate = Date.now() > tugasRow.deadline.getTime();

    let submissionId = "";
    let limitReached = false;
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: tugasSubmission.id, status: tugasSubmission.status })
        .from(tugasSubmission)
        .where(and(eq(tugasSubmission.tugasId, tugasId), eq(tugasSubmission.santriId, santriId)))
        .limit(1);
      if (current?.status === "dinilai") {
        throw new Error("Submission sudah dinilai guru dan tidak dapat diubah.");
      }
      if (current && Date.now() > tugasRow.deadline.getTime()) {
        throw new Error("Deadline sudah terlewati, submission tidak dapat diubah.");
      }

      if (current) {
        const [fileCount] = await tx
          .select({ c: count() })
          .from(tugasSubmissionFile)
          .where(eq(tugasSubmissionFile.submissionId, current.id));
        if (fileCount.c >= MAX_FILES_PER_SUBMIT) {
          limitReached = true;
          return;
        }

        submissionId = current.id;
        // File ditambahkan tanpa menghapus link yang sudah dikirim.
        await tx
          .update(tugasSubmission)
          .set({
            tipe: "file",
            status: isLate ? "terlambat" : "dikumpulkan",
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(tugasSubmission.id, current.id));
      } else {
        const [created] = await tx
          .insert(tugasSubmission)
          .values({
            tugasId,
            santriId,
            tipe: "file",
            status: isLate ? "terlambat" : "dikumpulkan",
            updatedBy: session.user.id,
          })
          .returning({ id: tugasSubmission.id });
        submissionId = created.id;
      }

      await tx.insert(tugasSubmissionFile).values({
        submissionId,
        filePath: uploaded.filePath,
        namaAsli: uploaded.fileName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      });
    });

    if (limitReached) {
      await storage.delete(uploaded.filePath);
      uploadedPath = null;
      return fail(`Maksimal ${MAX_FILES_PER_SUBMIT} file per tugas. Hapus salah satu file dahulu.`);
    }
    uploadedPath = null;

    await logActivity({
      userId: session.user.id,
      aksi: "submit_tugas_file",
      entitas: "tugas_submission",
      entitasId: submissionId,
      detail: { tugasId, file: uploaded.fileName, size: uploaded.size },
    });

    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${tugasId}`);
    return ok(undefined, isLate
      ? `"${uploaded.fileName}" dikirim dengan status terlambat.`
      : `File "${uploaded.fileName}" berhasil dikumpulkan.`);
  } catch (error) {
    if (uploadedPath) {
      try {
        await storage.delete(uploadedPath);
      } catch {
        // File cleanup is best effort after a failed database write.
      }
    }
    return toActionError(error);
  }
}

/** Santri menghapus satu file dari submission-nya sendiri (sebelum deadline). */
export async function deleteOwnSubmissionFile(
  submissionId: string,
  fileId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "santri") return fail("Hanya santri yang dapat mengelola submission sendiri.");

    const santriId = await getSantriProfileId(session.user.id);
    const [row] = await db
      .select({
        santriId: tugasSubmission.santriId,
        status: tugasSubmission.status,
        deadline: tugas.deadline,
        tugasId: tugasSubmission.tugasId,
        filePath: tugasSubmissionFile.filePath,
      })
      .from(tugasSubmissionFile)
      .innerJoin(tugasSubmission, eq(tugasSubmissionFile.submissionId, tugasSubmission.id))
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(and(eq(tugasSubmissionFile.id, fileId), eq(tugasSubmissionFile.submissionId, submissionId)))
      .limit(1);
    if (!row) return fail("File tidak ditemukan.");
    if (row.santriId !== santriId) return fail("Submission ini bukan milik Anda.");
    if (row.status === "dinilai") return fail("Submission sudah dinilai guru.");
    if (Date.now() > row.deadline.getTime()) {
      return fail("Deadline sudah terlewati, file tidak dapat dihapus.");
    }

    await db.delete(tugasSubmissionFile).where(eq(tugasSubmissionFile.id, fileId));
    await storage.delete(row.filePath);

    await logActivity({
      userId: session.user.id,
      aksi: "delete_submission_file",
      entitas: "tugas_submission",
      entitasId: submissionId,
    });

    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${row.tugasId}`);
    return ok(undefined, "File berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

/** Santri menghapus link pada submission-nya sendiri (file tetap ada). */
export async function removeSubmissionLink(
  submissionId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "santri") return fail("Hanya santri yang dapat mengelola submission sendiri.");

    const santriId = await getSantriProfileId(session.user.id);
    const [row] = await db
      .select({
        santriId: tugasSubmission.santriId,
        status: tugasSubmission.status,
        deadline: tugas.deadline,
        tugasId: tugasSubmission.tugasId,
      })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmission.id, submissionId))
      .limit(1);
    if (!row) return fail("Submission tidak ditemukan.");
    if (row.santriId !== santriId) return fail("Submission ini bukan milik Anda.");
    if (row.status === "dinilai") return fail("Submission sudah dinilai guru.");
    if (Date.now() > row.deadline.getTime()) {
      return fail("Deadline sudah terlewati, link tidak dapat dihapus.");
    }

    const [fileCount] = await db
      .select({ c: count() })
      .from(tugasSubmissionFile)
      .where(eq(tugasSubmissionFile.submissionId, submissionId));

    if (fileCount.c === 0) {
      // Tidak ada file tersisa — hapus seluruh submission.
      await db.delete(tugasSubmission).where(eq(tugasSubmission.id, submissionId));
    } else {
      await db
        .update(tugasSubmission)
        .set({ url: null, tipe: "file", updatedBy: session.user.id, updatedAt: new Date() })
        .where(eq(tugasSubmission.id, submissionId));
    }

    await logActivity({
      userId: session.user.id,
      aksi: "remove_submission_link",
      entitas: "tugas_submission",
      entitasId: submissionId,
    });

    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${row.tugasId}`);
    return ok(undefined, "Link berhasil dihapus.");
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
        status: tugasSubmission.status,
        deadline: tugas.deadline,
        tugasId: tugasSubmission.tugasId,
      })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmission.id, submissionId))
      .limit(1);
    if (!row) return fail("Submission tidak ditemukan.");
    if (row.santriId !== santriId) return fail("Submission ini bukan milik Anda.");
    if (row.status === "dinilai") return fail("Submission sudah dinilai guru.");
    if (Date.now() > row.deadline.getTime()) {
      return fail("Deadline sudah terlewati, submission tidak dapat dihapus.");
    }

    const files = await db
      .select({ filePath: tugasSubmissionFile.filePath })
      .from(tugasSubmissionFile)
      .where(eq(tugasSubmissionFile.submissionId, submissionId));
    for (const f of files) await storage.delete(f.filePath);

    await db.delete(tugasSubmission).where(eq(tugasSubmission.id, submissionId));

    await logActivity({
      userId: session.user.id,
      aksi: "delete_submission",
      entitas: "tugas_submission",
      entitasId: submissionId,
    });

    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${row.tugasId}`);
    return ok(undefined, "Submission berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}
