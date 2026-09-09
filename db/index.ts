import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

// Production (Vercel): database di-host di Turso (libSQL) melalui
// TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. Serverless tidak boleh
// menyimpan file SQLite lokal karena filesystem-nya ephemeral.
// Development: SQLite lokal melalui driver libsql (DATABASE_URL / ./data/elms.db).
const TURSO_URL = process.env.TURSO_DATABASE_URL?.trim();
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim();

const globalForDb = globalThis as unknown as {
  libsqlClient: Client | undefined;
};

const client =
  globalForDb.libsqlClient ??
  (TURSO_URL
    ? createClient({
        url: TURSO_URL,
        authToken: TURSO_TOKEN && TURSO_TOKEN.length > 0 ? TURSO_TOKEN : undefined,
      })
    : createClient({
        url: process.env.DATABASE_URL?.trim() || "file:./data/elms.db",
      }));

if (process.env.NODE_ENV !== "production") {
  globalForDb.libsqlClient = client;
}

if (!TURSO_URL) {
  // foreign_keys default OFF pada SQLite lokal — aktifkan agar konsisten
  // dengan perilaku Turso.
  void client.execute("PRAGMA foreign_keys = ON").catch(() => {});
}

export const db = drizzle(client, { schema });
export { schema };
export const connection = { close: () => client.close() };
export const DATABASE_PATH = TURSO_URL ?? "file:./data/elms.db";
