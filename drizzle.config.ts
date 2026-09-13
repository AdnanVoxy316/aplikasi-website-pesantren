import { defineConfig } from "drizzle-kit";
import path from "node:path";

const url = (() => {
  const raw =
    process.env.DATABASE_URL?.trim() ||
    `file:${path.join(__dirname, "data", "elms.db").replace(/\\/g, "/")}`;
  // Klien libsql butuh skema eksplisit "file:" untuk SQLite lokal
  return raw.startsWith("file:") ? raw : `file:${raw}`;
})();

const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

export default defineConfig({
  dialect: "turso",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
});
