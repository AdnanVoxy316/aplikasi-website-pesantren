"use client";

import { useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { bayarSekarangForm } from "@/actions/forms";

export function BayarButton({ tagihanId, label = "Bayar Sekarang" }: { tagihanId: string; label?: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="button button-primary"
      type="button"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", tagihanId);
        startTransition(async () => {
          const result = await bayarSekarangForm(fd);
          if (result.ok && result.data?.checkoutUrl) {
            showToast(result.message ?? "Mengarahkan ke Mayar...");
            window.location.href = result.data.checkoutUrl;
          } else {
            showToast(result.ok ? "Checkout tidak tersedia." : result.error ?? "Gagal.");
          }
        });
      }}
    >
      {pending ? "Memproses..." : label}
    </button>
  );
}
