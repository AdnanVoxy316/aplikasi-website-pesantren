import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
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
        url: (() => {
          // Pastikan file DB lokal ada sebelum libsql membukanya —
          // mencegah SQLITE_CANTOPEN saat fase build/collect page data.
          const dbPath = process.env.DATABASE_URL?.trim().replace(/^file:/, "") || "./data/elms.db";
          if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            fs.closeSync(fs.openSync(dbPath, "a"));
          }
          return `file:${dbPath}`;
        })(),
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
