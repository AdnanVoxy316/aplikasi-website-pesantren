"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  pembayaranSpp,
  santriProfile,
  tagihanSpp,
  tarifSpp,
  user,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import {
  AuthorizationError,
  assertAnakOfWali,
  getSantriProfileId,
  getWaliProfileId,
} from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { createInvoice, MayarError } from "@/lib/mayar";
import { labelPeriode } from "@/lib/format";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

/* ---------------- Tarif SPP (Admin) ---------------- */

const tarifSchema = z.object({
  nama: z.string().trim().min(3, "Nama tarif minimal 3 karakter"),
  nominal: z.coerce.number().int("Nominal harus bilangan bulat").gt(0, "Nominal harus lebih dari 0"),
  kelasId: z.string().trim().optional(),
  tahunAjaranId: z.string().trim().optional(),
  berlakuMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  berlakuSampai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")
    .optional(),
});

export async function createTarif(
  input: z.input<typeof tarifSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat mengelola tarif.");

    const data = tarifSchema.parse(input);
    const [created] = await db
      .insert(tarifSpp)
      .values({
        nama: data.nama,
        nominal: data.nominal,
        kelasId: data.kelasId?.trim() || null,
        tahunAjaranId: data.tahunAjaranId?.trim() || null,
        berlakuMulai: data.berlakuMulai,
        berlakuSampai: data.berlakuSampai?.trim() || null,
        createdBy: session.user.id,
      })
      .returning({ id: tarifSpp.id });

    await logActivity({
      userId: session.user.id,
      aksi: "create_tarif_spp",
      entitas: "tarif_spp",
      entitasId: created.id,
      detail: { nama: data.nama, nominal: data.nominal },
    });

    revalidatePath("/admin/pembayaran/tarif-spp");
    return ok(created, "Tarif SPP berhasil dibuat.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function setTarifAktif(
  id: string,
  isActive: boolean,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat mengubah tarif.");
    await db.update(tarifSpp).set({ isActive }).where(eq(tarifSpp.id, id));
    await logActivity({
      userId: session.user.id,
      aksi: isActive ? "activate_tarif_spp" : "deactivate_tarif_spp",
      entitas: "tarif_spp",
      entitasId: id,
    });
    revalidatePath("/admin/pembayaran/tarif-spp");
    return ok(undefined, isActive ? "Tarif diaktifkan." : "Tarif dinonaktifkan.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Generate Tagihan (Admin) ---------------- */

const generateTagihanSchema = z.object({
  tahunAjaranId: z.string().min(1, "Tahun ajaran wajib dipilih"),
  periodeBulan: z.coerce.number().int().min(1).max(12),
  periodeTahun: z.coerce.number().int().min(2000).max(2100),
  scope: z.enum(["santri", "kelas", "semua"]),
  santriId: z.string().trim().optional(),
  kelasId: z.string().trim().optional(),
  jatuhTempo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function resolveTarif(tahunAjaranId: string, kelasId: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(tarifSpp)
    .where(
      and(
        eq(tarifSpp.isActive, true),
        or(
          isNull(tarifSpp.tahunAjaranId),
          eq(tarifSpp.tahunAjaranId, tahunAjaranId),
        ),
        sql`${tarifSpp.berlakuMulai} <= ${today}`,
        or(
          isNull(tarifSpp.berlakuSampai),
          sql`${tarifSpp.berlakuSampai} >= ${today}`,
        ),
      ),
    );

  const spesifik = rows.find((r) => r.kelasId === kelasId);
  const umum = rows.find((r) => r.kelasId === null);
  return spesifik ?? umum ?? null;
}

export async function generateTagihan(
  input: z.input<typeof generateTagihanSchema>,
): Promise<ActionResult<{ dibuat: number; dilewati: number; gagal: number }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat generate tagihan.");

    const data = generateTagihanSchema.parse(input);

    const santriRows = await db
      .select({ id: santriProfile.id, kelasId: santriProfile.kelasId })
      .from(santriProfile)
      .where(
        data.scope === "santri" && data.santriId
          ? eq(santriProfile.id, data.santriId)
          : data.scope === "kelas" && data.kelasId
            ? eq(santriProfile.kelasId, data.kelasId)
            : undefined,
      );

    if (santriRows.length === 0) {
      return fail("Tidak ada santri yang cocok dengan filter yang dipilih.");
    }

    let dibuat = 0;
    let dilewati = 0;
    let gagal = 0;

    for (const santri of santriRows) {
      const [existing] = await db
        .select({ id: tagihanSpp.id })
        .from(tagihanSpp)
        .where(
          and(
            eq(tagihanSpp.santriId, santri.id),
            eq(tagihanSpp.periodeBulan, data.periodeBulan),
            eq(tagihanSpp.periodeTahun, data.periodeTahun),
          ),
        )
        .limit(1);
      if (existing) {
        dilewati += 1;
        continue;
      }

      const tarif = await resolveTarif(data.tahunAjaranId, santri.kelasId);
      if (!tarif) {
        gagal += 1;
        continue;
      }

      const diskon = 0;
      const denda = 0;
      const total = tarif.nominal - diskon + denda;
      const nomorTagihan = `SPP-${data.periodeTahun}${String(data.periodeBulan).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      try {
        await db.insert(tagihanSpp).values({
          nomorTagihan,
          santriId: santri.id,
          tarifSppId: tarif.id,
          tahunAjaranId: data.tahunAjaranId,
          periodeBulan: data.periodeBulan,
          periodeTahun: data.periodeTahun,
          nominal: tarif.nominal,
          nominalDiskon: diskon,
          nominalDenda: denda,
          totalTagihan: total,
          jatuhTempo: data.jatuhTempo ? new Date(`${data.jatuhTempo}T23:59:59`) : null,
          status: "unpaid",
          createdBy: session.user.id,
        });
        dibuat += 1;
      } catch {
        gagal += 1;
      }
    }

    await logActivity({
      userId: session.user.id,
      aksi: "generate_tagihan",
      entitas: "tagihan_spp",
      detail: { ...data, dibuat, dilewati, gagal },
    });

    if (dibuat > 0) {
      const { notifyUsers, userIdsOfWaliForKelasSantri } = await import("@/lib/notify");
      const santriNotified: string[] = [];
      const santriUserRows = await db
        .select({ santriId: santriProfile.id, userId: user.id })
        .from(tagihanSpp)
        .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
        .innerJoin(user, eq(santriProfile.userId, user.id))
        .where(
          and(
            eq(tagihanSpp.periodeBulan, data.periodeBulan),
            eq(tagihanSpp.periodeTahun, data.periodeTahun),
          ),
        );
      for (const row of santriUserRows) santriNotified.push(row.userId);
      const santriIds = santriUserRows.map((r) => r.santriId);
      await notifyUsers({
        userIds: [...santriNotified, ...(await userIdsOfWaliForKelasSantri(santriIds))],
        type: "tagihan_baru",
        title: "Tagihan SPP tersedia",
        message: `Tagihan SPP periode ${data.periodeBulan}/${data.periodeTahun} sudah bisa dibayarkan.`,
        entitas: "tagihan_spp",
      });
    }

    revalidatePath("/admin/pembayaran/tagihan");
    return ok(
      { dibuat, dilewati, gagal },
      `Tagihan dibuat: ${dibuat}, dilewati (sudah ada): ${dilewati}, gagal: ${gagal}.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

export async function cancelTagihan(tagihanId: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat membatalkan tagihan.");

    const [tagihan] = await db
      .select({ status: tagihanSpp.status })
      .from(tagihanSpp)
      .where(eq(tagihanSpp.id, tagihanId))
      .limit(1);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (tagihan.status === "paid") return fail("Tagihan yang sudah dibayar tidak dapat dibatalkan.");

    await db
      .update(tagihanSpp)
      .set({ status: "cancelled" })
      .where(eq(tagihanSpp.id, tagihanId));

    await logActivity({
      userId: session.user.id,
      aksi: "cancel_tagihan",
      entitas: "tagihan_spp",
      entitasId: tagihanId,
    });

    revalidatePath("/admin/pembayaran/tagihan");
    return ok(undefined, "Tagihan dibatalkan.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Bayar Sekarang (Santri / Wali) ---------------- */

async function authorizeTagihanForUser(tagihanId: string) {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Sesi tidak ditemukan.");

  const [row] = await db
    .select({
      tagihan: tagihanSpp,
      santriUserId: user.id,
    })
    .from(tagihanSpp)
    .innerJoin(santriProfile, eq(tagihanSpp.santriId, santriProfile.id))
    .innerJoin(user, eq(santriProfile.userId, user.id))
    .where(eq(tagihanSpp.id, tagihanId))
    .limit(1);
  if (!row) throw new AuthorizationError("Tagihan tidak ditemukan.");

  if (session.user.role === "santri") {
    const santriId = await getSantriProfileId(session.user.id);
    if (row.tagihan.santriId !== santriId) {
      throw new AuthorizationError("Tagihan ini bukan milik Anda.");
    }
  } else if (session.user.role === "wali") {
    const waliId = await getWaliProfileId(session.user.id);
    await assertAnakOfWali(waliId, row.tagihan.santriId);
  } else if (session.user.role !== "admin") {
    throw new AuthorizationError("Hanya santri atau wali santri yang dapat membayar tagihan.");
  }

  return { tagihan: row.tagihan, user: session.user };
}

export async function bayarSekarang(
  tagihanId: string,
): Promise<ActionResult<{ checkoutUrl: string }>> {
  try {
    const { tagihan, user: payer } = await authorizeTagihanForUser(tagihanId);

    if (tagihan.status === "paid") {
      return fail("Tagihan ini sudah dibayar.");
    }
    if (tagihan.status === "cancelled" || tagihan.status === "expired") {
      return fail(`Tagihan berstatus ${tagihan.status} dan tidak dapat dibayar.`);
    }

    const [activePayment] = await db
      .select({ id: pembayaranSpp.id, checkoutUrl: pembayaranSpp.checkoutUrl, status: pembayaranSpp.status })
      .from(pembayaranSpp)
      .where(
        and(
          eq(pembayaranSpp.tagihanSppId, tagihanId),
          or(
            eq(pembayaranSpp.status, "pending"),
            eq(pembayaranSpp.status, "processing"),
          ),
        ),
      )
      .orderBy(desc(pembayaranSpp.createdAt))
      .limit(1);

    if (activePayment?.checkoutUrl) {
      return ok(
        { checkoutUrl: activePayment.checkoutUrl },
        "Transaksi pembayaran masih aktif — menggunakan checkout yang sudah ada.",
      );
    }

    const [santriUser] = await db
      .select({ name: user.name, email: user.email })
      .from(santriProfile)
      .innerJoin(user, eq(santriProfile.userId, user.id))
      .where(eq(santriProfile.id, tagihan.santriId))
      .limit(1);

    const appUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const redirectBase =
      payer.role === "wali"
        ? `${appUrl}/wali/pembayaran/tagihan`
        : `${appUrl}/santri/pembayaran/tagihan`;
    const invoice = await createInvoice({
      name: santriUser?.name ?? payer.name,
      email: santriUser?.email ?? payer.email,
      description: `SPP ${labelPeriode(tagihan.periodeBulan, tagihan.periodeTahun)} — ${tagihan.nomorTagihan}`,
      redirectUrl: redirectBase,
      items: [
        {
          quantity: 1,
          rate: tagihan.totalTagihan,
          description: `SPP bulan ${labelPeriode(tagihan.periodeBulan, tagihan.periodeTahun)}`,
        },
      ],
      extraData: { tagihanId: tagihan.id },
    });

    await db.insert(pembayaranSpp).values({
      tagihanSppId: tagihan.id,
      provider: "mayar",
      providerInvoiceId: invoice.id,
      providerTransactionId: invoice.transactionId,
      checkoutUrl: invoice.link,
      status: "pending",
    });

    await db
      .update(tagihanSpp)
      .set({ status: "pending" })
      .where(eq(tagihanSpp.id, tagihan.id));

    await logActivity({
      userId: payer.id,
      aksi: "create_payment_mayar",
      entitas: "pembayaran_spp",
      detail: { tagihanId: tagihan.id, invoiceId: invoice.id },
    });

    revalidatePath("/admin/pembayaran/transaksi");
    return ok(
      { checkoutUrl: invoice.link },
      "Transaksi berhasil dibuat, mengarahkan ke halaman pembayaran Mayar.",
    );
  } catch (error) {
    if (error instanceof AuthorizationError) return fail(error.message);
    if (error instanceof MayarError) return fail(error.message);
    return toActionError(error);
  }
}

export async function markPaidManual(
  tagihanId: string,
  catatan: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat mencatat pembayaran manual.");

    const [tagihan] = await db
      .select({ status: tagihanSpp.status })
      .from(tagihanSpp)
      .where(eq(tagihanSpp.id, tagihanId))
      .limit(1);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (tagihan.status === "paid") return fail("Tagihan sudah berstatus paid.");

    await db.transaction(async (tx) => {
      await tx
        .update(tagihanSpp)
        .set({ status: "paid" })
        .where(eq(tagihanSpp.id, tagihanId));
      await tx.insert(pembayaranSpp).values({
        tagihanSppId: tagihanId,
        provider: "manual",
        status: "paid",
        paidAt: new Date(),
        providerPayload: { catatan },
      });
    });

    await logActivity({
      userId: session.user.id,
      aksi: "manual_mark_paid",
      entitas: "tagihan_spp",
      entitasId: tagihanId,
      detail: { catatan },
    });

    revalidatePath("/admin/pembayaran/transaksi");
    return ok(undefined, "Pembayaran manual tercatat.");
  } catch (error) {
    return toActionError(error);
  }
}
