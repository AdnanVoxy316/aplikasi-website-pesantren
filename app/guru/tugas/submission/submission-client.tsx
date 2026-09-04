"use client";

import { useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { gradeSubmissionForm } from "@/actions/forms";

export function GradeForm({
  submissionId,
  existingNilai,
  existingFeedback,
}: {
  submissionId: string;
  existingNilai: number | null;
  existingFeedback: string | null;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        fd.set("submissionId", submissionId);
        startTransition(async () => {
          const result = await gradeSubmissionForm(fd);
          showToast(result.ok ? result.message ?? "Nilai disimpan." : result.error ?? "Gagal.");
        });
      }}
      style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
    >
      <input
        name="nilai"
        type="number"
        min={0}
        max={100}
        step="0.1"
        required
        defaultValue={existingNilai ?? ""}
        placeholder="0-100"
        aria-label="Nilai submission"
        style={{
          width: 70,
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid var(--line)",
          fontSize: 12,
          textAlign: "center",
        }}
      />
      <input
        name="feedback"
        defaultValue={existingFeedback ?? ""}
        placeholder="Feedback guru"
        aria-label="Feedback"
        style={{
          flex: 1,
          minWidth: 140,
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid var(--line)",
          fontSize: 12,
        }}
      />
      <button className="table-button" type="submit" disabled={pending}>
        {pending ? "..." : existingNilai === null ? "Nilai" : "Update"}
      </button>
    </form>
  );
}
