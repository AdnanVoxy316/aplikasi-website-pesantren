"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { authClient } from "@/lib/auth/client";

/* Batas idle (menit) dan durasi countdown (detik) bisa dioverride lewat env
   untuk pengujian cepat di development, mis. NEXT_PUBLIC_BATAS_IDLE_MENIT=0.1 */
const BATAS_IDLE_MS =
  (Number(process.env.NEXT_PUBLIC_BATAS_IDLE_MENIT) || 30) * 60 * 1000;
const PERINGATAN_MS =
  (Number(process.env.NEXT_PUBLIC_SESI_PERINGATAN_DETIK) || 60) * 1000;
const KUNCI_AKTIVITAS = "lms-aktivitas-terakhir";
const JEDA_TULIS_BERSAMA_MS = 5000;

type Fase = "jalan" | "peringatan";

export function SessionGuard() {
  const [fase, setFase] = useState<Fase>("jalan");
  const [sisaDetik, setSisaDetik] = useState(Math.ceil(PERINGATAN_MS / 1000));
  const aktivitasLokal = useRef(0);
  const tulisBersamaTerakhir = useRef(0);
  const keluarDipanggil = useRef(false);

  const catatAktivitas = useCallback(() => {
    const kini = Date.now();
    aktivitasLokal.current = kini;
    if (kini - tulisBersamaTerakhir.current > JEDA_TULIS_BERSAMA_MS) {
      tulisBersamaTerakhir.current = kini;
      try {
        localStorage.setItem(KUNCI_AKTIVITAS, String(kini));
      } catch {
        /* penyimpanan bisa diblokir; timer lokal tetap jalan */
      }
    }
  }, []);

  const keluar = useCallback(() => {
    if (keluarDipanggil.current) return;
    keluarDipanggil.current = true;
    try {
      localStorage.removeItem(KUNCI_AKTIVITAS);
    } catch {
      /* abaikan */
    }
    try {
      new BroadcastChannel("lms-sesi").postMessage("berakhir");
    } catch {
      /* abaikan */
    }
    void authClient.signOut().finally(() => {
      window.location.replace("/login?alasan=sesi-berakhir");
    });
  }, []);

  useEffect(() => {
    aktivitasLokal.current = Date.now();
    const peristiwa = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
    ] as const;
    for (const nama of peristiwa) {
      document.addEventListener(nama, catatAktivitas, { passive: true });
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("lms-sesi");
      channel.onmessage = () => {
        keluarDipanggil.current = true;
        window.location.replace("/login?alasan=sesi-berakhir");
      };
    } catch {
      /* Browser lama tanpa BroadcastChannel: tab lain mengejar via /get-session */
    }

    const verifikasiSesi = async () => {
      if (keluarDipanggil.current) return;
      try {
        const res = await fetch("/api/auth/get-session", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as {
          user?: unknown;
        } | null;
        if (!data?.user) keluar();
      } catch {
        /* jaringan gagal — jangan memaksa keluar */
      }
    };

    const saatTerlihat = () => {
      if (document.visibilityState !== "visible") return;
      catatAktivitas();
      void verifikasiSesi();
    };
    const saatHalamanKembali = (event: PageTransitionEvent) => {
      if (event.persisted) saatTerlihat();
    };

    document.addEventListener("visibilitychange", saatTerlihat);
    window.addEventListener("pageshow", saatHalamanKembali);

    const pemantau = window.setInterval(() => {
      if (keluarDipanggil.current) return;
      let aktivitasBersama = 0;
      try {
        aktivitasBersama = Number(localStorage.getItem(KUNCI_AKTIVITAS)) || 0;
      } catch {
        /* abaikan */
      }
      const terakhir = Math.max(aktivitasLokal.current, aktivitasBersama);
      const idle = Date.now() - terakhir;

      if (idle >= BATAS_IDLE_MS) {
        keluar();
        return;
      }
      if (idle >= BATAS_IDLE_MS - PERINGATAN_MS) {
        setFase("peringatan");
        setSisaDetik(Math.max(0, Math.ceil((BATAS_IDLE_MS - idle) / 1000)));
        return;
      }
      setFase((kini) => (kini === "jalan" ? kini : "jalan"));
    }, 1000);

    return () => {
      for (const nama of peristiwa) {
        document.removeEventListener(nama, catatAktivitas);
      }
      document.removeEventListener("visibilitychange", saatTerlihat);
      window.removeEventListener("pageshow", saatHalamanKembali);
      window.clearInterval(pemantau);
      channel?.close();
    };
  }, [catatAktivitas, keluar]);

  const lanjutkan = () => {
    catatAktivitas();
    setFase("jalan");
    setSisaDetik(Math.ceil(PERINGATAN_MS / 1000));
  };

  if (fase === "jalan") return null;

  return (
    <div className="sesi-overlay" role="presentation">
      <div
        className="sesi-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sesi-judul"
        aria-describedby="sesi-deskripsi"
      >
        <span className="sesi-icon" aria-hidden="true">
          <Icon name="alert" />
        </span>
        <h3 id="sesi-judul">Sesi akan berakhir</h3>
        <p id="sesi-deskripsi">
          Tidak ada aktivitas terdeteksi. Sesi akan ditutup dalam{" "}
          <strong>{sisaDetik}</strong> detik. Klik lanjutkan bila Anda masih
          berada di halaman ini.
        </p>
        <div className="sesi-actions">
          <button
            className="button button-primary"
            type="button"
            autoFocus
            onClick={lanjutkan}
          >
            Lanjutkan sesi
          </button>
          <button
            className="button button-outline-primary"
            type="button"
            onClick={keluar}
          >
            Keluar sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
