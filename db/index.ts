import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DATABASE_URL =
  process.env.DATABASE_URL?.replace(/^file:/, "") ??
  path.join(process.cwd(), "data", "elms.db");

const dbDir = path.dirname(DATABASE_URL);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const globalForDb = globalThis as unknown as {
  sqliteConnection: Database.Database | undefined;
};

const connection =
  globalForDb.sqliteConnection ??
  new Database(DATABASE_URL, { fileMustExist: false });

connection.pragma("journal_mode = WAL");
connection.pragma("foreign_keys = ON");

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqliteConnection = connection;
}

export const db = drizzle(connection, { schema });
export { schema, connection };
export const DATABASE_PATH = DATABASE_URL;
