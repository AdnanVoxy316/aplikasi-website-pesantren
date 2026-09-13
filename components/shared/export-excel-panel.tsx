"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import { BULAN } from "@/lib/format";

type Mode = "bulan" | "rentang" | "semua";

export function ExportExcelPanel() {
  const now = new Date();
  const [mode, setMode] = useState<Mode>("rentang");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [dariBulan, setDariBulan] = useState(1);
  const [dariTahun, setDariTahun] = useState(now.getFullYear());
  const [sampaiBulan, setSampaiBulan] = useState(now.getMonth() + 1);
  const [sampaiTahun, setSampaiTahun] = useState(now.getFullYear());

  const unduh = () => {
    const params = new URLSearchParams({
      mode,
      bulan: String(bulan),
      tahun: String(tahun),
      dariBulan: String(dariBulan),
      dariTahun: String(dariTahun),
      sampaiBulan: String(sampaiBulan),
      sampaiTahun: String(sampaiTahun),
    });
    window.location.href = `/api/admin/pembayaran/export?${params.toString()}`;
  };

  const inputStyle = {
    padding: "9px 11px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    fontSize: 12,
  };

  const opsiBulan = BULAN.map((nama, index) => (
    <option key={nama} value={index + 1}>
      {nama}
    </option>
  ));
  const opsiTahun = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="form-card" style={{ marginBottom: 15 }}>
      <h2 className="form-card-title">
        <span style={{ display: "inline-flex", verticalAlign: "-3px", marginRight: 6 }}>
          <Icon name="download" />
        </span>
        Unduh laporan Excel
      </h2>
      <p className="form-card-description">
        Data pembayaran (cash, transfer, maupun online) lengkap dengan status lunas/belum,
        dipisah per bulan dalam satu file Excel.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          alignItems: "end",
        }}
      >
        <div className="field">
          <label htmlFor="x-mode">Rentang</label>
          <select
            id="x-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as Mode)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="bulan">Per bulan</option>
            <option value="rentang">Rentang bulan</option>
            <option value="semua">Semua riwayat</option>
          </select>
        </div>

        {mode === "bulan" ? (
          <>
            <div className="field">
              <label htmlFor="x-bulan">Bulan</label>
              <select
                id="x-bulan"
                value={bulan}
                onChange={(event) => setBulan(Number(event.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {opsiBulan}
              </select>
            </div>
            <div className="field">
              <label htmlFor="x-tahun">Tahun</label>
              <select
                id="x-tahun"
                value={tahun}
                onChange={(event) => setTahun(Number(event.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {opsiTahun.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        {mode === "rentang" ? (
          <>
            <div className="field">
              <label htmlFor="x-dari-bulan">Dari bulan</label>
              <select
                id="x-dari-bulan"
                value={dariBulan}
                onChange={(event) => setDariBulan(Number(event.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {opsiBulan}
              </select>
            </div>
            <div className="field">
              <label htmlFor="x-dari-tahun">Dari tahun</label>
              <select
                id="x-dari-tahun"
                value={dariTahun}
                onChange={(event) => setDariTahun(Number(event.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {opsiTahun.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="x-sampai-bulan">Sampai bulan</label>
              <select
                id="x-sampai-bulan"
                value={sampaiBulan}
                onChange={(event) => setSampaiBulan(Number(event.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {opsiBulan}
              </select>
            </div>
            <div className="field">
              <label htmlFor="x-sampai-tahun">Sampai tahun</label>
              <select
                id="x-sampai-tahun"
                value={sampaiTahun}
                onChange={(event) => setSampaiTahun(Number(event.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {opsiTahun.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div className="field">
          <button type="button" className="button button-primary" onClick={unduh}>
            <Icon name="download" />
            Unduh Excel
          </button>
        </div>
      </div>
    </div>
  );
}
