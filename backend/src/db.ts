import "dotenv/config"; // loads variables from .env into process.env
import pg from "pg";

const { Pool } = pg;

// A single shared pool for the whole app. It keeps a handful of
// connections open and hands them out per query, which is far faster
// than opening a new connection every time.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Small helper so callers can write `query(sql, params)` instead of
// reaching into the pool directly. Params are passed separately (not
// string-concatenated) so Postgres treats them as data, never SQL —
// this is what prevents SQL injection.
export function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
