"use client";

import { useState, useTransition } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { ambilBuktiPembayaran, kirimBuktiEmail } from "@/actions/pembayaran/spp";
import type { BuktiPembayaranData } from "@/lib/bukti";
import { rupiah, tanggalWaktuIndo } from "@/lib/format";

type WithLastAutoTable = { lastAutoTable?: { finalY: number } };

function finalY(doc: jsPDF): number {
  return (doc as unknown as WithLastAutoTable).lastAutoTable?.finalY ?? 0;
}

function namaFile(data: BuktiPembayaranData): string {
  const bersih = (s: string) => s.replace(/[^\w-]+/g, "-");
  const jenis = data.sumber === "spp" ? "Bukti-SPP" : "Bukti-Tagihan";
  return `${jenis}-${bersih(data.periodeLabel)}-${bersih(data.santriNama)}.pdf`;
}

function buildBuktiPdf(data: BuktiPembayaranData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 16;
  const C = pageW / 2;
  const spp = data.sumber === "spp";
  const tampilkanItem = data.items.length > 0 && !(spp && data.items.length <= 1);

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(data.namaPesantren.toUpperCase(), C, M + 4, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  if (data.alamatPesantren) {
    doc.text(
      doc.splitTextToSize(data.alamatPesantren, pageW - M * 2) as string[],
      C,
      M + 10,
      { align: "center" },
    );
  }
  const kopY = M + (data.alamatPesantren ? 16 : 11);
  doc.setLineWidth(0.8);
  doc.line(M, kopY, pageW - M, kopY);
  doc.setLineWidth(0.25);
  doc.line(M, kopY + 1.3, pageW - M, kopY + 1.3);

  let y = kopY + 11;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(spp ? "BUKTI PEMBAYARAN SPP" : "BUKTI PEMBAYARAN", C, y, { align: "center" });

  y += 6;
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  const ucapan = spp
    ? `Terima kasih sudah membayar SPP bulan ${data.periodeLabel}. Ini merupakan bukti pembayaran sebesar ${rupiah(data.nominalDibayar ?? data.totalTagihan)}.`
    : `Terima kasih sudah membayar tagihan ${data.nomorTagihan}. Ini merupakan bukti pembayaran sebesar ${rupiah(data.nominalDibayar ?? data.totalTagihan)}.`;
  const ucapanBaris = doc.splitTextToSize(ucapan, pageW - M * 2) as string[];
  doc.text(ucapanBaris, C, y, { align: "center" });

  y += ucapanBaris.length * 5 + 4;
  const baris: [string, string][] = [
    ["Nomor bukti", data.nomorBukti],
    ["Nomor tagihan", data.nomorTagihan],
    ["Nama santri", data.santriNama],
    ["NIS", data.nis],
    ["Kelas", data.kelasNama ?? "—"],
    ["Periode", data.periodeLabel],
    ["Nominal tagihan", rupiah(data.nominal)],
  ];
  if (data.nominalDiskon > 0) baris.push(["Diskon", `- ${rupiah(data.nominalDiskon)}`]);
  if (data.nominalDenda > 0) baris.push(["Denda", `+ ${rupiah(data.nominalDenda)}`]);
  baris.push(
    ["Total dibayar", rupiah(data.nominalDibayar ?? data.totalTagihan)],
    ["Metode pembayaran", data.metodeLabel],
    ["Waktu pembayaran", data.paidAt ? tanggalWaktuIndo(new Date(data.paidAt)) : "—"],
  );
  if (data.dicatatOlehNama) baris.push(["Dicatat oleh", data.dicatatOlehNama]);
  if (data.catatan) baris.push(["Catatan", data.catatan]);

  autoTable(doc, {
    startY: y,
    body: baris.map(([label, value]) => [label, value]),
    theme: "grid",
    styles: {
      font: "times",
      fontSize: 11,
      cellPadding: 2.4,
      lineColor: [80, 80, 80],
      lineWidth: 0.15,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: pageW - M * 2 - 55 },
    },
    margin: { left: M, right: M },
  });

  if (tampilkanItem) {
    autoTable(doc, {
      startY: finalY(doc) + 4,
      head: [["Rincian item", "Nominal"]],
      body: data.items.map((item) => [item.nama, rupiah(item.nominal)]),
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 11,
        cellPadding: 2.4,
        lineColor: [80, 80, 80],
        lineWidth: 0.15,
        textColor: [30, 30, 30],
      },
      headStyles: {
        font: "times",
        fontStyle: "bold",
        fillColor: [240, 240, 240],
        textColor: [30, 30, 30],
      },
      columnStyles: {
        0: { cellWidth: pageW - M * 2 - 40 },
        1: { cellWidth: 40, halign: "right" },
      },
      margin: { left: M, right: M },
    });
  }

  y = finalY(doc) + 14;
  const pageH = doc.internal.pageSize.getHeight();
  if (y > pageH - 40) {
    doc.addPage();
    y = 30;
  }
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("Penerima,", pageW - M - 35, y, { align: "center" });
  doc.text("(............................)", pageW - M - 35, y + 24, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Dokumen ini dihasilkan otomatis oleh sistem ${data.namaPesantren}.`,
    C,
    pageH - 10,
    { align: "center" },
  );

  return doc;
}

export function BuktiButton({
  pembayaranId,
  variant = "icon",
  label = "Bukti",
}: {
  pembayaranId: string;
  variant?: "icon" | "button";
  label?: string;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<BuktiPembayaranData | null>(null);
  const [mengirim, startKirim] = useTransition();
  const spp = data?.sumber === "spp";
  const tampilkanItem = data
    ? data.items.length > 0 && !(spp && data.items.length <= 1)
    : false;

  const buka = () => {
    startTransition(async () => {
      const result = await ambilBuktiPembayaran(pembayaranId);
      if (!result.ok) {
        showToast(result.error ?? "Gagal memuat bukti pembayaran.", "error");
        return;
      }
      setData(result.data);
    });
  };

  const unduhPdf = () => {
    if (!data) return;
    try {
      buildBuktiPdf(data).save(namaFile(data));
      showToast("Bukti pembayaran diunduh.");
    } catch {
      showToast("Gagal membuat PDF.", "error");
    }
  };

  const cetak = () => {
    if (!data) return;
    try {
      const doc = buildBuktiPdf(data);
      doc.autoPrint();
      const url = doc.output("bloburl").toString();
      window.open(url, "_blank");
    } catch {
      showToast("Gagal menyiapkan cetak.", "error");
    }
  };

  const kirimEmail = () => {
    startKirim(async () => {
      const result = await kirimBuktiEmail(pembayaranId);
      showToast(
        result.ok ? result.message ?? "Bukti dikirim." : result.error ?? "Gagal mengirim.",
        result.ok ? "success" : "error",
      );
    });
  };

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          className="button button-secondary"
          disabled={pending}
          onClick={buka}
        >
          <Icon name="receipt" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          className="table-action"
          title="Lihat bukti pembayaran"
          aria-label="Lihat bukti pembayaran"
          disabled={pending}
          onClick={buka}
        >
          <Icon name="receipt" />
        </button>
      )}

      {data ? (
        <div className="preview-overlay" role="dialog" aria-modal="true">
          <div className="preview-modal" style={{ maxWidth: 560 }}>
            <div className="preview-header">
              <div className="preview-title">
                <strong>Bukti pembayaran</strong>
                <span className="panel-subtitle">{data.nomorBukti}</span>
              </div>
              <div className="preview-actions">
                <button type="button" className="table-action" title="Unduh PDF" onClick={unduhPdf}>
                  <Icon name="download" />
                </button>
                <button type="button" className="table-action" title="Cetak" onClick={cetak}>
                  <Icon name="printer" />
                </button>
                <button
                  type="button"
                  className="table-action"
                  title="Kirim ke email"
                  disabled={mengirim}
                  onClick={kirimEmail}
                >
                  <Icon name="bell" />
                </button>
                <button
                  type="button"
                  className="table-action danger"
                  title="Tutup"
                  onClick={() => setData(null)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="preview-body" style={{ padding: 18 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--brand)" }}>
                {spp
                  ? `Terima kasih sudah membayar SPP bulan ${data.periodeLabel} 🙏`
                  : `Terima kasih sudah membayar tagihan ${data.nomorTagihan} 🙏`}
              </p>
              <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 12 }}>
                Ini merupakan bukti pembayaran sebesar{" "}
                <strong>{rupiah(data.nominalDibayar ?? data.totalTagihan)}</strong>.
              </p>
              <div className="table-shell">
                <table className="data-table">
                  <tbody>
                    {[
                      ["Nomor bukti", data.nomorBukti],
                      ["Nama santri", `${data.santriNama} (${data.nis})`],
                      ["Kelas", data.kelasNama ?? "—"],
                      ["Periode", data.periodeLabel],
                      ["Nominal tagihan", rupiah(data.nominal)],
                      ["Total dibayar", rupiah(data.nominalDibayar ?? data.totalTagihan)],
                      ["Metode", data.metodeLabel],
                      [
                        "Waktu",
                        data.paidAt ? tanggalWaktuIndo(new Date(data.paidAt)) : "—",
                      ],
                      ...(data.dicatatOlehNama
                        ? [["Dicatat oleh", data.dicatatOlehNama] as [string, string]]
                        : []),
                      ...(data.catatan
                        ? [["Catatan", data.catatan] as [string, string]]
                        : []),
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ color: "var(--muted)", width: 150 }}>{label}</td>
                        <td>
                          <strong>{value}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tampilkanItem ? (
                <div className="table-shell" style={{ marginTop: 10 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rincian item</th>
                        <th style={{ textAlign: "right" }}>Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={`${item.nama}-${index}`}>
                          <td>{item.nama}</td>
                          <td style={{ textAlign: "right" }}>{rupiah(item.nominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--muted)" }}>
                Email tujuan: {data.emailTujuan ?? "belum ada"} ·{" "}
                {data.sudahDikirim ? "bukti sudah pernah dikirim" : "bukti belum dikirim"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
