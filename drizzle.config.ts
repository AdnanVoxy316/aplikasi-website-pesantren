import { defineConfig } from "drizzle-kit";
import path from "node:path";

const url =
  process.env.DATABASE_URL?.replace(/^file:/, "") ??
  path.join(__dirname, "data", "elms.db");

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: {
    url,
  },
});
