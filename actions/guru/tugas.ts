"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tugas, tugasSubmission } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { assertPengajaran, getGuruProfileId } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
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

    await db.delete(tugas).where(eq(tugas.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_tugas",
      entitas: "tugas",
      entitasId: id,
    });
    revalidatePath("/guru/tugas");
    return ok(undefined, "Tugas berhasil dihapus beserta semua submission-nya.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSubmissionFile(
  submissionId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");
    const [row] = await db
      .select({
        filePath: tugasSubmission.filePath,
        tugasGuruId: tugas.guruId,
        deadline: tugas.deadline,
      })
      .from(tugasSubmission)
      .innerJoin(tugas, eq(tugasSubmission.tugasId, tugas.id))
      .where(eq(tugasSubmission.id, submissionId))
      .limit(1);
    if (!row) return fail("Submission tidak ditemukan.");

    if (session.user.role === "santri") {
      return fail("Gunakan menu tugas untuk mengelola submission milik Anda.");
    }

    await db
      .update(tugasSubmission)
      .set({
        filePath: null,
        fileNamaAsli: null,
        fileMimeType: null,
        fileSize: null,
        updatedBy: session.user.id,
      })
      .where(eq(tugasSubmission.id, submissionId));

    if (row.filePath) {
      const { storage } = await import("@/lib/storage");
      await storage.delete(row.filePath);
    }

    await logActivity({
      userId: session.user.id,
      aksi: "hapus_file_tugas",
      entitas: "tugas_submission",
      entitasId: submissionId,
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
