import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth/session";
import { listLaporanPembayaran, type LaporanPembayaranRow } from "@/db/queries/admin";
import { labelMetode, labelProvider } from "@/lib/pembayaran";
import { labelPeriode } from "@/lib/format";
import { paymentStatusLabel } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = [
  "No",
  "NIS",
  "Nama santri",
  "Kelas",
  "Jenis",
  "Periode",
  "Nominal",
  "Diskon",
  "Denda",
  "Total tagihan",
  "Status",
  "Metode",
  "Tanggal bayar",
  "Dicatat oleh",
  "Catatan",
];

function toNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function rowToArray(row: LaporanPembayaranRow, index: number): (string | number)[] {
  const lunas = row.statusTagihan === "paid";
  return [
    index + 1,
    row.nis,
    row.santriNama,
    row.kelasNama ?? "-",
    row.jenis ?? "-",
    labelPeriode(row.periodeBulan, row.periodeTahun),
    row.nominal,
    row.nominalDiskon,
    row.nominalDenda,
    row.totalTagihan,
    paymentStatusLabel(row.statusTagihan),
    lunas
      ? labelMetode(row.provider, row.paymentMethod)
      : labelProvider(row.provider),
    row.paidAt ? new Date(row.paidAt).toLocaleString("id-ID") : "-",
    row.dicatatOlehNama ?? "-",
    row.catatan ?? "-",
  ];
}

function buildSheet(rows: LaporanPembayaranRow[]): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [HEADERS, ...rows.map(rowToArray)];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 26 },
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 13 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
  ];
  return sheet;
}

function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") ?? "semua";
  const now = new Date();
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();

  const filter: Parameters<typeof listLaporanPembayaran>[0] = {};
  let label = "Semua periode";

  if (mode === "bulan") {
    filter.bulan = toNumber(params.get("bulan"), bulanIni);
    filter.tahun = toNumber(params.get("tahun"), tahunIni);
    label = labelPeriode(filter.bulan, filter.tahun);
  } else if (mode === "rentang") {
    filter.dari = {
      bulan: toNumber(params.get("dariBulan"), 1),
      tahun: toNumber(params.get("dariTahun"), tahunIni),
    };
    filter.sampai = {
      bulan: toNumber(params.get("sampaiBulan"), bulanIni),
      tahun: toNumber(params.get("sampaiTahun"), tahunIni),
    };
    label = `${labelPeriode(filter.dari.bulan, filter.dari.tahun)} - ${labelPeriode(filter.sampai.bulan, filter.sampai.tahun)}`;
  }

  try {
    const rows = await listLaporanPembayaran(filter);

    const workbook = XLSX.utils.book_new();

    const lunas = rows.filter((r) => r.statusTagihan === "paid");
    const rekap = [
      ["Laporan pembayaran tagihan"],
      ["Periode", label],
      ["Dibuat", new Date().toLocaleString("id-ID")],
      [],
      ["Total tagihan", rows.length],
      ["Total nominal tagihan", rows.reduce((s, r) => s + r.totalTagihan, 0)],
      ["Sudah lunas", lunas.length],
      ["Total dibayar", lunas.reduce((s, r) => s + (r.nominalDibayar ?? r.totalTagihan), 0)],
      ["Belum dibayar", rows.length - lunas.length],
      [
        "Nominal belum dibayar",
        rows.filter((r) => r.statusTagihan !== "paid").reduce((s, r) => s + r.totalTagihan, 0),
      ],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rekap), "Rekap");

    const grouped = new Map<string, { label: string; rows: LaporanPembayaranRow[] }>();
    for (const row of rows) {
      const key = `${row.periodeTahun}-${String(row.periodeBulan).padStart(2, "0")}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          label: labelPeriode(row.periodeBulan, row.periodeTahun),
          rows: [],
        });
      }
      grouped.get(key)!.rows.push(row);
    }

    if (grouped.size === 0) {
      XLSX.utils.book_append_sheet(
        workbook,
        buildSheet([]),
        safeSheetName("Tidak ada data"),
      );
    } else {
      const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      for (const [, group] of sorted) {
        XLSX.utils.book_append_sheet(
          workbook,
          buildSheet(group.rows),
          safeSheetName(group.label),
        );
      }
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `laporan-pembayaran-${slug || "semua"}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Gagal membuat laporan Excel:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal membuat laporan Excel." },
      { status: 500 },
    );
  }
}
