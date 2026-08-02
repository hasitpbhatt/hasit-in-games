-- hasit-in-games: economy integrity hardening.
--  - user_daily: per-user daily counter for atomic cap enforcement (no read-then-write races).
--  - rate_limits: sliding-window buckets for score/auth/redeem throttling.
--  - users.kdf_iterations: PBKDF2 iteration count used when the hash was created
--    (legacy rows are 100000; new registrations use 600000).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_daily (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  points_issued INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key    TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket)
);

ALTER TABLE users ADD COLUMN kdf_iterations INTEGER NOT NULL DEFAULT 100000;
