"use client";

import { useTransition } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { fetchRaporPdfData, type RaporPdfPayload } from "@/actions/guru/rapor";
import { tanggalLengkapIndo } from "@/lib/format";

type WithLastAutoTable = { lastAutoTable?: { finalY: number } };

function finalY(doc: jsPDF): number {
  return (doc as unknown as WithLastAutoTable).lastAutoTable?.finalY ?? 0;
}

function namaFile(data: RaporPdfPayload): string {
  const bersih = (s: string) => s.replace(/[^\w-]+/g, "-");
  return `Rapor_${bersih(data.tahunAjaranLabel)}_${bersih(data.semester)}_${bersih(data.santriNama)}.pdf`;
}

/* Membuat PDF rapor ala rapor sekolah: kop pesantren, identitas, tabel nilai,
   rekap kehadiran, catatan, dan blok tanda tangan (kolom kosong untuk ttd basah). */
function buildRaporPdf(data: RaporPdfPayload): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const C = pageW / 2;

  /* --- Kop pesantren --- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(data.settings.namaPesantren.toUpperCase(), C, M + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (data.settings.alamat) {
    doc.text(doc.splitTextToSize(data.settings.alamat, pageW - M * 2), C, M + 9.5, {
      align: "center",
    });
  }
  const kopY = M + (data.settings.alamat ? 14.5 : 10);
  doc.setLineWidth(0.9);
  doc.line(M, kopY, pageW - M, kopY);
  doc.setLineWidth(0.25);
  doc.line(M, kopY + 1.4, pageW - M, kopY + 1.4);

  /* --- Judul --- */
  let y = kopY + 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("LAPORAN HASIL BELAJAR", C, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  y += 5.5;
  doc.text(
    `(RAPOR) — Semester ${data.semester === "ganjil" ? "Ganjil (1)" : "Genap (2)"} · Tahun Ajaran ${data.tahunAjaranLabel}`,
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
    ["Semester", data.semester === "ganjil" ? "Ganjil (1)" : "Genap (2)"],
    ["Tahun Ajaran", data.tahunAjaranLabel],
  ];
  const kolomKiri = identitas.slice(0, 3);
  const kolomKanan = identitas.slice(3);
  const barisIdentitas = Math.max(kolomKiri.length, kolomKanan.length);
  for (let i = 0; i < barisIdentitas; i += 1) {
    const kiri = kolomKiri[i];
    const kanan = kolomKanan[i];
    if (kiri) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(kiri[0], M + 1, y);
      doc.text(":", M + 38, y);
      doc.setFont("helvetica", "bold");
      doc.text(kiri[1], M + 41, y);
    }
    if (kanan) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(kanan[0], C + 4, y);
      doc.text(":", C + 40, y);
      doc.setFont("helvetica", "bold");
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
        "",
        { content: "Rata-rata", styles: { fontStyle: "bold", halign: "right" } },
        "",
        { content: rataRata !== null ? String(rataRata) : "—", styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
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
        { content: "Jumlah hari", styles: { fontStyle: "bold" } },
        String(data.kehadiran.hadir),
        String(data.kehadiran.izin),
        String(data.kehadiran.sakit),
        String(data.kehadiran.alpa),
      ],
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
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
    columnStyles: { 0: { halign: "left", cellWidth: 50 } },
    margin: { left: M, right: M },
  });

  /* --- Catatan wali kelas --- */
  y = finalY(doc) + 7;
  if (data.catatan) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Catatan Wali Kelas:", M, y);
    doc.setFont("helvetica", "normal");
    const baris = doc.splitTextToSize(data.catatan, pageW - M * 2);
    doc.text(baris, M, y + 5);
    y += 5 + baris.length * 4.6 + 4;
  }

  /* --- Blok tanda tangan (kolom kosong untuk tanda tangan basah) --- */
  if (y > pageH - 62) {
    doc.addPage();
    y = 25;
  }
  const tanggalTtd = tanggalLengkapIndo(new Date(data.generatedAtIso));
  const kota = data.settings.kotaRapor;
  const jarakTtd = 26;

  /* Kanan: wali kelas */
  const xKanan = pageW - M - 62;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${kota ? `${kota}, ` : ""}${tanggalTtd}`, xKanan + 62, y, { align: "right" });
  doc.text("Wali Kelas,", xKanan + 62, y + 5, { align: "right" });
  if (data.waliKelasNama) {
    doc.setFont("helvetica", "bold");
    doc.text(data.waliKelasNama, xKanan + 62, y + 5 + jarakTtd, { align: "right" });
    const lebar = doc.getTextWidth(data.waliKelasNama);
    doc.setLineWidth(0.3);
    doc.line(xKanan + 62 - lebar, y + 6.2 + jarakTtd, xKanan + 62, y + 6.2 + jarakTtd);
  }

  /* Kiri: pimpinan pesantren */
  doc.setFont("helvetica", "normal");
  doc.text("Mengetahui,", M, y + 5);
  doc.text("Pimpinan Pesantren,", M, y + 10);
  if (data.settings.namaPimpinan) {
    doc.setFont("helvetica", "bold");
    doc.text(data.settings.namaPimpinan, M, y + 10 + jarakTtd);
    const lebar = doc.getTextWidth(data.settings.namaPimpinan);
    doc.setLineWidth(0.3);
    doc.line(M, y + 11.2 + jarakTtd, M + lebar, y + 11.2 + jarakTtd);
  }

  /* --- Catatan kaki --- */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Dokumen rapor dihasilkan oleh sistem ${data.settings.namaPesantren}. Tanda tangan ditandatangani secara manual.`,
    C,
    pageH - 8,
    { align: "center" },
  );

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
