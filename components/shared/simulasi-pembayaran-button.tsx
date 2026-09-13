"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { simulasiPembayaranLunasForm } from "@/actions/forms";

export function SimulasiPembayaranButton({ pembayaranId }: { pembayaranId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="table-action"
      title="Simulasi lunas (mode sandbox)"
      aria-label="Simulasi lunas"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            "Tandai transaksi ini lunas lewat simulasi? Hanya untuk uji coba sandbox.",
          )
        )
          return;
        const fd = new FormData();
        fd.set("pembayaranId", pembayaranId);
        startTransition(async () => {
          const result = await simulasiPembayaranLunasForm(fd);
          showToast(
            result.ok ? result.message ?? "Simulasi berhasil." : result.error ?? "Gagal.",
            result.ok ? "success" : "error",
          );
        });
      }}
    >
      <Icon name="sparkle" />
    </button>
  );
}
