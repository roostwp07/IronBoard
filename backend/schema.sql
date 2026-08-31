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

CREATE TABLE IF NOT EXISTS lift_submissions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  lift_type      TEXT NOT NULL CHECK (lift_type IN ('squat', 'bench', 'deadlift', 'ohp', 'pullups', 'chinups', 'dips')),
  weight_kg      DECIMAL,                -- null for bodyweight lifts
  reps           INTEGER,               -- null for weighted lifts
  weight_class   TEXT NOT NULL,
  scale_video_url TEXT NOT NULL,
  lift_video_url  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  body       TEXT,                      -- nullable: post may be media-only
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_media (
  id        SERIAL PRIMARY KEY,
  post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL
);
