import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// DATABASE_URL is optional — when not set (e.g. Vercel with Sheets-only mode),
// db exports as null and all storage calls are gracefully skipped.
export let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  console.warn("[DB] DATABASE_URL not set — running in Sheets-only mode");
}
