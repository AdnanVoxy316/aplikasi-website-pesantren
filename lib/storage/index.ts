import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_FILES_PER_SUBMIT,
  MAX_FILE_SIZE,
} from "@/lib/upload-limits";

export { MAX_FILES_PER_SUBMIT, MAX_FILE_SIZE };

export type UploadResult = {
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type StorageService = {
  upload(file: File, folder: string): Promise<UploadResult>;
  delete(filePath: string): Promise<void>;
  getAbsolutePath(filePath: string): string;
};

export const UPLOAD_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  avif: "image/avif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  sav: "application/octet-stream",
};

function extensionOf(fileName: string): string {
  return path.extname(fileName).slice(1).toLowerCase();
}

function validateFile(file: File): string | null {
  if (file.size <= 0) return `File "${file.name}" kosong.`;
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" melebihi batas maksimum 10 MB.`;
  }
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extensionOf(file.name))) {
    return `Format file "${file.name}" belum didukung. Gunakan PDF, dokumen Office, gambar, ZIP, atau file teks.`;
  }
  return null;
}

function sanitizeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^\w\-. ]+/g, "_")
    .trim();
  const safeBase = (base || "file").slice(0, 100);
  return `${safeBase}${ext}`;
}

const STORAGE_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "data", "uploads");

const localAdapter: StorageService = {
  async upload(file: File, folder: string): Promise<UploadResult> {
    const error = validateFile(file);
    if (error) throw new Error(error);

    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(file.name)}`;
    const dirPath = path.join(STORAGE_ROOT, folder);
    await fs.mkdir(dirPath, { recursive: true });
    const absPath = path.join(dirPath, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buffer);

    return {
      filePath: `${folder}/${fileName}`,
      fileName: file.name,
      mimeType: UPLOAD_MIME_BY_EXTENSION[extensionOf(file.name)] ?? "application/octet-stream",
      size: file.size,
    };
  },

  async delete(filePath: string): Promise<void> {
    const absPath = resolveStoragePath(filePath);
    await fs.rm(absPath, { force: true });
  },

  getAbsolutePath(filePath: string): string {
    return resolveStoragePath(filePath);
  },
};

function resolveStoragePath(filePath: string): string {
  const absPath = path.resolve(STORAGE_ROOT, filePath);
  const relativePath = path.relative(STORAGE_ROOT, absPath);
  if (relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error("Path file tidak valid.");
  }
  return absPath;
}

export const storage: StorageService = localAdapter;
