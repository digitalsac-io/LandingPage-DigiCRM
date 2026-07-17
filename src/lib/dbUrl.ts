import path from "path";

/**
 * Returns the SQLite database URL.
 * Respects DATABASE_URL env var when set; falls back to the conventional
 * data/landing.db path relative to the project root.
 */
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return "file:" + path.join(process.cwd(), "data", "landing.db");
}
