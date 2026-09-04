"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { deleteTugasForm } from "@/actions/forms";

export function DeleteTugasButton({ tugasId, judul }: { tugasId: string; judul: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="table-action danger"
      type="button"
      title="Hapus tugas"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus tugas "${judul}" beserta semua submission-nya?`)) return;
        const fd = new FormData();
        fd.set("id", tugasId);
        startTransition(async () => {
          const result = await deleteTugasForm(fd);
          showToast(result.ok ? result.message ?? "Tugas dihapus." : result.error ?? "Gagal.");
        });
      }}
    >
      <Icon name="trash" />
    </button>
  );
}
