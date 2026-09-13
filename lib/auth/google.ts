/* Email akun Google terbaca dari klaim "email" di id_token yang disimpan
   Better Auth pada tabel account (tabel account tidak menyimpan email). */
export function emailDariIdToken(idToken: string | null | undefined): string | null {
  if (!idToken) return null;
  const bagian = idToken.split(".");
  if (bagian.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(bagian[1], "base64url").toString("utf8")) as {
      email?: unknown;
    };
    return typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}
