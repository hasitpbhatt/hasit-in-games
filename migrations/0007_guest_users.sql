-- Guest-first accounts: every player (guest or signed-up) now gets a server-side
-- users row so the PEPE economy (daily caps, balance, score events) works without
-- collecting a username/password at the front door. last_used_at is bumped on
-- each /api/me refresh so stale guest accounts can be cleaned up later.
-- The NOT NULL DEFAULT (datetime('now')) backfills existing rows at ALTER time.
ALTER TABLE users ADD COLUMN last_used_at TEXT NOT NULL DEFAULT (datetime('now'));
