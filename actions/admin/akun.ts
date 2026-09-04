"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  account,
  guruProfile,
  santriProfile,
  session,
  user,
  waliSantriProfile,
  type Role,
} from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { hashPasswordWithAuth } from "@/lib/auth/server";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  role: z.enum(["guru", "santri", "wali_santri"]),
});

export async function createAkun(
  input: z.input<typeof signUpSchema> & {
    nip?: string;
    nis?: string;
    noTelp?: string;
    kelasId?: string;
  },
): Promise<ActionResult<{ userId: string }>> {
  try {
    const session_ = await getSession();
    if (session_?.user.role !== "admin") return fail("Hanya admin yang dapat menambah akun.");

    const data = signUpSchema.parse(input);
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);
    if (existing) return fail("Email sudah terdaftar.");

    await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name: data.name },
    });

    const [created] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);
    if (!created) return fail("Gagal membuat akun.");

    await db.update(user).set({ role: data.role }).where(eq(user.id, created.id));

    if (data.role === "guru") {
      await db.insert(guruProfile).values({
        userId: created.id,
        nip: input.nip?.trim() || null,
        noTelp: input.noTelp?.trim() || null,
      });
    } else if (data.role === "santri") {
      if (!input.nis?.trim()) return fail("NIS wajib diisi untuk santri.");
      await db.insert(santriProfile).values({
        userId: created.id,
        nis: input.nis.trim(),
        kelasId: input.kelasId?.trim() || null,
      });
    } else {
      await db.insert(waliSantriProfile).values({
        userId: created.id,
        noTelp: input.noTelp?.trim() || null,
      });
    }

    await logActivity({
      userId: session_?.user.id,
      aksi: "create_akun",
      entitas: "user",
      entitasId: created.id,
      detail: { role: data.role, email: data.email },
    });

    revalidatePath("/admin/akun");
    return ok({ userId: created.id }, "Akun berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

const updateAkunSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2),
  noTelp: z.string().trim().optional(),
  nip: z.string().trim().optional(),
  nis: z.string().trim().optional(),
  kelasId: z.string().trim().optional(),
  tempatLahir: z.string().trim().optional(),
  tanggalLahir: z.string().trim().optional(),
  alamat: z.string().trim().optional(),
});

export async function updateAkun(
  input: z.input<typeof updateAkunSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session_ = await getSession();
    if (session_?.user.role !== "admin") return fail("Hanya admin yang dapat mengubah akun.");

    const data = updateAkunSchema.parse(input);
    const [target] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1);
    if (!target) return fail("Akun tidak ditemukan.");

    await db.update(user).set({ name: data.name }).where(eq(user.id, data.userId));

    if (target.role === "guru") {
      await db
        .update(guruProfile)
        .set({ nip: data.nip?.trim() || null, noTelp: data.noTelp?.trim() || null })
        .where(eq(guruProfile.userId, data.userId));
    } else if (target.role === "santri") {
      await db
        .update(santriProfile)
        .set({
          nis: data.nis?.trim() || undefined,
          kelasId: data.kelasId?.trim() || null,
          tempatLahir: data.tempatLahir?.trim() || null,
          tanggalLahir: data.tanggalLahir?.trim() || null,
          alamat: data.alamat?.trim() || null,
        })
        .where(eq(santriProfile.userId, data.userId));
    } else if (target.role === "wali_santri") {
      await db
        .update(waliSantriProfile)
        .set({ noTelp: data.noTelp?.trim() || null })
        .where(eq(waliSantriProfile.userId, data.userId));
    }

    await logActivity({
      userId: session_?.user.id,
      aksi: "update_akun",
      entitas: "user",
      entitasId: data.userId,
    });

    revalidatePath("/admin/akun");
    return ok(undefined, "Akun berhasil diperbarui.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResult<undefined>> {
  try {
    const session_ = await getSession();
    if (session_?.user.role !== "admin") return fail("Hanya admin yang dapat reset kata sandi.");

    if (newPassword.length < 8) return fail("Kata sandi minimal 8 karakter.");
    const hashed = await hashPasswordWithAuth(newPassword);
    const [updated] = await db
      .update(account)
      .set({ password: hashed })
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .returning({ id: account.id });
    if (!updated) return fail("Akun credential tidak ditemukan.");

    await db.delete(session).where(eq(session.userId, userId));
    await logActivity({
      userId: session_?.user.id,
      aksi: "reset_password",
      entitas: "user",
      entitasId: userId,
    });
    revalidatePath("/admin/akun");
    return ok(undefined, "Kata sandi berhasil direset. Sesi pengguna diakhiri.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function setAkunAktif(
  userId: string,
  isActive: boolean,
): Promise<ActionResult<undefined>> {
  try {
    const session_ = await getSession();
    if (session_?.user.role !== "admin") return fail("Hanya admin yang dapat mengubah status akun.");
    if (userId === session_?.user.id) return fail("Tidak dapat menonaktifkan akun sendiri.");

    await db.update(user).set({ isDisabled: !isActive }).where(eq(user.id, userId));
    if (!isActive) {
      await db.delete(session).where(eq(session.userId, userId));
    }

    await logActivity({
      userId: session_?.user.id,
      aksi: isActive ? "aktifkan_akun" : "nonaktifkan_akun",
      entitas: "user",
      entitasId: userId,
    });

    revalidatePath("/admin/akun");
    return ok(undefined, isActive ? "Akun diaktifkan." : "Akun dinonaktifkan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteAkun(userId: string): Promise<ActionResult<undefined>> {
  try {
    const session_ = await getSession();
    if (session_?.user.role !== "admin") return fail("Hanya admin yang dapat menghapus akun.");
    if (userId === session_?.user.id) return fail("Tidak dapat menghapus akun sendiri.");

    const [target] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!target) return fail("Akun tidak ditemukan.");
    if (target.role === "admin") return fail("Akun admin tidak dapat dihapus.");

    await db.delete(user).where(eq(user.id, userId));
    await logActivity({
      userId: session_?.user.id,
      aksi: "delete_akun",
      entitas: "user",
      entitasId: userId,
      detail: { role: target.role satisfies Role },
    });

    revalidatePath("/admin/akun");
    return ok(undefined, "Akun berhasil dihapus.");
  } catch (error) {
    return toActionError(error);
  }
}
