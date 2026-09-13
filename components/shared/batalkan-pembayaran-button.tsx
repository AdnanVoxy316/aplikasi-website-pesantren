"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { batalkanPembayaranForm } from "@/actions/forms";

export function BatalkanPembayaranButton({
  tagihanId,
  variant = "button",
  label = "Batalkan",
}: {
  tagihanId: string;
  variant?: "icon" | "button";
  label?: string;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  const jalankan = () => {
    if (
      !window.confirm(
        "Batalkan pembayaran ini? Transaksi online yang belum dibayar akan dibatalkan, lalu tagihan kembali berstatus belum dibayar sehingga bisa memilih metode lain.",
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", tagihanId);
    startTransition(async () => {
      const result = await batalkanPembayaranForm(fd);
      showToast(
        result.ok ? result.message ?? "Pembayaran dibatalkan." : result.error ?? "Gagal.",
        result.ok ? "success" : "error",
      );
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="table-action danger"
        title="Batalkan pembayaran"
        aria-label="Batalkan pembayaran"
        disabled={pending}
        onClick={jalankan}
      >
        <Icon name="close" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="button button-secondary"
      disabled={pending}
      onClick={jalankan}
    >
      <Icon name="close" />
      {pending ? "Membatalkan..." : label}
    </button>
  );
}
