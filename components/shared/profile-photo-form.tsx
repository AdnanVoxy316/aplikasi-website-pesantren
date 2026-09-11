"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { updateFotoProfilForm } from "@/actions/forms";

const ACCEPT = "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif,.avif";

export function ProfilePhotoForm({
  name,
  initials,
  image,
}: {
  name: string;
  initials: string;
  image: string | null;
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const clearSelection = () => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFileName(null);
  };

  useEffect(() => {
    return () => {
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, []);

  const shown = preview ?? image;

  return (
    <div className="photo-upload">
      <span className="avatar avatar-lg">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={`Foto profil ${name}`} />
        ) : (
          initials
        )}
      </span>
      <form
        className="photo-upload-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          if (!fileName) return;
          const fd = new FormData(form);
          startTransition(async () => {
            const result = await updateFotoProfilForm(fd);
            showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
            if (result.ok) {
              form.reset();
              clearSelection();
            }
          });
        }}
      >
        <label className="file-picker">
          <Icon name="upload" />
          <span className="file-picker-text">{fileName ?? "Pilih gambar dari perangkat"}</span>
          <input
            className="file-picker-input"
            type="file"
            name="foto"
            accept={ACCEPT}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                clearSelection();
                setPreview(URL.createObjectURL(file));
                setFileName(file.name);
              } else {
                clearSelection();
              }
            }}
            disabled={pending}
          />
        </label>
        <div className="inline-actions">
          <button className="button button-secondary" type="submit" disabled={pending || !fileName}>
            Simpan foto
          </button>
          {image ? (
            <button
              className="button button-secondary"
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Hapus foto profil Anda?")) return;
                clearSelection();
                const fd = new FormData();
                fd.set("hapus", "1");
                startTransition(async () => {
                  const result = await updateFotoProfilForm(fd);
                  showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
                });
              }}
            >
              Hapus foto
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
