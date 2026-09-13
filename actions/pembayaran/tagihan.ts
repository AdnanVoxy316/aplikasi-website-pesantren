"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  jenisPembayaran,
  santriProfile,
  tagihanItem,
  tagihanSpp,
  user,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";
import { rupiah } from "@/lib/format";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";

/** Status tagihan yang masih boleh diubah isinya (belum ada pembayaran berjalan). */
const STATUS_BISA_DIISI = ["draft", "unpaid", "expired", "failed"] as const;

const itemInputSchema = z.object({
  jenisPembayaranId: z.string().trim().min(1, "Jenis pembayaran wajib dipilih"),
  nominal: z.coerce
    .number()
    .int("Nominal harus bilangan bulat")
    .gt(0, "Nominal harus lebih dari 0"),
  keterangan: z.string().trim().max(200).optional(),
});

const createTagihanSchema = z.object({
  santriId: z.string().trim().min(1, "Santri wajib dipilih"),
  tahunAjaranId: z.string().trim().min(1, "Tahun ajaran wajib dipilih"),
  jatuhTempo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal jatuh tempo tidak valid")
    .optional(),
  catatan: z.string().trim().max(200).optional(),
  items: z
    .array(itemInputSchema)
    .min(1, "Tambahkan minimal satu item")
    .max(12, "Maksimal 12 item per tagihan"),
});

function revalidateTagihanPages() {
  revalidatePath("/admin/pembayaran/tagihan");
  revalidatePath("/santri/pembayaran/tagihan");
  revalidatePath("/wali/pembayaran/tagihan");
  revalidatePath("/admin/pembayaran/transaksi");
}

/** Hitung ulang nominal & total header dari item yang ada. */
async function syncTotalTagihan(tagihanId: string): Promise<number> {
  const [header] = await db
    .select({
      nominalDiskon: tagihanSpp.nominalDiskon,
      nominalDenda: tagihanSpp.nominalDenda,
    })
    .from(tagihanSpp)
    .where(eq(tagihanSpp.id, tagihanId))
    .limit(1);
  if (!header) return 0;

  const [agg] = await db
    .select({ total: sql<number>`coalesce(sum(${tagihanItem.nominal}), 0)` })
    .from(tagihanItem)
    .where(eq(tagihanItem.tagihanSppId, tagihanId));

  const nominal = Number(agg?.total ?? 0);
  const total = nominal - header.nominalDiskon + header.nominalDenda;
  await db
    .update(tagihanSpp)
    .set({ nominal, totalTagihan: total })
    .where(eq(tagihanSpp.id, tagihanId));
  return total;
}

type TagihanRingkas = {
  id: string;
  nomorTagihan: string;
  status: string;
  santriId: string;
};

async function ambilTagihan(tagihanId: string): Promise<TagihanRingkas | null> {
  const [row] = await db
    .select({
      id: tagihanSpp.id,
      nomorTagihan: tagihanSpp.nomorTagihan,
      status: tagihanSpp.status,
      santriId: tagihanSpp.santriId,
    })
    .from(tagihanSpp)
    .where(eq(tagihanSpp.id, tagihanId))
    .limit(1);
  return row ?? null;
}

function pesanStatusTidakBisaDiubah(status: string): string {
  if (status === "paid") return "Tagihan yang sudah dibayar tidak dapat diubah.";
  if (status === "cancelled") return "Tagihan yang dibatalkan tidak dapat diubah.";
  if (status === "pending" || status === "processing") {
    return "Tagihan sedang menunggu pembayaran. Batalkan pembayaran berjalan dulu sebelum mengubah item.";
  }
  return `Tagihan berstatus ${status} tidak dapat diubah.`;
}

/* ---------------- Buat tagihan manual multi-item (Admin) ---------------- */

export async function createTagihanManual(
  input: z.input<typeof createTagihanSchema>,
): Promise<ActionResult<{ id: string; nomorTagihan: string }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat membuat tagihan.");
    }
    const data = createTagihanSchema.parse(input);

    const [santri] = await db
      .select({
        id: santriProfile.id,
        userId: santriProfile.userId,
        nama: user.name,
      })
      .from(santriProfile)
      .innerJoin(user, eq(santriProfile.userId, user.id))
      .where(eq(santriProfile.id, data.santriId))
      .limit(1);
    if (!santri) return fail("Santri tidak ditemukan.");

    const jenisIds = Array.from(new Set(data.items.map((i) => i.jenisPembayaranId)));
    const jenisRows = await db
      .select({
        id: jenisPembayaran.id,
        nama: jenisPembayaran.nama,
        isActive: jenisPembayaran.isActive,
      })
      .from(jenisPembayaran)
      .where(inArray(jenisPembayaran.id, jenisIds));
    const jenisMap = new Map(jenisRows.map((j) => [j.id, j]));

    for (const item of data.items) {
      const jenis = jenisMap.get(item.jenisPembayaranId);
      if (!jenis) return fail("Ada jenis pembayaran yang tidak ditemukan.");
      if (!jenis.isActive) {
        return fail(`Jenis "${jenis.nama}" sedang nonaktif dan tidak dapat dipakai.`);
      }
    }

    const total = data.items.reduce((sum, item) => sum + item.nominal, 0);
    const now = new Date();
    const periodeBulan = now.getMonth() + 1;
    const periodeTahun = now.getFullYear();
    const nomorTagihan = `TGH-${periodeTahun}${String(periodeBulan).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const created = await db.transaction(async (tx) => {
      const [header] = await tx
        .insert(tagihanSpp)
        .values({
          nomorTagihan,
          santriId: santri.id,
          tahunAjaranId: data.tahunAjaranId,
          sumber: "manual",
          periodeBulan,
          periodeTahun,
          nominal: total,
          nominalDiskon: 0,
          nominalDenda: 0,
          totalTagihan: total,
          jatuhTempo: data.jatuhTempo ? new Date(`${data.jatuhTempo}T23:59:59`) : null,
          status: "unpaid",
          createdBy: session.user.id,
        })
        .returning({ id: tagihanSpp.id });

      await tx.insert(tagihanItem).values(
        data.items.map((item, index) => {
          const jenis = jenisMap.get(item.jenisPembayaranId)!;
          return {
            tagihanSppId: header.id,
            jenisPembayaranId: item.jenisPembayaranId,
            nama: jenis.nama,
            nominal: item.nominal,
            keterangan: item.keterangan?.trim() || data.catatan?.trim() || null,
            urutan: index + 1,
          };
        }),
      );

      return header;
    });

    await logActivity({
      userId: session.user.id,
      aksi: "create_tagihan_manual",
      entitas: "tagihan_spp",
      entitasId: created.id,
      detail: {
        nomorTagihan,
        santriId: santri.id,
        total,
        items: data.items.map((i) => ({
          jenisPembayaranId: i.jenisPembayaranId,
          nominal: i.nominal,
        })),
      },
    });

    const { notifyUsers, userIdsOfWaliForSantri } = await import("@/lib/notify");
    await notifyUsers({
      userIds: [santri.userId, ...(await userIdsOfWaliForSantri(santri.id))],
      type: "tagihan_baru",
      title: "Tagihan baru tersedia",
      message: `Tagihan ${nomorTagihan} sebesar ${rupiah(total)} sudah bisa dibayarkan.`,
      entitas: "tagihan_spp",
      entitasId: created.id,
    });

    revalidateTagihanPages();
    return ok(
      { id: created.id, nomorTagihan },
      `Tagihan ${nomorTagihan} dibuat (${data.items.length} item, total ${rupiah(total)}).`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

/* ---------------- Kelola item tagihan (Admin) ---------------- */

const tambahItemSchema = z.object({
  tagihanId: z.string().trim().min(1),
  jenisPembayaranId: z.string().trim().min(1, "Jenis pembayaran wajib dipilih"),
  nominal: z.coerce
    .number()
    .int("Nominal harus bilangan bulat")
    .gt(0, "Nominal harus lebih dari 0"),
  keterangan: z.string().trim().max(200).optional(),
});

export async function tambahItemTagihan(
  input: z.input<typeof tambahItemSchema>,
): Promise<ActionResult<{ totalTagihan: number }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah item tagihan.");
    }
    const data = tambahItemSchema.parse(input);

    const tagihan = await ambilTagihan(data.tagihanId);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (!STATUS_BISA_DIISI.includes(tagihan.status as never)) {
      return fail(pesanStatusTidakBisaDiubah(tagihan.status));
    }

    const [jenis] = await db
      .select({
        id: jenisPembayaran.id,
        nama: jenisPembayaran.nama,
        isActive: jenisPembayaran.isActive,
      })
      .from(jenisPembayaran)
      .where(eq(jenisPembayaran.id, data.jenisPembayaranId))
      .limit(1);
    if (!jenis) return fail("Jenis pembayaran tidak ditemukan.");
    if (!jenis.isActive) return fail(`Jenis "${jenis.nama}" sedang nonaktif.`);

    const [terakhir] = await db
      .select({ urutan: sql<number>`coalesce(max(${tagihanItem.urutan}), 0)` })
      .from(tagihanItem)
      .where(eq(tagihanItem.tagihanSppId, tagihan.id));

    await db.insert(tagihanItem).values({
      tagihanSppId: tagihan.id,
      jenisPembayaranId: jenis.id,
      nama: jenis.nama,
      nominal: data.nominal,
      keterangan: data.keterangan?.trim() || null,
      urutan: Number(terakhir?.urutan ?? 0) + 1,
    });

    const total = await syncTotalTagihan(tagihan.id);

    await logActivity({
      userId: session.user.id,
      aksi: "tambah_item_tagihan",
      entitas: "tagihan_spp",
      entitasId: tagihan.id,
      detail: { jenisPembayaranId: jenis.id, nominal: data.nominal, total },
    });

    revalidateTagihanPages();
    return ok(
      { totalTagihan: total },
      `Item "${jenis.nama}" ditambahkan. Total tagihan kini ${rupiah(total)}.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

const ubahItemSchema = z.object({
  itemId: z.string().trim().min(1),
  nominal: z.coerce
    .number()
    .int("Nominal harus bilangan bulat")
    .gt(0, "Nominal harus lebih dari 0"),
  keterangan: z.string().trim().max(200).optional(),
});

export async function ubahItemTagihan(
  input: z.input<typeof ubahItemSchema>,
): Promise<ActionResult<{ totalTagihan: number }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat mengubah item tagihan.");
    }
    const data = ubahItemSchema.parse(input);

    const [item] = await db
      .select({
        id: tagihanItem.id,
        nama: tagihanItem.nama,
        tagihanSppId: tagihanItem.tagihanSppId,
      })
      .from(tagihanItem)
      .where(eq(tagihanItem.id, data.itemId))
      .limit(1);
    if (!item) return fail("Item tagihan tidak ditemukan.");

    const tagihan = await ambilTagihan(item.tagihanSppId);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (!STATUS_BISA_DIISI.includes(tagihan.status as never)) {
      return fail(pesanStatusTidakBisaDiubah(tagihan.status));
    }

    await db
      .update(tagihanItem)
      .set({
        nominal: data.nominal,
        keterangan: data.keterangan?.trim() || null,
      })
      .where(eq(tagihanItem.id, item.id));

    const total = await syncTotalTagihan(tagihan.id);

    await logActivity({
      userId: session.user.id,
      aksi: "ubah_item_tagihan",
      entitas: "tagihan_spp",
      entitasId: tagihan.id,
      detail: { itemId: item.id, nama: item.nama, nominal: data.nominal, total },
    });

    revalidateTagihanPages();
    return ok(
      { totalTagihan: total },
      `Nominal item "${item.nama}" diubah. Total tagihan kini ${rupiah(total)}.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}

export async function hapusItemTagihan(
  itemId: string,
): Promise<ActionResult<{ totalTagihan: number }>> {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return fail("Hanya admin yang dapat menghapus item tagihan.");
    }

    const [item] = await db
      .select({
        id: tagihanItem.id,
        nama: tagihanItem.nama,
        tagihanSppId: tagihanItem.tagihanSppId,
      })
      .from(tagihanItem)
      .where(eq(tagihanItem.id, itemId))
      .limit(1);
    if (!item) return fail("Item tagihan tidak ditemukan.");

    const tagihan = await ambilTagihan(item.tagihanSppId);
    if (!tagihan) return fail("Tagihan tidak ditemukan.");
    if (!STATUS_BISA_DIISI.includes(tagihan.status as never)) {
      return fail(pesanStatusTidakBisaDiubah(tagihan.status));
    }

    const rows = await db
      .select({ id: tagihanItem.id })
      .from(tagihanItem)
      .where(eq(tagihanItem.tagihanSppId, tagihan.id))
      .orderBy(asc(tagihanItem.urutan));
    if (rows.length <= 1) {
      return fail("Item terakhir tidak dapat dihapus — batalkan tagihan bila tidak diperlukan.");
    }

    await db.delete(tagihanItem).where(eq(tagihanItem.id, item.id));
    const total = await syncTotalTagihan(tagihan.id);

    await logActivity({
      userId: session.user.id,
      aksi: "hapus_item_tagihan",
      entitas: "tagihan_spp",
      entitasId: tagihan.id,
      detail: { itemId: item.id, nama: item.nama, total },
    });

    revalidateTagihanPages();
    return ok(
      { totalTagihan: total },
      `Item "${item.nama}" dihapus. Total tagihan kini ${rupiah(total)}.`,
    );
  } catch (error) {
    return toActionError(error);
  }
}
