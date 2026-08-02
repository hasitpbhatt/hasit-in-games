-- hasit-in-games: server-issued play sessions + per-IP daily earning cap.
--
-- A play session nonce is minted by /api/session/start when a round begins and
-- must be presented with the score. The server verifies playSeconds against the
-- session's wall-clock started_at and atomically consumes the session, so a
-- script can't fabricate play time or replay the same round. ip_daily caps
-- total earnings per network, closing the multi-account farming vector.

CREATE TABLE IF NOT EXISTS play_sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game       TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_play_sessions_user ON play_sessions(user_id);

CREATE TABLE IF NOT EXISTS ip_daily (
  ip            TEXT NOT NULL,
  date          TEXT NOT NULL,
  points_issued INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, date)
);

-- Record the origin IP on every score event so /api/score/undo can refund the
-- per-IP daily cap exactly like it refunds the global pot and user cap.
ALTER TABLE score_events ADD COLUMN ip TEXT;
