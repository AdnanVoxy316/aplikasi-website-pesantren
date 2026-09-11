import { defineConfig } from "drizzle-kit";
import path from "node:path";

const url = (() => {
  const raw =
    process.env.DATABASE_URL?.trim() ||
    `file:${path.join(__dirname, "data", "elms.db").replace(/\\/g, "/")}`;
  // Klien libsql butuh skema eksplisit "file:" untuk SQLite lokal
  return raw.startsWith("file:") ? raw : `file:${raw}`;
})();

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: {
    url,
  },
});
