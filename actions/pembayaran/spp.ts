"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  jenisPembayaran,
  pembayaranSpp,
  santriProfile,
  tagihanItem,
  tagihanSpp,
  tarifSpp,
  tarifSppSantri,
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
import {
  cancelTransaction,
  createSnapTransaction,
  enabledPaymentsFromEnv,
  fetchSnapTransactionDetail,
  getTransactionStatus,
  isMidtransConfigured,
  isMidtransProduction,
  MidtransError,
  normalizeMidtransStatus,
  snapTokenFromRedirectUrl,
} from "@/lib/midtrans";
import {
  getBuktiPembayaranData,
  prosesStatusPembayaran,
  resolveNominalSantri,
  terbitkanBuktiPembayaran,
  type BuktiPembayaranData,
} from "@/lib/pembayaran";
import { labelPeriode } from "@/lib/format";
import { isMailerConfigured, MAILER_SETUP_HINT } from "@/lib/mailer";
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

/* ---------------- Tarif khusus per santri (Admin) ---------------- */

const tarifSantriSchema = z.object({
  santriId: z.string().trim().min(1, "Santri wajib dipilih"),
  nominal: z.coerce.number().int("Nominal harus bilangan bulat").gt(0, "Nominal harus lebih dari 0"),
  catatan: z.string().trim().max(200).optional(),
});

export async function setTarifSantri(
  input: z.input<typeof tarifSantriSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengatur tarif khusus santri.");
    }

    const data = tarifSantriSchema.parse(input);
    const [existing] = await db
      .select({ id: tarifSppSantri.id })
      .from(tarifSppSantri)
      .where(eq(tarifSppSantri.santriId, data.santriId))
      .limit(1);

    if (existing) {
      await db
        .update(tarifSppSantri)
        .set({
          nominal: data.nominal,
          catatan: data.catatan?.trim() || null,
          isActive: true,
        })
        .where(eq(tarifSppSantri.id, existing.id));
      await logActivity({
        userId: session.user.id,
        aksi: "update_tarif_spp_santri",
        entitas: "tarif_spp_santri",
        entitasId: existing.id,
        detail: { santriId: data.santriId, nominal: data.nominal },
      });
      revalidatePath("/admin/pembayaran/tarif-santri");
      revalidatePath("/admin/pembayaran/tagihan");
      return ok({ id: existing.id }, "Tarif khusus santri diperbarui.");
    }

    const [created] = await db
      .insert(tarifSppSantri)
      .values({
        santriId: data.santriId,
        nominal: data.nominal,
        catatan: data.catatan?.trim() || null,
        createdBy: session.user.id,
      })
      .returning({ id: tarifSppSantri.id });

    await logActivity({
      userId: session.user.id,
      aksi: "create_tarif_spp_santri",
      entitas: "tarif_spp_santri",
      entitasId: created.id,
      detail: { santriId: data.santriId, nominal: data.nominal },
    });
    revalidatePath("/admin/pembayaran/tarif-santri");
    revalidatePath("/admin/pembayaran/tagihan");
    return ok(created, "Tarif khusus santri disimpan.");
  } catch (error) {
    return toActionError(error);
  }
}

export async function hapusTarifSantri(
  santriId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat menghapus tarif khusus santri.");
    }
    await db.delete(tarifSppSantri).where(eq(tarifSppSantri.santriId, santriId));
    await logActivity({
      userId: session.user.id,
      aksi: "delete_tarif_spp_santri",
      entitas: "tarif_spp_santri",
      detail: { santriId },
    });
    revalidatePath("/admin/pembayaran/tarif-santri");
    revalidatePath("/admin/pembayaran/tagihan");
    return ok(undefined, "Tarif khusus santri dihapus (kembali ke tarif kelas).");
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

export async function generateTagihan(
  input: z.input<typeof generateTagihanSchema>,
): Promise<ActionResult<{ dibuat: number; dilewati: number; gagal: number }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat generate tagihan.");

    const data = generateTagihanSchema.parse(input);

    const [jenisSpp] = await db
      .select({ id: jenisPembayaran.id, nama: jenisPembayaran.nama })
      .from(jenisPembayaran)
      .where(eq(jenisPembayaran.kode, "spp_bulanan"))
      .limit(1);
    if (!jenisSpp) {
      return fail(
        "Jenis pembayaran 'SPP Bulanan' tidak ditemukan. Tambahkan lewat menu Jenis pembayaran.",
      );
    }

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
            eq(tagihanSpp.sumber, "spp"),
          ),
        )
        .limit(1);
      if (existing) {
        dilewati += 1;
        continue;
      }

      const nominal = await resolveNominalSantri(
        santri.id,
        santri.kelasId,
        data.tahunAjaranId,
      );
      if (!nominal) {
        gagal += 1;
        continue;
      }

      const diskon = 0;
      const denda = 0;
      const total = nominal.nominal - diskon + denda;
      const nomorTagihan = `SPP-${data.periodeTahun}${String(data.periodeBulan).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      try {
        await db.transaction(async (tx) => {
          const [header] = await tx
            .insert(tagihanSpp)
            .values({
              nomorTagihan,
              santriId: santri.id,
              tarifSppId: nominal.tarifSppId,
              tahunAjaranId: data.tahunAjaranId,
              sumber: "spp",
              periodeBulan: data.periodeBulan,
              periodeTahun: data.periodeTahun,
              nominal: nominal.nominal,
              nominalDiskon: diskon,
              nominalDenda: denda,
              totalTagihan: total,
              jatuhTempo: data.jatuhTempo ? new Date(`${data.jatuhTempo}T23:59:59`) : null,
              status: "unpaid",
              createdBy: session.user.id,
            })
            .returning({ id: tagihanSpp.id });

          await tx.insert(tagihanItem).values({
            tagihanSppId: header.id,
            jenisPembayaranId: jenisSpp.id,
            nama: jenisSpp.nama,
            nominal: nominal.nominal,
            keterangan: nominal.keterangan || null,
            urutan: 1,
          });
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

    let pesan: string;
    if (dibuat > 0) {
      pesan = `Tagihan dibuat: ${dibuat}, dilewati (sudah ada): ${dilewati}, gagal: ${gagal}.`;
    } else if (dilewati > 0 && gagal === 0) {
      pesan = `Tidak ada tagihan baru: seluruh tagihan periode ${data.periodeBulan}/${data.periodeTahun} sudah pernah dibuat (${dilewati} dilewati). Pilih bulan lain, atau ubah nominal lewat tombol pensil di tabel.`;
    } else if (gagal > 0 && dilewati === 0) {
      pesan = `Gagal membuat ${gagal} tagihan: tidak ada tarif SPP aktif yang berlaku. Tambahkan tarif di menu Tarif SPP atau atur tarif khusus santri.`;
    } else {
      pesan = `Tidak ada tagihan dibuat. Dilewati: ${dilewati}, gagal: ${gagal}.`;
    }

    return ok({ dibuat, dilewati, gagal }, pesan);
  } catch (error) {
    return toActionError(error);
  }
}

const updateTagihanSchema = z.object({
  tagihanId: z.string().min(1),
  nominal: z.coerce.number().int("Nominal harus bilangan bulat").gt(0, "Nominal harus lebih dari 0"),
  catatan: z.string().trim().max(200).optional(),
});

/**
 * Override nominal tagihan per santri (mis. santri hanya mampu membayar
 * sebagian bulan ini). Tetap boleh dilakukan meski sudah ada tarif khusus.
 */
export async function updateTagihanNominal(
  input: z.input<typeof updateTagihanSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah nominal tagihan.");
    }
    const data = updateTagihanSchema.parse(input);
    const [tagihan] = await db
      .select({ status: tagihanSpp.status, nominalDenda: tagihanSpp.nominalDenda, nominalDiskon: tagihanSpp.nominalDiskon })
      .from(tagihanSpp)
      .where(eq(tagihanSpp.id, data.tagihanId))
      .limit(1);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (tagihan.status === "paid") return fail("Tagihan yang sudah dibayar tidak dapat diubah.");

    const itemRows = await db
      .select({ id: tagihanItem.id })
      .from(tagihanItem)
      .where(eq(tagihanItem.tagihanSppId, data.tagihanId))
      .orderBy(tagihanItem.urutan);
    if (itemRows.length > 1) {
      return fail(
        "Tagihan ini berisi beberapa item. Ubah nominal lewat tombol rincian/item pada tabel tagihan.",
      );
    }

    const total = data.nominal - tagihan.nominalDiskon + tagihan.nominalDenda;
    await db.transaction(async (tx) => {
      await tx
        .update(tagihanSpp)
        .set({ nominal: data.nominal, totalTagihan: total })
        .where(eq(tagihanSpp.id, data.tagihanId));
      if (itemRows.length === 1) {
        await tx
          .update(tagihanItem)
          .set({ nominal: data.nominal })
          .where(eq(tagihanItem.id, itemRows[0].id));
      }
    });

    await logActivity({
      userId: session.user.id,
      aksi: "update_nominal_tagihan",
      entitas: "tagihan_spp",
      entitasId: data.tagihanId,
      detail: { nominal: data.nominal, total, catatan: data.catatan ?? null },
    });
    revalidatePath("/admin/pembayaran/tagihan");
    return ok(undefined, "Nominal tagihan diperbarui.");
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
    if (!isMidtransConfigured()) {
      return fail("Pembayaran online belum dikonfigurasi (MIDTRANS_SERVER_KEY kosong). Gunakan pembayaran manual atau hubungi admin.");
    }

    const { tagihan, user: payer } = await authorizeTagihanForUser(tagihanId);

    if (tagihan.status === "paid") {
      return fail("Tagihan ini sudah dibayar.");
    }
    if (tagihan.status === "cancelled" || tagihan.status === "expired") {
      return fail(`Tagihan berstatus ${tagihan.status} dan tidak dapat dibayar.`);
    }

    const [activePayment] = await db
      .select({
        id: pembayaranSpp.id,
        checkoutUrl: pembayaranSpp.checkoutUrl,
        status: pembayaranSpp.status,
      })
      .from(pembayaranSpp)
      .where(
        and(
          eq(pembayaranSpp.tagihanSppId, tagihanId),
          eq(pembayaranSpp.provider, "midtrans"),
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
    const orderId = `${tagihan.nomorTagihan}-${Date.now().toString(36).toUpperCase()}`;

    // Tagihan manual multi-item dikirim sebagai rincian item ke Midtrans.
    // Tagihan SPP tetap satu baris berisi periode (perilaku lama).
    const itemRows = await db
      .select({
        id: tagihanItem.id,
        nama: tagihanItem.nama,
        nominal: tagihanItem.nominal,
      })
      .from(tagihanItem)
      .where(eq(tagihanItem.tagihanSppId, tagihan.id))
      .orderBy(tagihanItem.urutan);
    const jumlahItem = itemRows.reduce((sum, item) => sum + item.nominal, 0);
    const pakaiRincianItem =
      tagihan.sumber === "manual" && itemRows.length > 0 && jumlahItem === tagihan.totalTagihan;

    const snap = await createSnapTransaction({
      orderId,
      grossAmount: tagihan.totalTagihan,
      items: pakaiRincianItem
        ? itemRows.map((item) => ({
            id: item.id,
            name: item.nama.slice(0, 50),
            price: item.nominal,
            quantity: 1,
          }))
        : [
            {
              id: tagihan.nomorTagihan,
              name: `SPP ${labelPeriode(tagihan.periodeBulan, tagihan.periodeTahun)}`,
              price: tagihan.totalTagihan,
              quantity: 1,
            },
          ],
      customer: {
        firstName: santriUser?.name ?? payer.name,
        email: santriUser?.email ?? payer.email,
      },
      finishUrl: `${redirectBase}?status=finish&tagihan=${tagihan.id}`,
      customField1: tagihan.id,
      enabledPayments: enabledPaymentsFromEnv(),
    });

    await db.insert(pembayaranSpp).values({
      tagihanSppId: tagihan.id,
      provider: "midtrans",
      providerOrderId: orderId,
      providerTransactionId: snap.token,
      snapToken: snap.token,
      checkoutUrl: snap.redirect_url,
      status: "pending",
    });

    await db
      .update(tagihanSpp)
      .set({ status: "pending" })
      .where(eq(tagihanSpp.id, tagihan.id));

    await logActivity({
      userId: payer.id,
      aksi: "create_payment_midtrans",
      entitas: "pembayaran_spp",
      detail: { tagihanId: tagihan.id, orderId },
    });

    revalidatePath("/admin/pembayaran/transaksi");
    return ok(
      { checkoutUrl: snap.redirect_url },
      "Transaksi berhasil dibuat, mengarahkan ke halaman pembayaran Midtrans.",
    );
  } catch (error) {
    if (error instanceof AuthorizationError) return fail(error.message);
    if (error instanceof MidtransError) return fail(error.message);
    return toActionError(error);
  }
}

/* ---------------- Batalkan pembayaran online ---------------- */

/**
 * Batalkan pembayaran online yang masih menunggu.
 * Transaksi di Midtrans di-void, tagihan kembali berstatus belum dibayar,
 * sehingga santri/wali bisa memilih metode pembayaran lain.
 */
export async function batalkanPembayaran(
  tagihanId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (!session) return fail("Sesi tidak ditemukan.");

    const [row] = await db
      .select({ tagihan: tagihanSpp })
      .from(tagihanSpp)
      .where(eq(tagihanSpp.id, tagihanId))
      .limit(1);
    if (!row) return fail("Tagihan tidak ditemukan.");

    if (session.user.role === "santri") {
      const santriId = await getSantriProfileId(session.user.id);
      if (row.tagihan.santriId !== santriId) return fail("Tagihan ini bukan milik Anda.");
    } else if (session.user.role === "wali") {
      const waliId = await getWaliProfileId(session.user.id);
      await assertAnakOfWali(waliId, row.tagihan.santriId);
    } else if (session.user.role !== "admin") {
      return fail("Tidak memiliki akses untuk membatalkan pembayaran.");
    }

    if (row.tagihan.status === "paid") return fail("Tagihan sudah lunas, tidak dapat dibatalkan.");
    if (row.tagihan.status !== "pending") {
      return fail("Tidak ada pembayaran aktif yang bisa dibatalkan.");
    }

    const [pembayaran] = await db
      .select()
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

    if (!pembayaran) {
      await db
        .update(tagihanSpp)
        .set({ status: "unpaid" })
        .where(eq(tagihanSpp.id, tagihanId));
      revalidatePath("/santri/pembayaran/tagihan");
      revalidatePath("/wali/pembayaran/tagihan");
      return ok(undefined, "Tagihan dikembalikan ke status belum dibayar.");
    }

    if (pembayaran.provider === "midtrans" && pembayaran.providerOrderId) {
      const hasil = await cancelTransaction(pembayaran.providerOrderId);
      if (hasil.status_code !== "200") {
        const status = await getTransactionStatus(pembayaran.providerOrderId).catch(
          () => null,
        );
        const pesan = (status?.status_message ?? hasil.status_message ?? "").toLowerCase();
        const transaksiBelumAda =
          !status ||
          status.status_code === "404" ||
          pesan.includes("doesn't exist") ||
          pesan.includes("does not exist") ||
          pesan.includes("not found");

        if (!transaksiBelumAda) {
          if (status?.transaction_status) {
            await prosesStatusPembayaran({
              pembayaranId: pembayaran.id,
              status: normalizeMidtransStatus(
                status.transaction_status,
                status.fraud_status,
              ),
              amount: status.gross_amount ? Math.round(Number(status.gross_amount)) : null,
              metode: status.payment_type ?? null,
              transactionId: status.transaction_id ?? null,
              payload: status,
              aktorId: session.user.id,
              aktorAksi: "sinkron_status_saat_batal",
            });
          }
          return fail(
            hasil.status_message ||
              "Transaksi tidak dapat dibatalkan (mungkin sudah dibayar).",
          );
        }
        // Transaksi belum terbentuk di Midtrans (metode belum dipilih) —
        // cukup dibatalkan secara lokal agar tagihan kembali belum dibayar.
      }
    }

    await prosesStatusPembayaran({
      pembayaranId: pembayaran.id,
      status: "cancelled",
      aktorId: session.user.id,
      aktorAksi: "batalkan_pembayaran",
    });

    await logActivity({
      userId: session.user.id,
      aksi: "batalkan_pembayaran",
      entitas: "tagihan_spp",
      entitasId: tagihanId,
      detail: { pembayaranId: pembayaran.id, orderId: pembayaran.providerOrderId },
    });

    if (session.user.role !== "admin") {
      const { notifyUsers, userIdsOfRole } = await import("@/lib/notify");
      await notifyUsers({
        userIds: await userIdsOfRole("admin"),
        type: "pembayaran_dibatalkan",
        title: "Pembayaran SPP dibatalkan",
        message: `${session.user.name} membatalkan pembayaran tagihan ${row.tagihan.nomorTagihan}. Tagihan kembali berstatus belum dibayar.`,
        entitas: "tagihan_spp",
        entitasId: tagihanId,
      });
    }

    revalidatePath("/santri/pembayaran/tagihan");
    revalidatePath("/wali/pembayaran/tagihan");
    revalidatePath("/admin/pembayaran/tagihan");
    revalidatePath("/admin/pembayaran/transaksi");
    return ok(
      undefined,
      "Pembayaran dibatalkan. Tagihan kembali belum dibayar — silakan pilih metode lain.",
    );
  } catch (error) {
    if (error instanceof MidtransError) return fail(error.message);
    return toActionError(error);
  }
}

/* ---------------- Pembayaran manual/cash (Admin) ---------------- */
const markPaidSchema = z.object({
  tagihanId: z.string().min(1),
  metode: z.enum(["cash", "transfer", "qris", "ewallet", "lainnya"]),
  catatan: z.string().trim().max(200).optional(),
});

export async function markPaidManual(
  input: z.input<typeof markPaidSchema>,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat mencatat pembayaran manual.");

    const data = markPaidSchema.parse(input);

    const [tagihan] = await db
      .select({
        status: tagihanSpp.status,
        totalTagihan: tagihanSpp.totalTagihan,
      })
      .from(tagihanSpp)
      .where(eq(tagihanSpp.id, data.tagihanId))
      .limit(1);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (tagihan.status === "paid") return fail("Tagihan sudah berstatus paid.");

    const pembayaranId = await db.transaction(async (tx) => {
      await tx
        .update(tagihanSpp)
        .set({ status: "paid" })
        .where(eq(tagihanSpp.id, data.tagihanId));
      const [row] = await tx
        .insert(pembayaranSpp)
        .values({
          tagihanSppId: data.tagihanId,
          provider: "manual",
          status: "paid",
          paymentMethod: data.metode,
          catatan: data.catatan?.trim() || null,
          dicatatOleh: session.user.id,
          nominalDibayar: tagihan.totalTagihan,
          totalDibayar: tagihan.totalTagihan,
          paidAt: new Date(),
        })
        .returning({ id: pembayaranSpp.id });
      return row.id;
    });

    await logActivity({
      userId: session.user.id,
      aksi: "manual_mark_paid",
      entitas: "tagihan_spp",
      entitasId: data.tagihanId,
      detail: { metode: data.metode, catatan: data.catatan ?? null },
    });

    await terbitkanBuktiPembayaran(pembayaranId);

    revalidatePath("/admin/pembayaran/tagihan");
    revalidatePath("/admin/pembayaran/transaksi");
    return ok(undefined, `Pembayaran ${data.metode} tercatat.`);
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Uji coba sandbox ---------------- */

/**
 * Simulasi pelunasan untuk pengujian lokal tanpa webhook Midtrans.
 * Hanya aktif di mode sandbox/development.
 */
export async function simulasiPembayaranLunas(
  pembayaranId: string,
): Promise<ActionResult<undefined>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") return fail("Hanya admin yang dapat menjalankan simulasi.");
    if (isMidtransProduction()) {
      return fail("Simulasi tidak tersedia saat MIDTRANS_IS_PRODUCTION=true.");
    }

    const [pembayaran] = await db
      .select({
        id: pembayaranSpp.id,
        totalDibayar: pembayaranSpp.totalDibayar,
        nominalDibayar: pembayaranSpp.nominalDibayar,
      })
      .from(pembayaranSpp)
      .where(eq(pembayaranSpp.id, pembayaranId))
      .limit(1);
    if (!pembayaran) return fail("Transaksi tidak ditemukan.");

    const [tagihan] = await db
      .select({ total: tagihanSpp.totalTagihan })
      .from(pembayaranSpp)
      .innerJoin(tagihanSpp, eq(pembayaranSpp.tagihanSppId, tagihanSpp.id))
      .where(eq(pembayaranSpp.id, pembayaranId))
      .limit(1);

    const result = await prosesStatusPembayaran({
      pembayaranId,
      status: "paid",
      amount: pembayaran.nominalDibayar ?? pembayaran.totalDibayar ?? tagihan?.total ?? 0,
      metode: "simulasi",
      aktorId: session.user.id,
      aktorAksi: "simulasi_pembayaran_lunas",
    });
    if (!result) return fail("Transaksi tidak ditemukan.");

    revalidatePath("/admin/pembayaran/transaksi");
    revalidatePath("/admin/pembayaran/tagihan");
    return ok(undefined, "Simulasi berhasil: pembayaran ditandai lunas.");
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Diagnostik kanal pembayaran (Admin) ---------------- */

export type StatusKanal = {
  tipe: string;
  kategori: string | null;
  aktif: boolean;
  minimum: number | null;
  maksimum: number | null;
  catatan: string | null;
};

/**
 * Baca daftar kanal pembayaran Midtrans beserta nominal minimumnya dengan
 * membuat transaksi "probe" bernominal wajar, lalu membatalkannya kembali.
 */
export async function ambilStatusKanalMidtrans(): Promise<ActionResult<StatusKanal[]>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat memeriksa kanal pembayaran.");
    }
    if (!isMidtransConfigured()) {
      return fail("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
    }

    const probeAmount = 500_000;
    const orderId = `PROBE-KANAL-${Date.now().toString(36).toUpperCase()}`;

    const snap = await createSnapTransaction({
      orderId,
      grossAmount: probeAmount,
      items: [
        {
          id: "probe",
          name: "Pemeriksaan kanal pembayaran",
          price: probeAmount,
          quantity: 1,
        },
      ],
      customer: { firstName: "Admin", email: session.user.email },
      finishUrl: process.env.APP_URL ?? "http://localhost:3000",
      customField1: "probe-kanal",
    });

    const detail = await fetchSnapTransactionDetail(snap.token);

    await cancelTransaction(orderId).catch(() => null);

    const kanal: StatusKanal[] = (detail.enabled_payments ?? []).map((c) => ({
      tipe: c.type,
      kategori: c.category ?? null,
      aktif: c.status !== "down",
      minimum: c.minimum_amount ?? null,
      maksimum: c.maximum_amount ?? null,
      catatan: c.va_type ?? null,
    }));

    kanal.sort((a, b) => (a.kategori ?? "").localeCompare(b.kategori ?? "") || a.tipe.localeCompare(b.tipe));

    return ok(kanal, `${kanal.length} kanal terbaca untuk nominal uji Rp${probeAmount.toLocaleString("id-ID")}.`);
  } catch (error) {
    if (error instanceof MidtransError) return fail(error.message);
    return toActionError(error);
  }
}

/* ---------------- Bukti pembayaran ---------------- */

async function authorizePembayaranForUser(pembayaranId: string) {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Sesi tidak ditemukan.");

  const [row] = await db
    .select({ santriId: tagihanSpp.santriId })
    .from(pembayaranSpp)
    .innerJoin(tagihanSpp, eq(pembayaranSpp.tagihanSppId, tagihanSpp.id))
    .where(eq(pembayaranSpp.id, pembayaranId))
    .limit(1);
  if (!row) throw new AuthorizationError("Pembayaran tidak ditemukan.");

  if (session.user.role === "santri") {
    const santriId = await getSantriProfileId(session.user.id);
    if (row.santriId !== santriId) throw new AuthorizationError("Bukti ini bukan milik Anda.");
  } else if (session.user.role === "wali") {
    const waliId = await getWaliProfileId(session.user.id);
    await assertAnakOfWali(waliId, row.santriId);
  } else if (session.user.role !== "admin") {
    throw new AuthorizationError("Tidak memiliki akses ke bukti ini.");
  }

  return session;
}

export async function ambilBuktiPembayaran(
  pembayaranId: string,
): Promise<ActionResult<BuktiPembayaranData>> {
  try {
    await authorizePembayaranForUser(pembayaranId);
    const data = await getBuktiPembayaranData(pembayaranId);
    if (!data) return fail("Bukti pembayaran tidak ditemukan.");
    if (data.status !== "paid") return fail("Bukti hanya tersedia untuk pembayaran yang sudah lunas.");
    return ok(data);
  } catch (error) {
    return toActionError(error);
  }
}

export async function kirimBuktiEmail(
  pembayaranId: string,
): Promise<ActionResult<undefined>> {
  try {
    await authorizePembayaranForUser(pembayaranId);
    if (!isMailerConfigured()) return fail(MAILER_SETUP_HINT);

    const data = await getBuktiPembayaranData(pembayaranId);
    if (!data) return fail("Bukti pembayaran tidak ditemukan.");
    if (data.status !== "paid") return fail("Bukti hanya tersedia untuk pembayaran yang sudah lunas.");

    const terkirim = await terbitkanBuktiPembayaran(pembayaranId, { paksa: true });
    if (!terkirim) return fail("Gagal mengirim email. Periksa konfigurasi SMTP.");
    revalidatePath("/admin/pembayaran/transaksi");
    return ok(
      undefined,
      `Bukti dikirim ke ${data.emailTujuan ?? "email terdaftar"}.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- QRIS (tampilkan QR + URL untuk pembayaran/simulasi) ---------------- */

export type QrPembayaranData = {
  pembayaranId: string;
  orderId: string;
  paymentType: string;
  acquirer: string | null;
  qrisUrl: string;
  expiresAt: string | null;
  checkoutUrl: string | null;
  sandbox: boolean;
};

/**
 * Ambil URL gambar QR QRIS dari transaksi Snap yang masih menunggu pembayaran.
 * URL ini bisa ditampilkan ke pengguna, atau ditempel ke Simulator QRIS Midtrans
 * (kolom "QR Code Image Url") saat pengujian sandbox — bukan Order ID.
 */
export async function ambilQrPembayaran(
  pembayaranId: string,
): Promise<ActionResult<QrPembayaranData>> {
  try {
    await authorizePembayaranForUser(pembayaranId);

    const [row] = await db
      .select({
        provider: pembayaranSpp.provider,
        status: pembayaranSpp.status,
        providerOrderId: pembayaranSpp.providerOrderId,
        providerTransactionId: pembayaranSpp.providerTransactionId,
        snapToken: pembayaranSpp.snapToken,
        checkoutUrl: pembayaranSpp.checkoutUrl,
      })
      .from(pembayaranSpp)
      .where(eq(pembayaranSpp.id, pembayaranId))
      .limit(1);

    if (!row) return fail("Transaksi tidak ditemukan.");
    if (row.provider !== "midtrans") {
      return fail("QRIS hanya tersedia untuk pembayaran online Midtrans.");
    }
    if (!["pending", "processing"].includes(row.status)) {
      return fail("Transaksi ini sudah tidak menunggu pembayaran QR.");
    }

    // snapToken = token Snap asli; kolom providerTransactionId bisa berisi
    // transaction_id Midtrans (berbeda), jadi fallback ke redirect_url.
    const token = row.snapToken ?? snapTokenFromRedirectUrl(row.checkoutUrl);
    if (!token) {
      return fail("Token Snap tidak ditemukan. Buat ulang pembayaran.");
    }

    const detail = await fetchSnapTransactionDetail(token);
    const result = detail.result;
    const qrisUrl = result?.qris_url ?? null;

    if (!qrisUrl) {
      const metode = result?.payment_type;
      if (metode && metode !== "qris") {
        return fail(
          `Transaksi ini memakai metode ${metode}, bukan QRIS. Buka halaman pembayaran dan pilih QRIS/GoPay QR.`,
        );
      }
      return fail(
        "QR belum tersedia. Buka halaman pembayaran Midtrans, pilih QRIS/GoPay QR, lalu coba lagi.",
      );
    }

    return ok(
      {
        pembayaranId,
        orderId: row.providerOrderId ?? "",
        paymentType: result?.payment_type ?? "qris",
        acquirer: result?.qris_acquirer ?? null,
        qrisUrl,
        expiresAt: result?.qris_expiration_raw ?? null,
        checkoutUrl: row.checkoutUrl,
        sandbox: !isMidtransProduction(),
      },
      "QR QRIS berhasil diambil.",
    );
  } catch (error) {
    if (error instanceof AuthorizationError) return fail(error.message);
    if (error instanceof MidtransError) {
      if (error.statusCode === 404) {
        return fail(
          "Transaksi Snap tidak dikenali Midtrans (token lama atau beda akun). Buat pembayaran baru, lalu muat ulang QR.",
        );
      }
      return fail(error.message);
    }
    return toActionError(error);
  }
}
