/** Batas unggah bersama (aman dipakai di client & server). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES_PER_SUBMIT = 10;
export const ALLOWED_UPLOAD_EXTENSIONS: readonly string[] = [
  "pdf",
  "txt",
  "csv",
  "md",
  "json",
  "xml",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "avif",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "zip",
  "sav",
];
