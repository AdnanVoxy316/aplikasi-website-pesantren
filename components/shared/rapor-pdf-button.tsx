"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { fetchRaporPdfData, type RaporPdfPayload } from "@/actions/guru/rapor";
import { tanggalLengkapIndo } from "@/lib/format";
import { PreviewModal } from "./file-preview";

type WithLastAutoTable = { lastAutoTable?: { finalY: number } };

function finalY(doc: jsPDF): number {
  return (doc as unknown as WithLastAutoTable).lastAutoTable?.finalY ?? 0;
}

function namaFile(data: RaporPdfPayload): string {
  const bersih = (s: string) => s.replace(/[^\w-]+/g, "-");
  return `Rapor_${bersih(data.tahunAjaranLabel)}_${bersih(data.semester)}_${bersih(data.santriNama)}.pdf`;
}

/* Membuat PDF rapor ala rapor sekolah: kop pesantren, identitas, tabel nilai,
   rekap kehadiran, catatan, dan blok tanda tangan (kolom kosong untuk ttd basah).
   withFooter: catatan kaki hanya tampil pada mode pratinjau, tidak ikut terunduh. */
function buildRaporPdf(data: RaporPdfPayload, withFooter = false): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const C = pageW / 2;

  /* --- Kop pesantren (Times New Roman — standar dokumen nasional) --- */
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(data.settings.namaPesantren.toUpperCase(), C, M + 4, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  /* Alamat bisa melipat beberapa baris — garis kop digeser dinamis agar tidak tertimpa.
     Jarak judul → alamat diperlebar (≈ spacing 1.35). */
  const alamatBaris = data.settings.alamat
    ? (doc.splitTextToSize(data.settings.alamat, pageW - M * 2) as string[])
    : [];
  if (alamatBaris.length > 0) {
    doc.text(alamatBaris, C, M + 11, { align: "center" });
  }
  const kopY =
    M + (alamatBaris.length > 0 ? 11 + (alamatBaris.length - 1) * 5 + 3 : 11);
  doc.setLineWidth(0.9);
  doc.line(M, kopY, pageW - M, kopY);
  doc.setLineWidth(0.25);
  doc.line(M, kopY + 1.4, pageW - M, kopY + 1.4);

  /* --- Judul --- */
  let y = kopY + 9;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("RAPORT SANTRI", C, y, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  y += 5.5;
  doc.text(
    `Semester ${data.semester === "ganjil" ? "Ganjil" : "Genap"} - Tahun Ajaran ${data.tahunAjaranLabel}`,
    C,
    y,
    { align: "center" },
  );

  /* --- Identitas santri --- */
  y += 9;
  const identitas: [string, string][] = [
    ["Nama Peserta Didik", data.santriNama],
    ["NIS", data.nis],
    ["Kelas", data.kelasNama],
    ["Semester", data.semester === "ganjil" ? "Ganjil" : "Genap"],
    ["Tahun Ajaran", data.tahunAjaranLabel],
  ];
  const kolomKiri = identitas.slice(0, 3);
  const kolomKanan = identitas.slice(3);
  const barisIdentitas = Math.max(kolomKiri.length, kolomKanan.length);
  for (let i = 0; i < barisIdentitas; i += 1) {
    const kiri = kolomKiri[i];
    const kanan = kolomKanan[i];
    if (kiri) {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(kiri[0], M + 1, y);
      doc.text(":", M + 38, y);
      doc.setFont("times", "bold");
      doc.text(kiri[1], M + 41, y);
    }
    if (kanan) {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(kanan[0], C + 4, y);
      doc.text(":", C + 40, y);
      doc.setFont("times", "bold");
      doc.text(kanan[1], C + 43, y);
    }
    y += 5.8;
  }

  /* --- Tabel nilai --- */
  y += 2;
  const nilaiDinilai = data.nilai.filter((n) => n.nilaiAkhir !== null);
  const rataRata =
    nilaiDinilai.length > 0
      ? Math.round(
          (nilaiDinilai.reduce((s, n) => s + (n.nilaiAkhir ?? 0), 0) / nilaiDinilai.length) * 100,
        ) / 100
      : null;

  autoTable(doc, {
    startY: y,
    head: [["No", "Mata Pelajaran", "Kategori", "Nilai Akhir"]],
    body: [
      ...data.nilai.map((n, i) => [
        String(i + 1),
        n.nama,
        n.kategori === "pesantren" ? "Muatan Pesantren" : "Umum",
        n.nilaiAkhir !== null ? String(n.nilaiAkhir) : "—",
      ]),
      [
        {
          content: "Rata-rata",
          colSpan: 3,
          styles: { fontStyle: "bold", halign: "center", valign: "middle" },
        },
        { content: rataRata !== null ? String(rataRata) : "—", styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: {
      font: "times",
      fontSize: 12,
      cellPadding: 2.2,
      lineColor: [60, 60, 60],
      lineWidth: 0.15,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [226, 234, 226],
      textColor: [23, 53, 46],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 40, halign: "center" },
      3: { cellWidth: 26, halign: "center", fontStyle: "bold" },
    },
    margin: { left: M, right: M },
  });

  /* --- Rekap kehadiran --- */
  y = finalY(doc) + 6;
  autoTable(doc, {
    startY: y,
    head: [["Kehadiran", "Hadir", "Izin", "Sakit", "Alpa"]],
    body: [
      [
        {
          content: "Jumlah hari",
          styles: { fontStyle: "bold", halign: "center", valign: "middle" },
        },
        String(data.kehadiran.hadir),
        String(data.kehadiran.izin),
        String(data.kehadiran.sakit),
        String(data.kehadiran.alpa),
      ],
    ],
    theme: "grid",
    styles: {
      font: "times",
      fontSize: 12,
      cellPadding: 2.2,
      lineColor: [60, 60, 60],
      lineWidth: 0.15,
      textColor: [30, 30, 30],
      halign: "center",
    },
    headStyles: {
      fillColor: [226, 234, 226],
      textColor: [23, 53, 46],
      fontStyle: "bold",
    },
    columnStyles: { 0: { cellWidth: 50 } },
    margin: { left: M, right: M },
  });

  /* --- Catatan wali kelas --- */
  y = finalY(doc) + 7;
  if (data.catatan) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Catatan Wali Kelas:", M, y);
    doc.setFont("times", "normal");
    const baris = doc.splitTextToSize(data.catatan, pageW - M * 2);
    doc.text(baris, M, y + 5);
    y += 5 + baris.length * 5.2 + 4;
  }

  /* --- Blok tanda tangan --- */
  /* Format: dua kolom (kiri orang tua/wali, kanan wali kelas) masing-masing rata tengah
     dalam kolomnya, lalu blok "Mengetahui, Pimpinan Ponpes" rata tengah halaman paling bawah.
     Jarak antar baris dalam blok dipadatkan (~spacing 1.15 Word). */
  y += 10;
  if (y > pageH - 84) {
    doc.addPage();
    y = 25;
  }
  const tanggalTtd = tanggalLengkapIndo(new Date(data.generatedAtIso));
  const kota = data.settings.kotaRapor;
  const jarakTtd = 26;
  const LINE = 5;
  /* Kolom digeser dari tengah agar tidak terlihat mepet di tengah halaman */
  const xKiri = (M + C) / 2 - 14;
  const xKanan = (C + pageW - M) / 2 + 14;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  /* Baris 1: "Mengetahui," (kiri) sejajar dengan "Bandung, 5 September 2026" (kanan) */
  doc.text("Mengetahui,", xKiri, y, { align: "center" });
  doc.text(`${kota ? `${kota}, ` : ""}${tanggalTtd}`, xKanan, y, { align: "center" });

  /* Baris 2: "Orang Tua/Wali," (kiri) sejajar dengan "Wali Kelas," (kanan) */
  const yRole = y + LINE;
  doc.text("Orang Tua/Wali,", xKiri, yRole, { align: "center" });
  doc.text("Wali Kelas,", xKanan, yRole, { align: "center" });

  /* Baris 3: nama orang tua/wali (relasi) atau garis kosong, sejajar nama wali kelas */
  const yNama = yRole + jarakTtd;
  if (data.orangTuaWaliNama) {
    doc.setFont("times", "bold");
    doc.text(data.orangTuaWaliNama, xKiri, yNama, { align: "center" });
    const lebar = doc.getTextWidth(data.orangTuaWaliNama);
    doc.setLineWidth(0.3);
    doc.line(xKiri - lebar / 2, yNama + 1.2, xKiri + lebar / 2, yNama + 1.2);
  } else {
    doc.setLineWidth(0.3);
    doc.line(xKiri - 22.5, yNama + 1.2, xKiri + 22.5, yNama + 1.2);
  }

  if (data.waliKelasNama) {
    doc.setFont("times", "bold");
    doc.text(data.waliKelasNama, xKanan, yNama, { align: "center" });
    const lebar = doc.getTextWidth(data.waliKelasNama);
    doc.setLineWidth(0.3);
    doc.line(xKanan - lebar / 2, yNama + 1.2, xKanan + lebar / 2, yNama + 1.2);
  }

  /* Tengah bawah — di bawah nama-nama agar hierarki penulisan rapi:
     "Mengetahui," lalu "Pimpinan Ponpes", kemudian nama pimpinan (bold + garis). */
  const yCenter = yNama + 8;
  doc.setFont("times", "normal");
  doc.text("Mengetahui,", C, yCenter, { align: "center" });
  doc.text("Pimpinan Ponpes", C, yCenter + LINE, { align: "center" });
  if (data.settings.namaPimpinan) {
    doc.setFont("times", "bold");
    doc.text(data.settings.namaPimpinan, C, yCenter + LINE + jarakTtd, { align: "center" });
    const lebar = doc.getTextWidth(data.settings.namaPimpinan);
    doc.setLineWidth(0.3);
    doc.line(
      C - lebar / 2,
      yCenter + LINE + 1.2 + jarakTtd,
      C + lebar / 2,
      yCenter + LINE + 1.2 + jarakTtd,
    );
  }

  /* --- Catatan kaki (hanya pratinjau, tidak ada pada file yang diunduh) --- */
  if (withFooter) {
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Dokumen rapor dihasilkan oleh sistem ${data.settings.namaPesantren}. Tanda tangan ditandatangani secara manual.`,
      C,
      pageH - 8,
      { align: "center" },
    );
  }

  return doc;
}

export function RaporPdfButton({ raporId }: { raporId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  const unduh = () => {
    startTransition(async () => {
      const result = await fetchRaporPdfData(raporId);
      if (!result.ok) {
        showToast(result.error ?? "Gagal memuat data rapor.");
        return;
      }
      try {
        buildRaporPdf(result.data).save(namaFile(result.data));
        showToast("Rapor PDF berhasil diunduh.");
      } catch {
        showToast("Gagal membuat file PDF.");
      }
    });
  };
  return (
    <button
      type="button"
      className={`table-action${pending ? " is-loading" : ""}`}
      title="Unduh PDF"
      aria-label="Unduh rapor PDF"
      disabled={pending}
      onClick={unduh}
    >
      <Icon name="download" />
    </button>
  );
}

/* Tombol ramah pemula untuk santri: pratinjau PDF dulu di layar, baru unduh. */
export function SantriRaporActions({ raporId }: { raporId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfNama, setPdfNama] = useState("rapor.pdf");
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const load = (mode: "preview" | "download") => {
    startTransition(async () => {
      const result = await fetchRaporPdfData(raporId);
      if (!result.ok) {
        showToast(result.error ?? "Gagal memuat data rapor.");
        return;
      }
      try {
        const doc = buildRaporPdf(result.data, mode === "preview");
        const nama = namaFile(result.data);
        if (mode === "download") {
          doc.save(nama);
          showToast("Rapor PDF berhasil diunduh.");
          return;
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const url = doc.output("bloburl").toString();
        urlRef.current = url;
        setPdfNama(nama);
        setPdfUrl(url);
      } catch {
        showToast("Gagal membuat file PDF.");
      }
    });
  };

  const close = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPdfUrl(null);
  };

  return (
    <div className="inline-actions">
      <button
        type="button"
        className="button button-secondary"
        disabled={pending}
        onClick={() => load("preview")}
      >
        <Icon name="eye" />
        Lihat PDF
      </button>
      <button
        type="button"
        className="button button-primary"
        disabled={pending}
        onClick={() => load("download")}
      >
        <Icon name="download" />
        Unduh PDF
      </button>
      {pdfUrl ? (
        <PreviewModal src={pdfUrl} nama={pdfNama} onClose={close} hideDownload />
      ) : null}
    </div>
  );
}
