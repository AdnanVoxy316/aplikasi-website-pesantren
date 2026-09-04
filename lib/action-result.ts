import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/permissions";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const field = first?.path?.length ? `${first.path.join(".")}: ` : "";
    return fail(`${field}${first?.message ?? "Input tidak valid."}`);
  }
  if (error instanceof AuthorizationError) {
    return fail(error.message);
  }
  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return fail("Data dengan nilai yang sama sudah ada.");
    }
    return fail(error.message);
  }
  console.error("Unexpected action error:", error);
  return fail("Terjadi kesalahan pada server. Silakan coba lagi.");
}
