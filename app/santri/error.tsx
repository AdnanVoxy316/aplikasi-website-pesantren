"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/lib/icons";

export default function SantriError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="route-state-page">
      <section className="panel route-state-card" role="alert">
        <span className="route-state-icon">
          <Icon name="alert" />
        </span>
        <h1>Halaman belum dapat dimuat</h1>
        <p>Terjadi kendala saat mengambil data. Coba lagi atau kembali ke dashboard santri.</p>
        <div className="inline-actions">
          <button className="button button-primary" type="button" onClick={() => reset()}>
            Coba lagi
          </button>
          <Link className="button button-secondary" href="/santri">
            Ke dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
