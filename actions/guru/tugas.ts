"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tugas, tugasLampiran, tugasSubmission, tugasSubmissionFile } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { assertPengajaran, getGuruProfileId } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { MAX_FILES_PER_SUBMIT, storage } from "@/lib/storage";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

const tugasSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter"),
  deskripsi: z.string().trim().min(3, "Deskripsi minimal 3 karakter"),
  kelasId: z.string().min(1, "Kelas wajib dipilih"),
  mapelId: z.string().min(1, "Mapel wajib dipilih"),
  tahunAjaranId: z.string().min(1, "Tahun ajaran wajib dipilih"),
  deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Deadline harus di masa depan"),
});

export async function createTugas(
  input: z.input<typeof tugasSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru") return fail("Hanya guru yang dapat membuat tugas.");

    const data = tugasSchema.parse(input);
    const guruId = await getGuruProfileId(session.user.id);
    await assertPengajaran(guruId, data.kelasId, data.mapelId, data.tahunAjaranId);

    const [created] = await db
      .insert(tugas)
      .values({ ...data, guruId })
      .returning({ id: tugas.id });

    const { notifyUsers, userIdsOfKelas } = await import("@/lib/notify");
    await notifyUsers({
      userIds: await userIdsOfKelas(data.kelasId),
      type: "tugas_baru",
      title: "Tugas baru ditambahkan",
      message: `${data.judul} — deadline ${data.deadline.toLocaleDateString("id-ID")}`,
      entitas: "tugas",
      entitasId: created.id,
    });

    await logActivity({
      userId: session.user.id,
      aksi: "create_tugas",
      entitas: "tugas",
      entitasId: created.id,
      detail: { judul: data.judul },
    });

    revalidatePath("/guru/tugas");
    return ok(created, "Tugas berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  nilai: z.coerce.number().min(0).max(100),
  feedback: z.string().trim().optional(),
});

export async function gradeSubmission(
  input: z.input<typeof gradeSubmissionSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru") return fail("Hanya guru yang dapat menilai submission.");

    const data = gradeSubmissionSchema.parse(input);
    const [submission] = await db
      .select({ id: tugasSubmission.id, tugasId: tugasSubmission.tugasId })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmission.id, data.submissionId))
      .limit(1);
    if (!submission) return fail("Submission tidak ditemukan.");

    const [tugasRow] = await db
      .select({ guruId: tugas.guruId, kelasId: tugas.kelasId, mapelId: tugas.mapelId, tahunAjaranId: tugas.tahunAjaranId })
      .from(tugas)
      .where(eq(tugas.id, submission.tugasId))
      .limit(1);
    if (!tugasRow) return fail("Tugas tidak ditemukan.");

    const guruId = await getGuruProfileId(session.user.id);
    if (tugasRow.guruId !== guruId) {
      await assertPengajaran(
        guruId,
        tugasRow.kelasId,
        tugasRow.mapelId,
        tugasRow.tahunAjaranId,
      );
    }

    await db
      .update(tugasSubmission)
      .set({
        nilai: data.nilai,
        feedbackGuru: data.feedback?.trim() || null,
        status: "dinilai",
        updatedBy: session.user.id,
      })
      .where(eq(tugasSubmission.id, data.submissionId));

    await logActivity({
      userId: session.user.id,
      aksi: "grade_submission",
      entitas: "tugas_submission",
      entitasId: data.submissionId,
      detail: { nilai: data.nilai },
    });

    revalidatePath("/guru/tugas/submission");
    return ok(undefined, "Nilai submission berhasil disimpan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTugas(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    const [row] = await db.select({ guruId: tugas.guruId }).from(tugas).where(eq(tugas.id, id)).limit(1);
    if (!row) return fail("Tugas tidak ditemukan.");

    if (session.user.role === "guru") {
      const guruId = await getGuruProfileId(session.user.id);
      if (row.guruId !== guruId) return fail("Tugas ini bukan milik Anda.");
    } else if (session.user.role !== "admin") {
      return fail("Anda tidak memiliki izin.");
    }

    const [lampiranFiles, submissionFiles] = await Promise.all([
      db
        .select({ filePath: tugasLampiran.filePath })
        .from(tugasLampiran)
        .where(eq(tugasLampiran.tugasId, id)),
      db
        .select({ filePath: tugasSubmissionFile.filePath })
        .from(tugasSubmissionFile)
        .innerJoin(tugasSubmission, eq(tugasSubmissionFile.submissionId, tugasSubmission.id))
        .where(eq(tugasSubmission.tugasId, id)),
    ]);

    await db.delete(tugas).where(eq(tugas.id, id));
    const filePaths = [...lampiranFiles, ...submissionFiles]
      .map((file) => file.filePath)
      .filter((filePath): filePath is string => Boolean(filePath));
    const cleanupResults = await Promise.allSettled(
      filePaths.map((filePath) => storage.delete(filePath)),
    );
    if (cleanupResults.some((result) => result.status === "rejected")) {
      console.error("Sebagian file tugas gagal dibersihkan setelah tugas dihapus.", { tugasId: id });
    }
    await logActivity({
      userId: session.user.id,
      aksi: "delete_tugas",
      entitas: "tugas",
      entitasId: id,
    });
    revalidatePath("/guru/tugas");
    revalidatePath("/santri");
    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${id}`);
    return ok(undefined, "Tugas berhasil dihapus beserta semua submission-nya.");
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Guru mengunggah SATU file lampiran untuk tugasnya (format aman yang didukung,
 * maks 10 MB per file, maks 10 file per tugas). Dipanggil berulang oleh client,
 * satu file per permintaan.
 */
export async function addTugasLampiran(
  tugasId: string,
  file: File,
): Promise<ActionResult<undefined>> {
  let uploadedPath: string | null = null;
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru") return fail("Hanya guru yang dapat mengunggah lampiran tugas.");
    if (!file || file.size === 0) return fail("File wajib dipilih.");

    const guruId = await getGuruProfileId(session.user.id);
    const [tugasRow] = await db
      .select({ guruId: tugas.guruId })
      .from(tugas)
      .where(eq(tugas.id, tugasId))
      .limit(1);
    if (!tugasRow) return fail("Tugas tidak ditemukan.");
    if (tugasRow.guruId !== guruId) return fail("Tugas ini bukan milik Anda.");

    const [lampiranCount] = await db
      .select({ c: count() })
      .from(tugasLampiran)
      .where(eq(tugasLampiran.tugasId, tugasId));
    if (lampiranCount.c >= MAX_FILES_PER_SUBMIT) {
      return fail(`Maksimal ${MAX_FILES_PER_SUBMIT} lampiran per tugas.`);
    }

    const uploaded = await storage.upload(file, `tugas/${tugasId}`);
    uploadedPath = uploaded.filePath;
    let limitReached = false;
    await db.transaction(async (tx) => {
      const [currentCount] = await tx
        .select({ c: count() })
        .from(tugasLampiran)
        .where(eq(tugasLampiran.tugasId, tugasId));
      if (currentCount.c >= MAX_FILES_PER_SUBMIT) {
        limitReached = true;
        return;
      }
      await tx.insert(tugasLampiran).values({
        tugasId,
        filePath: uploaded.filePath,
        namaAsli: uploaded.fileName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        uploadedBy: session.user.id,
      });
    });

    if (limitReached) {
      await storage.delete(uploaded.filePath);
      uploadedPath = null;
      return fail(`Maksimal ${MAX_FILES_PER_SUBMIT} lampiran per tugas.`);
    }
    uploadedPath = null;

    await logActivity({
      userId: session.user.id,
      aksi: "upload_lampiran_tugas",
      entitas: "tugas",
      entitasId: tugasId,
      detail: { file: uploaded.fileName, size: uploaded.size },
    });

    revalidatePath("/guru/tugas");
    revalidatePath("/guru/tugas/submission");
    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${tugasId}`);
    return ok(undefined, `Lampiran "${uploaded.fileName}" berhasil diunggah.`);
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

/** Guru menambahkan lampiran berupa link (Google Drive, YouTube, dll). */
export async function addTugasLampiranLink(
  tugasId: string,
  url: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru") return fail("Hanya guru yang dapat menambahkan lampiran tugas.");

    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) return fail("URL tidak valid. Gunakan format https://...");

    const guruId = await getGuruProfileId(session.user.id);
    const [tugasRow] = await db
      .select({ guruId: tugas.guruId })
      .from(tugas)
      .where(eq(tugas.id, tugasId))
      .limit(1);
    if (!tugasRow) return fail("Tugas tidak ditemukan.");
    if (tugasRow.guruId !== guruId) return fail("Tugas ini bukan milik Anda.");

    const [lampiranCount] = await db
      .select({ c: count() })
      .from(tugasLampiran)
      .where(eq(tugasLampiran.tugasId, tugasId));
    if (lampiranCount.c >= MAX_FILES_PER_SUBMIT) {
      return fail(`Maksimal ${MAX_FILES_PER_SUBMIT} lampiran per tugas.`);
    }

    let limitReached = false;
    await db.transaction(async (tx) => {
      const [currentCount] = await tx
        .select({ c: count() })
        .from(tugasLampiran)
        .where(eq(tugasLampiran.tugasId, tugasId));
      if (currentCount.c >= MAX_FILES_PER_SUBMIT) {
        limitReached = true;
        return;
      }
      await tx.insert(tugasLampiran).values({
        tugasId,
        filePath: null,
        namaAsli: trimmed,
        url: trimmed,
        uploadedBy: session.user.id,
      });
    });
    if (limitReached) return fail(`Maksimal ${MAX_FILES_PER_SUBMIT} lampiran per tugas.`);

    await logActivity({
      userId: session.user.id,
      aksi: "tambah_lampiran_link",
      entitas: "tugas",
      entitasId: tugasId,
      detail: { url: trimmed },
    });

    revalidatePath("/guru/tugas");
    revalidatePath("/guru/tugas/submission");
    revalidatePath("/santri/tugas");
    revalidatePath(`/santri/tugas/${tugasId}`);
    return ok(undefined, "Link lampiran berhasil ditambahkan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTugasLampiran(
  lampiranId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    const [row] = await db
      .select({
        tugasGuruId: tugas.guruId,
        tugasId: tugasLampiran.tugasId,
        filePath: tugasLampiran.filePath,
      })
      .from(tugasLampiran)
      .innerJoin(tugas, eq(tugasLampiran.tugasId, tugas.id))
      .where(eq(tugasLampiran.id, lampiranId))
      .limit(1);
    if (!row) return fail("Lampiran tidak ditemukan.");

    if (session.user.role === "guru") {
      const guruId = await getGuruProfileId(session.user.id);
      if (row.tugasGuruId !== guruId) return fail("Tugas ini bukan milik Anda.");
    } else if (session.user.role !== "admin") {
      return fail("Anda tidak memiliki izin.");
    }

    await db.delete(tugasLampiran).where(eq(tugasLampiran.id, lampiranId));
    if (row.filePath) await storage.delete(row.filePath);

    await logActivity({
      userId: session.user.id,
      aksi: "delete_lampiran_tugas",
      entitas: "tugas",
      entitasId: lampiranId,
    });

    revalidatePath("/guru/tugas");
    revalidatePath("/guru/tugas/submission");
    revalidatePath(`/santri/tugas/${row.tugasId}`);
    return ok(undefined, "Lampiran berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

/** Guru menghapus satu file submission santri (mis. file tidak sesuai). */
export async function deleteSubmissionFileGuru(
  fileId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    if (session.user.role !== "guru" && session.user.role !== "admin") {
      return fail("Hanya guru atau admin yang dapat menghapus file submission.");
    }
    const [row] = await db
      .select({
        id: tugasSubmissionFile.id,
        filePath: tugasSubmissionFile.filePath,
        tugasGuruId: tugas.guruId,
      })
      .from(tugasSubmissionFile)
      .innerJoin(tugasSubmission, eq(tugasSubmissionFile.submissionId, tugasSubmission.id))
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmissionFile.id, fileId))
      .limit(1);
    if (!row) return fail("File tidak ditemukan.");

    if (session.user.role === "guru") {
      const guruId = await getGuruProfileId(session.user.id);
      if (row.tugasGuruId !== guruId) return fail("Tugas ini bukan milik Anda.");
    }

    await db.delete(tugasSubmissionFile).where(eq(tugasSubmissionFile.id, fileId));
    await storage.delete(row.filePath);

    await logActivity({
      userId: session.user.id,
      aksi: "hapus_file_submission",
      entitas: "tugas_submission",
      entitasId: fileId,
    });

    revalidatePath("/guru/tugas/submission");
    return ok(undefined, "File submission berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function getTugasForGuru(guruProfileId: string, kelasId?: string) {
  const conditions = [eq(tugas.guruId, guruProfileId)];
  if (kelasId) conditions.push(eq(tugas.kelasId, kelasId));
  return db
    .select()
    .from(tugas)
    .where(and(...conditions));
}
