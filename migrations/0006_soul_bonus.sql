-- Soul-completion reward: persist the 2048 highest tile so the server can
-- verify chamber healing, and track one-time narrative rewards.
ALTER TABLE score_events ADD COLUMN highest_tile INTEGER;

CREATE TABLE IF NOT EXISTS user_rewards (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward     TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, reward)
);
