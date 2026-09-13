"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icons";

export type RiwayatRow = {
  tanggal: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
};

const AWAL_TAMPIL = 10;

export function RiwayatKehadiran({ riwayat }: { riwayat: RiwayatRow[] }) {
  const [open, setOpen] = useState(false);
  const [semua, setSemua] = useState(false);
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

  const rows = semua ? riwayat : riwayat.slice(0, AWAL_TAMPIL);

  return (
    <>
      <button
        ref={triggerRef}
        className="icon-button"
        type="button"
        title="Riwayat pertemuan"
        aria-label="Riwayat pertemuan"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon name="clock" />
      </button>
      {open ? (
        <div
          className="riwayat-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="riwayat-title"
          onClick={() => setOpen(false)}
        >
          <div className="riwayat-modal" onClick={(event) => event.stopPropagation()}>
            <div className="riwayat-header">
              <div>
                <strong id="riwayat-title">Riwayat pertemuan</strong>
                <p className="panel-subtitle">
                  {semua || riwayat.length <= AWAL_TAMPIL
                    ? `${riwayat.length} pertemuan tercatat`
                    : `${AWAL_TAMPIL} pertemuan terakhir`}
                </p>
              </div>
              <button
                ref={closeRef}
                className="table-action danger"
                type="button"
                title="Tutup riwayat"
                aria-label="Tutup riwayat"
                onClick={() => setOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="riwayat-body">
              {riwayat.length === 0 ? (
                <p className="panel-subtitle" style={{ margin: 0 }}>
                  Belum ada catatan kehadiran untuk kelas &amp; mapel ini.
                </p>
              ) : (
                <>
                  <div className="table-shell riwayat-table-shell">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>H</th>
                          <th>I</th>
                          <th>S</th>
                          <th>A</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.tanggal}>
                            <td>
                              <strong>{r.tanggal}</strong>
                            </td>
                            <td>{r.hadir}</td>
                            <td>{r.izin}</td>
                            <td>{r.sakit}</td>
                            <td>{r.alpa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {riwayat.length > AWAL_TAMPIL ? (
                    <div className="riwayat-actions">
                      <button
                        className="button button-outline-primary"
                        type="button"
                        onClick={() => setSemua((value) => !value)}
                      >
                        {semua ? "Tampilkan lebih sedikit" : `Lihat semua (${riwayat.length})`}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
