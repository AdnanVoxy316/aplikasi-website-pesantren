"use client";

import { useRef, useState, useTransition } from "react";
import { useToast } from "@/components/app-shell";
import { LocalPreviewButton } from "@/components/shared/file-preview";
import { createTugasForm, addTugasLampiranForm, addTugasLampiranLinkForm } from "@/actions/forms";
import { MAX_FILES_PER_SUBMIT, MAX_FILE_SIZE } from "@/lib/upload-limits";
import { ukuranFile } from "@/lib/format";

export type PengajaranOption = {
  id: string;
  label: string;
  kelasId: string;
  mapelId: string;
  tahunAjaranId: string;
};

export function TugasBaruClient({ pengajaranOptions }: { pengajaranOptions: PengajaranOption[] }) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<PengajaranOption | null>(
    pengajaranOptions[0] ?? null,
  );
  const [files, setFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (pengajaranOptions.length === 0) {
    return (
      <p className="panel-subtitle">
        Anda belum ditugaskan ke kelas/mapel. Hubungi admin untuk penugasan.
      </p>
    );
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        if (selected) {
          fd.set("kelasId", selected.kelasId);
          fd.set("mapelId", selected.mapelId);
          fd.set("tahunAjaranId", selected.tahunAjaranId);
        }
        if (files.length > MAX_FILES_PER_SUBMIT) {
          showToast(`Maksimal ${MAX_FILES_PER_SUBMIT} lampiran per tugas.`);
          return;
        }
        const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
        if (tooBig) {
          showToast(`Lampiran "${tooBig.name}" melebihi 10 MB.`);
          return;
        }
        startTransition(async () => {
          const result = await createTugasForm(fd);
          if (!result.ok) {
            showToast(result.error ?? "Gagal membuat tugas.");
            return;
          }
          showToast(result.message ?? "Tugas dibuat.");
          const tugasId = result.data!.id;
          let gagal = 0;
          let lastError = "";
          for (let i = 0; i < files.length; i++) {
            setUploadProgress(`Mengunggah lampiran ${i + 1}/${files.length}: ${files[i].name}`);
            const lfd = new FormData();
            lfd.set("tugasId", tugasId);
            lfd.set("file", files[i]);
            const up = await addTugasLampiranForm(lfd);
            if (!up.ok) {
              gagal++;
              lastError = up.error ?? "Gagal.";
            }
          }
          if (linkUrl.trim() !== "") {
            const lfd = new FormData();
            lfd.set("tugasId", tugasId);
            lfd.set("url", linkUrl.trim());
            const up = await addTugasLampiranLinkForm(lfd);
            if (!up.ok) {
              gagal++;
              lastError = up.error ?? "Gagal.";
            }
          }
          setUploadProgress("");
          setFiles([]);
          setLinkUrl("");
          if (gagal > 0) {
            showToast(`Tugas dibuat, tetapi ${gagal} lampiran gagal. ${lastError}`);
          }
          form.reset();
        });
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="t-judul">Judul tugas</label>
           <input id="t-judul" name="judul" required placeholder="misal Setoran hafalan Juz Amma" className="task-form-control" />
        </div>
        <div className="field">
          <label htmlFor="t-pengajaran">Kelas & mapel tujuan</label>
          <select
            id="t-pengajaran"
            value={selected?.id ?? ""}
            onChange={(event) =>
              setSelected(pengajaranOptions.find((p) => p.id === event.target.value) ?? null)
            }
             className="task-form-control"
          >
            {pengajaranOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="t-deskripsi">Deskripsi / instruksi</label>
           <textarea id="t-deskripsi" name="deskripsi" required className="task-form-control task-form-textarea" />
        </div>
        <div className="field">
          <label htmlFor="t-deadline">Deadline</label>
           <input id="t-deadline" name="deadline" type="datetime-local" required className="task-form-control" />
        </div>
        <div className="field">
          <label htmlFor="t-link">Link lampiran (opsional — Google Drive, YouTube, dll)</label>
          <input
            id="t-link"
            name="lampiranUrl"
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
             className="task-form-control"
          />
        </div>
        <div className="field full">
          <label htmlFor="t-lampiran">
            Lampiran file (opsional — semua jenis file, maks 10 MB/file, hingga 10 file). Dapat
            dipadukan dengan link.
          </label>
          <input
            id="t-lampiran"
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
          {files.length > 0 ? (
             <div className="selected-files">
               <p className="panel-subtitle file-selection-note">
                {files.length}/{MAX_FILES_PER_SUBMIT} file dipilih · total {ukuranFile(totalSize)} —
                review dulu sebelum menerbitkan tugas.
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
        </div>
      </div>
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? uploadProgress || "Menyimpan..." : "Terbitkan tugas"}
        </button>
      </div>
    </form>
  );
}
