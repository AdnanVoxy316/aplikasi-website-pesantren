"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { labelPeriode, tanggalIndo } from "@/lib/format";

export type SantriKehadiranRow = { id: string; nama: string; nis: string };

export type KehadiranRecord = {
  santriId: string;
  tanggal: string;
  status: string;
};

type Mode = "mingguan" | "bulanan" | "rentang";

const KODE: Record<string, string> = {
  hadir: "H",
  izin: "I",
  sakit: "S",
  alpa: "A",
};

const VARIANT: Record<string, string> = {
  hadir: "success",
  izin: "warning",
  sakit: "warning",
  alpa: "danger",
};

function toIso(date: Date): string {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${hari}`;
}

function dariIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function rentangMinggu(iso: string): { dari: string; sampai: string } {
  const tanggal = dariIso(iso);
  const geser = (tanggal.getDay() + 6) % 7;
  const mulai = new Date(tanggal);
  mulai.setDate(tanggal.getDate() - geser);
  const akhir = new Date(mulai);
  akhir.setDate(mulai.getDate() + 6);
  return { dari: toIso(mulai), sampai: toIso(akhir) };
}

function rentangBulan(bulan: string): { dari: string; sampai: string } {
  const [tahun, nomor] = bulan.split("-").map(Number);
  return {
    dari: toIso(new Date(tahun, nomor - 1, 1)),
    sampai: toIso(new Date(tahun, nomor, 0)),
  };
}

function ringkasTanggal(iso: string): string {
  const [, bulan, hari] = iso.split("-");
  return `${Number(hari)}/${Number(bulan)}`;
}

function slug(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ExportKehadiran({
  santri,
  kehadiran,
  namaKelas,
  namaMapel,
  tanggalAwal,
}: {
  santri: SantriKehadiranRow[];
  kehadiran: KehadiranRecord[];
  namaKelas: string;
  namaMapel: string;
  tanggalAwal: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("mingguan");
  const [acuan, setAcuan] = useState(tanggalAwal);
  const [bulan, setBulan] = useState(tanggalAwal.slice(0, 7));
  const [dari, setDari] = useState(tanggalAwal);
  const [sampai, setSampai] = useState(tanggalAwal);
  const [menyiapkan, setMenyiapkan] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const opsiBulan = useMemo(() => {
    const set = new Set(kehadiran.map((k) => k.tanggal.slice(0, 7)));
    return [...set].sort().reverse();
  }, [kehadiran]);

  const periode = useMemo(() => {
    if (mode === "mingguan") return rentangMinggu(acuan);
    if (mode === "bulanan") return rentangBulan(bulan);
    return dari <= sampai ? { dari, sampai } : { dari: sampai, sampai: dari };
  }, [mode, acuan, bulan, dari, sampai]);

  const tanggalList = useMemo(() => {
    const set = new Set(
      kehadiran
        .filter((k) => k.tanggal >= periode.dari && k.tanggal <= periode.sampai)
        .map((k) => k.tanggal),
    );
    return [...set].sort();
  }, [kehadiran, periode]);

  const petaStatus = useMemo(() => {
    const map = new Map<string, string>();
    for (const k of kehadiran) {
      if (k.tanggal >= periode.dari && k.tanggal <= periode.sampai) {
        map.set(`${k.santriId}|${k.tanggal}`, k.status);
      }
    }
    return map;
  }, [kehadiran, periode]);

  const baris = useMemo(
    () =>
      santri.map((s) => {
        let hadir = 0;
        let izin = 0;
        let sakit = 0;
        let alpa = 0;
        const kolom = tanggalList.map((tanggal) => {
          const status = petaStatus.get(`${s.id}|${tanggal}`) ?? null;
          if (status === "hadir") hadir += 1;
          else if (status === "izin") izin += 1;
          else if (status === "sakit") sakit += 1;
          else if (status === "alpa") alpa += 1;
          return status;
        });
        return { ...s, kolom, hadir, izin, sakit, alpa };
      }),
    [santri, tanggalList, petaStatus],
  );

  const labelRentang = `${tanggalIndo(dariIso(periode.dari))} – ${tanggalIndo(dariIso(periode.sampai))}`;
  const adaData = tanggalList.length > 0;

  const unduhExcel = async () => {
    if (!adaData) return;
    setMenyiapkan(true);
    try {
      type XlsxModule = typeof import("xlsx");
      const mod = (await import("xlsx")) as XlsxModule & { default?: XlsxModule };
      const XLSX = mod.default ?? mod;
      const isi: (string | number)[][] = [
        [`Kehadiran ${namaKelas} — ${namaMapel}`],
        [`Periode: ${labelRentang} | H = Hadir, I = Izin, S = Sakit, A = Alpa`],
        [],
        ["Nama", "NIS", ...tanggalList, "Hadir", "Izin", "Sakit", "Alpa"],
        ...baris.map((b) => [
          b.nama,
          b.nis,
          ...b.kolom.map((status) => (status ? KODE[status] : "")),
          b.hadir,
          b.izin,
          b.sakit,
          b.alpa,
        ]),
      ];
      const sheet = XLSX.utils.aoa_to_sheet(isi);
      sheet["!cols"] = [
        { wch: 24 },
        { wch: 12 },
        ...tanggalList.map(() => ({ wch: 6 })),
        { wch: 7 },
        { wch: 6 },
        { wch: 6 },
        { wch: 6 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Kehadiran");
      XLSX.writeFile(
        workbook,
        `kehadiran-${slug(namaKelas)}-${slug(namaMapel)}-${periode.dari}-${periode.sampai}.xlsx`,
      );
    } finally {
      setMenyiapkan(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="icon-button"
        type="button"
        title="Ekspor kehadiran"
        aria-label="Ekspor kehadiran"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon name="download" />
      </button>
      {open ? (
        <div
          className="riwayat-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="riwayat-modal export-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="riwayat-header">
              <div>
                <strong id="export-title">Ekspor kehadiran</strong>
                <p className="panel-subtitle">
                  {namaKelas} — {namaMapel}
                </p>
              </div>
              <div className="export-actions">
                <button
                  className="table-action"
                  type="button"
                  title="Unduh sebagai Excel"
                  aria-label="Unduh sebagai Excel"
                  disabled={!adaData || menyiapkan}
                  onClick={unduhExcel}
                >
                  <Icon name="download" />
                </button>
                <button
                  ref={closeRef}
                  className="table-action danger"
                  type="button"
                  title="Tutup pratinjau"
                  aria-label="Tutup pratinjau"
                  onClick={() => setOpen(false)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="riwayat-body">
              <div className="export-controls">
                <label className="export-label" htmlFor="export-mode">
                  Periode
                </label>
                <select
                  id="export-mode"
                  className="export-select"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as Mode)}
                >
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                  <option value="rentang">Rentang tanggal</option>
                </select>
                {mode === "mingguan" ? (
                  <input
                    type="date"
                    className="date-input"
                    value={acuan}
                    aria-label="Pilih tanggal dalam minggu"
                    onChange={(event) => setAcuan(event.target.value || tanggalAwal)}
                  />
                ) : null}
                {mode === "bulanan" ? (
                  <select
                    className="export-select"
                    value={bulan}
                    aria-label="Pilih bulan"
                    onChange={(event) => setBulan(event.target.value)}
                  >
                    {opsiBulan.length === 0 ? (
                      <option value={bulan}>Belum ada data</option>
                    ) : (
                      opsiBulan.map((value) => {
                        const [tahun, nomor] = value.split("-").map(Number);
                        return (
                          <option key={value} value={value}>
                            {labelPeriode(nomor, tahun)}
                          </option>
                        );
                      })
                    )}
                  </select>
                ) : null}
                {mode === "rentang" ? (
                  <span className="export-range">
                    <input
                      type="date"
                      className="date-input"
                      value={dari}
                      aria-label="Tanggal mulai"
                      onChange={(event) => setDari(event.target.value || tanggalAwal)}
                    />
                    <span>s.d.</span>
                    <input
                      type="date"
                      className="date-input"
                      value={sampai}
                      aria-label="Tanggal akhir"
                      onChange={(event) => setSampai(event.target.value || tanggalAwal)}
                    />
                  </span>
                ) : null}
              </div>
              <p className="export-note">
                <span>
                  {labelRentang} · {tanggalList.length} pertemuan
                </span>
                <span>Legenda: H = Hadir · I = Izin · S = Sakit · A = Alpa</span>
              </p>
              {adaData ? (
                <div className="table-shell riwayat-table-shell export-table-shell">
                  <table className="data-table export-table">
                    <thead>
                      <tr>
                        <th>Santri</th>
                        {tanggalList.map((tanggal) => (
                          <th key={tanggal} className="export-date-col">
                            {ringkasTanggal(tanggal)}
                          </th>
                        ))}
                        <th className="export-total-col">H</th>
                        <th className="export-total-col">I</th>
                        <th className="export-total-col">S</th>
                        <th className="export-total-col">A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baris.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.nama}</strong>
                            <div className="person-meta">NIS {b.nis}</div>
                          </td>
                          {b.kolom.map((status, index) =>
                            status ? (
                              <td key={tanggalList[index]} className="export-date-col">
                                <span className={`status-badge ${VARIANT[status] ?? "neutral"}`}>
                                  {KODE[status]}
                                </span>
                              </td>
                            ) : (
                              <td key={tanggalList[index]} className="export-date-col">
                                <span className="export-empty-cell">–</span>
                              </td>
                            ),
                          )}
                          <td className="export-total-col">{b.hadir}</td>
                          <td className="export-total-col">{b.izin}</td>
                          <td className="export-total-col">{b.sakit}</td>
                          <td className="export-total-col">{b.alpa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="export-empty">
                  Belum ada catatan kehadiran pada periode ini. Pilih periode lain atau
                  catat kehadiran terlebih dahulu.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
