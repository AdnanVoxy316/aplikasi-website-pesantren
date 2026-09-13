import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = ["/admin", "/guru", "/santri", "/wali", "/profil"];

/* Catatan: JANGAN membalikkan /login ke "/" hanya karena cookie sesi ada.
   Proxy tidak bisa memvalidasi isi sesi ke database, sedangkan cookie bisa
   basi (sesi kedaluwarsa/dihapus). Bounce berbasis cookie existence pernah
   membuat loop /login <-> / (ERR_TOO_MANY_REDIRECTS). Validasi sesi yang
   sebenarnya dilakukan di app/login/page.tsx (server component). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!sessionCookie && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/guru/:path*", "/santri/:path*", "/wali/:path*", "/profil/:path*", "/login"],
};
