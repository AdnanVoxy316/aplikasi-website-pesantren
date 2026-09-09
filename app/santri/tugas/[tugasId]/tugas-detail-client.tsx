"use client";

import { useRef, useState, useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { LocalPreviewButton } from "@/components/shared/file-preview";
import {
  submitFileForm,
  submitLinkForm,
  deleteSubmissionForm,
  deleteOwnSubmissionFileForm,
  removeSubmissionLinkForm,
} from "@/actions/forms";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_FILES_PER_SUBMIT,
  MAX_FILE_SIZE,
} from "@/lib/upload-limits";
import { ukuranFile } from "@/lib/format";

export function SubmitFileForm({ tugasId }: { tugasId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    let skipped = 0;
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_FILES_PER_SUBMIT) {
        skipped++;
        continue;
      }
      if (!next.some((x) => x.name === f.name && x.size === f.size)) {
        next.push(f);
      }
    }
    setFiles(next);
    if (skipped > 0) {
      showToast(`Maksimal ${MAX_FILES_PER_SUBMIT} file per tugas — sebagian dilewati.`, "warning");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="upload-form">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_UPLOAD_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
        className="file-picker"
        onChange={(event) => addFiles(event.target.files)}
      />
      {files.length > 0 ? (
        <div className="selected-files">
          <p className="panel-subtitle file-selection-note">
            {files.length}/{MAX_FILES_PER_SUBMIT} file dipilih · total {ukuranFile(totalSize)} —
            review dulu sebelum mengirim.
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
                <button
                  type="button"
                  className="file-link"
                  onClick={() => removeAt(index)}
                  disabled={pending}
                >
                  batal
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        className="button button-primary"
        type="button"
        disabled={pending || files.length === 0}
        onClick={() => {
          const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
          if (tooBig) {
            showToast(`"${tooBig.name}" melebihi 10 MB — hapus dari daftar dahulu.`, "error");
            return;
          }
          startTransition(async () => {
            let sukses = 0;
            let gagal = 0;
            let lastError = "";
            const failedFiles: File[] = [];
            for (let i = 0; i < files.length; i++) {
              setProgress(`Mengunggah ${i + 1}/${files.length}: ${files[i].name}`);
              const fd = new FormData();
              fd.set("tugasId", tugasId);
              fd.set("file", files[i]);
              try {
                const result = await submitFileForm(fd);
                if (result.ok) {
                  sukses++;
                } else {
                  gagal++;
                  lastError = result.error ?? "Gagal.";
                  failedFiles.push(files[i]);
                }
              } catch {
                gagal++;
                lastError = "Koneksi bermasalah. Coba lagi.";
                failedFiles.push(files[i]);
              }
            }
            setProgress("");
            setFiles(failedFiles);
            if (gagal === 0) {
              showToast(
                sukses === 1
                  ? "File berhasil dikumpulkan."
                  : `${sukses} file berhasil dikumpulkan.`,
              );
            } else if (sukses === 0) {
              showToast(lastError, "error");
            } else {
              showToast(`${sukses} file terkirim, ${gagal} gagal. File yang gagal tetap dipilih agar bisa dicoba lagi.`, "warning");
            }
          });
        }}
      >
        {pending ? progress || "Mengunggah..." : `Kumpulkan ${files.length > 1 ? `${files.length} file` : "file"}`}
      </button>
    </div>
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
          try {
            const result = await submitLinkForm(fd);
            showToast(
              result.ok ? result.message ?? "Link terkirim." : result.error ?? "Gagal.",
              result.ok ? "success" : "error",
            );
            if (result.ok) form.reset();
          } catch {
            showToast("Link tidak dapat dikirim. Coba lagi.", "error");
          }
        });
      }}
    >
      <input type="hidden" name="tugasId" value={tugasId} />
      <div className="field link-form">
        <label htmlFor="sl-url">URL tugas (Google Drive, YouTube, dll)</label>
        <input id="sl-url" name="url" type="url" required placeholder="https://..." className="link-input" />
      </div>
      <button className="button button-secondary" type="submit" disabled={pending}>
        {pending ? "Mengirim..." : "Kumpulkan link"}
      </button>
    </form>
  );
}

export function RemoveLinkButton({ submissionId }: { submissionId: string }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="table-action danger"
      type="button"
      title="Hapus link"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Hapus link dari submission ini? File yang sudah diunggah tetap ada.")) return;
        const fd = new FormData();
        fd.set("id", submissionId);
        startTransition(async () => {
          try {
            const result = await removeSubmissionLinkForm(fd);
            showToast(
              result.ok ? result.message ?? "Link dihapus." : result.error ?? "Gagal.",
              result.ok ? "success" : "error",
            );
          } catch {
            showToast("Link tidak dapat dihapus. Coba lagi.", "error");
          }
        });
      }}
    >
      hapus link
    </button>
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
        if (!window.confirm("Hapus submission ini beserta semua file dan linknya? Hanya bisa sebelum deadline.")) return;
        const fd = new FormData();
        fd.set("id", submissionId);
        startTransition(async () => {
          try {
            const result = await deleteSubmissionForm(fd);
            showToast(
              result.ok ? result.message ?? "Submission dihapus." : result.error ?? "Gagal.",
              result.ok ? "success" : "error",
            );
          } catch {
            showToast("Submission tidak dapat dihapus. Coba lagi.", "error");
          }
        });
      }}
    >
      hapus semua
    </button>
  );
}

export function DeleteFileButton({
  submissionId,
  fileId,
  nama,
}: {
  submissionId: string;
  fileId: string;
  nama: string;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="table-action danger"
      type="button"
      title={`Hapus ${nama}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus file "${nama}"?`)) return;
        const fd = new FormData();
        fd.set("submissionId", submissionId);
        fd.set("fileId", fileId);
        startTransition(async () => {
          try {
            const result = await deleteOwnSubmissionFileForm(fd);
            showToast(
              result.ok ? result.message ?? "File dihapus." : result.error ?? "Gagal.",
              result.ok ? "success" : "error",
            );
          } catch {
            showToast("File tidak dapat dihapus. Coba lagi.", "error");
          }
        });
      }}
    >
      hapus
    </button>
  );
}
