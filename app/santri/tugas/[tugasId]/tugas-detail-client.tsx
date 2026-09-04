"use client";

import { useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { submitFileForm, submitLinkForm, deleteSubmissionForm } from "@/actions/forms";

export function SubmitFileForm({ tugasId }: { tugasId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await submitFileForm(fd);
          showToast(result.ok ? result.message ?? "File terkirim." : result.error ?? "Gagal.");
        });
      }}
    >
      <input type="hidden" name="tugasId" value={tugasId} />
      <div className="field">
        <label htmlFor="sf-file">
          Pilih file (.doc/.docx/.pdf/.jpg/.png — maks 10MB)
        </label>
        <input
          id="sf-file"
          name="file"
          type="file"
          required
          accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
          style={{ marginBottom: 10, fontSize: 12 }}
        />
      </div>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Mengunggah..." : "Kumpulkan file"}
      </button>
    </form>
  );
}

export function SubmitLinkForm({ tugasId }: { tugasId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await submitLinkForm(fd);
          showToast(result.ok ? result.message ?? "Link terkirim." : result.error ?? "Gagal.");
          if (result.ok) form.reset();
        });
      }}
    >
      <input type="hidden" name="tugasId" value={tugasId} />
      <div className="field">
        <label htmlFor="sl-url">URL tugas (Google Drive, YouTube, dll)</label>
        <input id="sl-url" name="url" type="url" required placeholder="https://..." style={{ marginBottom: 10 }} />
      </div>
      <button className="button button-secondary" type="submit" disabled={pending}>
        {pending ? "Mengirim..." : "Kumpulkan link"}
      </button>
    </form>
  );
}

export function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="table-action danger"
      type="button"
      title="Hapus submission"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Hapus submission ini? Hanya bisa sebelum deadline.")) return;
        const fd = new FormData();
        fd.set("id", submissionId);
        startTransition(async () => {
          const result = await deleteSubmissionForm(fd);
          showToast(result.ok ? result.message ?? "Submission dihapus." : result.error ?? "Gagal.");
        });
      }}
    >
      hapus
    </button>
  );
}
