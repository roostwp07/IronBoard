-- IronBoard database schema (hand-written, run with psql).

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,              -- bcrypt hash, never plaintext
  name       TEXT NOT NULL,
  gender     TEXT CHECK (gender IN ('male', 'female')),
  role       TEXT NOT NULL DEFAULT 'member'
             CHECK (role IN ('member', 'admin')),
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
