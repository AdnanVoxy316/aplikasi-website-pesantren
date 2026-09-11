import "server-only";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function fileToDataUrl(
  file: FormDataEntryValue | null,
  label: string,
): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!file.type.startsWith("image/") && !file.name.match(/\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|tiff?)$/i)) {
    throw new Error(`${label} harus berupa file gambar.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${label} terlalu besar. Ukuran maksimal 10MB.`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type || "image/jpeg";
  return `data:${type};base64,${buffer.toString("base64")}`;
}
