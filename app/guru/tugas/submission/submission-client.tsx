"use client";

import { useRef, useState, useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { LocalPreviewButton } from "@/components/shared/file-preview";
import {
  gradeSubmissionForm,
  deleteSubmissionFileGuruForm,
  addTugasLampiranForm,
  addTugasLampiranLinkForm,
  deleteTugasLampiranForm,
} from "@/actions/forms";
import { MAX_FILES_PER_SUBMIT, MAX_FILE_SIZE } from "@/lib/upload-limits";
import { ukuranFile } from "@/lib/format";

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
      className="grade-form"
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
        className="grade-score-input"
      />
      <input
        name="feedback"
        defaultValue={existingFeedback ?? ""}
        placeholder="Feedback guru"
        aria-label="Feedback"
        className="grade-feedback-input"
      />
      <button className="table-button" type="submit" disabled={pending}>
        {pending ? "..." : existingNilai === null ? "Nilai" : "Update"}
      </button>
    </form>
  );
}

export function DeleteSubmissionFileButton({ fileId, nama }: { fileId: string; nama: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="table-action danger"
      type="button"
      title={`Hapus ${nama}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus file submission "${nama}"?`)) return;
        const fd = new FormData();
        fd.set("id", fileId);
        startTransition(async () => {
          const result = await deleteSubmissionFileGuruForm(fd);
          showToast(result.ok ? result.message ?? "File dihapus." : result.error ?? "Gagal.");
        });
      }}
    >
      hapus
    </button>
  );
}

export function LampiranManager({
  tugasId,
  jumlahLampiran,
}: {
  tugasId: string;
  jumlahLampiran: number;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="lampiran-manager">
      <div className="file-picker-row">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="file-picker"
          onChange={(event) => {
            const incoming = Array.from(event.target.files ?? []);
            setFiles((prev) => {
              const next = [...prev];
              for (const f of incoming) {
                if (next.length < MAX_FILES_PER_SUBMIT && !next.some((x) => x.name === f.name && x.size === f.size)) {
                  next.push(f);
                }
              }
              return next;
            });
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>
      {files.length > 0 ? (
        <div>
          <p className="panel-subtitle file-selection-note">
            {files.length} file dipilih · total {ukuranFile(totalSize)} — review dulu sebelum
            mengunggah.
          </p>
          <ul className="file-list">
            {files.map((f, index) => (
              <li key={`${f.name}-${f.size}-${index}`}>
                <span className="file-name">{f.name}</span>
                <span className="file-size">{ukuranFile(f.size)}</span>
                {f.size > MAX_FILE_SIZE ? (
                  <span className="file-error">melebihi 10 MB</span>
                ) : (
                  <LocalPreviewButton file={f} />
                )}
                <button type="button" className="file-link" onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                  batal
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="link-upload-row">
        <input
          type="url"
          placeholder="Tambah link lampiran (https://...)"
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          className="link-input"
        />
        <button
          className="button button-primary"
          type="button"
          disabled={pending || (files.length === 0 && linkUrl.trim() === "")}
          onClick={() => {
            if (jumlahLampiran + files.length + (linkUrl.trim() ? 1 : 0) > MAX_FILES_PER_SUBMIT) {
              showToast(`Maksimal ${MAX_FILES_PER_SUBMIT} lampiran per tugas.`);
              return;
            }
            const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
            if (tooBig) {
              showToast(`"${tooBig.name}" melebihi 10 MB.`);
              return;
            }
            startTransition(async () => {
              let gagal = 0;
              let lastError = "";
              for (const f of files) {
                const fd = new FormData();
                fd.set("tugasId", tugasId);
                fd.set("file", f);
                const result = await addTugasLampiranForm(fd);
                if (!result.ok) {
                  gagal++;
                  lastError = result.error ?? "Gagal.";
                }
              }
              if (linkUrl.trim() !== "") {
                const fd = new FormData();
                fd.set("tugasId", tugasId);
                fd.set("url", linkUrl.trim());
                const result = await addTugasLampiranLinkForm(fd);
                if (!result.ok) {
                  gagal++;
                  lastError = result.error ?? "Gagal.";
                }
              }
              setFiles([]);
              setLinkUrl("");
              if (gagal === 0) showToast("Lampiran berhasil ditambahkan.");
              else showToast(`${gagal} lampiran gagal. ${lastError}`);
            });
          }}
        >
          {pending ? "Mengunggah..." : "Tambah lampiran"}
        </button>
      </div>
    </div>
  );
}

export function DeleteLampiranButton({ lampiranId, nama }: { lampiranId: string; nama: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="table-action danger"
      type="button"
      title={`Hapus ${nama}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus lampiran "${nama}"?`)) return;
        const fd = new FormData();
        fd.set("id", lampiranId);
        startTransition(async () => {
          const result = await deleteTugasLampiranForm(fd);
          showToast(result.ok ? result.message ?? "Lampiran dihapus." : result.error ?? "Gagal.");
        });
      }}
    >
      hapus
    </button>
  );
}
