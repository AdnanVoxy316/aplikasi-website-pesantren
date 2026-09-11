"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { OfficePreview, TextPreview } from "./office-preview";

type PreviewKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "word"
  | "powerpoint"
  | "spreadsheet"
  | "unsupported";

function detectKind(nama: string): PreviewKind {
  const ext = nama.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "ogg", "mov", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (["txt", "csv", "md", "json", "log", "xml", "html", "htm"].includes(ext)) return "text";
  if (ext === "docx") return "word";
  if (ext === "pptx") return "powerpoint";
  if (["xlsx", "xls"].includes(ext)) return "spreadsheet";
  return "unsupported";
}

const KIND_LABEL: Record<PreviewKind, string> = {
  image: "Gambar",
  pdf: "Dokumen PDF",
  video: "Video",
  audio: "Audio",
  text: "Teks",
  word: "Dokumen Word",
  powerpoint: "Presentasi PowerPoint",
  spreadsheet: "Spreadsheet",
  unsupported: "File",
};

function PreviewBody({ src, nama, kind }: { src: string; nama: string; kind: PreviewKind }) {
  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={nama} className="preview-media" />;
  }
  if (kind === "pdf") {
    return <iframe src={src} title={nama} className="preview-frame" />;
  }
  if (kind === "text") return <TextPreview src={src} />;
  if (kind === "word" || kind === "powerpoint" || kind === "spreadsheet") {
    return <OfficePreview src={src} kind={kind} />;
  }
  if (kind === "video") {
    return <video src={src} controls className="preview-media" />;
  }
  if (kind === "audio") {
    return (
      <div className="preview-audio">
        <audio src={src} controls />
      </div>
    );
  }
  return (
    <div className="preview-fallback">
      <Icon name="file" />
      <p>
        Preview otomatis belum tersedia untuk format <strong>.{nama.split(".").pop()}</strong>{" "}
        ({KIND_LABEL[kind]}). Silakan unduh untuk membuka file.
      </p>
      <a href={src} target="_blank" rel="noreferrer" className="button button-secondary">
        Unduh file
      </a>
    </div>
  );
}

export function PreviewModal({
  src,
  nama,
  onClose,
  hideDownload = false,
}: {
  src: string;
  nama: string;
  onClose: () => void;
  hideDownload?: boolean;
}) {
  const kind = detectKind(nama);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="preview-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="preview-modal"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="preview-header">
          <div className="preview-title">
            <strong id={titleId}>{nama}</strong>
            <span className="panel-subtitle">Preview {KIND_LABEL[kind]} — tidak otomatis terunduh</span>
          </div>
          <div className="preview-actions">
            {!hideDownload ? (
              <a href={src} download={nama} className="button button-secondary">
                Unduh
              </a>
            ) : null}
            <button
              ref={closeButtonRef}
              className="table-action danger"
              type="button"
              title="Tutup preview"
              aria-label="Tutup preview"
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="preview-body">
          <PreviewBody src={src} nama={nama} kind={kind} />
        </div>
      </div>
    </div>
  );
}

/** Preview file yang sudah tersimpan di server (via /api/files/...). */
export function PreviewButton({
  href,
  nama,
}: {
  href: string;
  nama: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="file-link"
        title={`Preview ${nama}`}
        onClick={() => setSrc(href)}
      >
        lihat
      </button>
      {src ? <PreviewModal src={src} nama={nama} onClose={() => setSrc(null)} /> : null}
    </>
  );
}

/** Preview file yang baru dipilih (belum diunggah) via blob URL. */
export function LocalPreviewButton({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);
  const srcRef = useRef<string | null>(null);

  const open = useCallback(() => {
    if (srcRef.current) URL.revokeObjectURL(srcRef.current);
    const nextSrc = URL.createObjectURL(file);
    srcRef.current = nextSrc;
    setSrc(nextSrc);
  }, [file]);

  const close = useCallback(() => {
    if (srcRef.current) URL.revokeObjectURL(srcRef.current);
    srcRef.current = null;
    setSrc(null);
  }, []);

  useEffect(() => () => {
    if (srcRef.current) URL.revokeObjectURL(srcRef.current);
  }, []);

  return (
    <>
      <button type="button" className="file-link" title={`Preview ${file.name}`} onClick={open}>
        lihat
      </button>
      {src ? <PreviewModal src={src} nama={file.name} onClose={close} /> : null}
    </>
  );
}
