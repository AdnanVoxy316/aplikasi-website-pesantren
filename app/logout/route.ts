import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  await auth.api.signOut({ headers: request.headers });
  return NextResponse.redirect(new URL("/login", request.url));
}
