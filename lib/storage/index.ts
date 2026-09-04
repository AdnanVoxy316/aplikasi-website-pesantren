import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export const ALLOWED_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf", ".jpg", ".jpeg", ".png"] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function validateFile(file: File): string | null {
  if (file.size <= 0) return "File kosong.";
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file melebihi batas maksimum 10 MB.";
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return "Tipe file tidak diizinkan. Gunakan .doc, .docx, .pdf, .jpg, atau .png.";
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Tipe MIME file tidak diizinkan.";
  }
  return null;
}

const STORAGE_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "data", "uploads");

const localAdapter: StorageService = {
  async upload(file: File, folder: string): Promise<UploadResult> {
    const error = validateFile(file);
    if (error) throw new Error(error);

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
    const dirPath = path.join(STORAGE_ROOT, folder);
    await fs.mkdir(dirPath, { recursive: true });
    const absPath = path.join(dirPath, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buffer);

    return {
      filePath: `${folder}/${fileName}`,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    };
  },

  async delete(filePath: string): Promise<void> {
    const absPath = path.join(STORAGE_ROOT, filePath);
    if (!absPath.startsWith(STORAGE_ROOT)) return;
    await fs.rm(absPath, { force: true });
  },

  getAbsolutePath(filePath: string): string {
    const absPath = path.join(STORAGE_ROOT, filePath);
    if (!absPath.startsWith(STORAGE_ROOT)) {
      throw new Error("Path file tidak valid.");
    }
    return absPath;
  },
};

export const storage: StorageService = localAdapter;
