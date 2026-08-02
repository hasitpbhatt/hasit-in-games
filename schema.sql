-- hasit-in-games: Cloudflare D1 schema
-- Apply with: npx wrangler d1 execute hasit-in-games --local --file schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  username           TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,
  salt               TEXT NOT NULL,
  faucetpay_username TEXT,
  balance            INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  kdf_iterations     INTEGER NOT NULL DEFAULT 600000
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS score_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game       TEXT NOT NULL,
  score      INTEGER NOT NULL,
  points     INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_score_events_user_date ON score_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_score_events_date ON score_events(created_at);

CREATE TABLE IF NOT EXISTS daily_budget (
  date           TEXT PRIMARY KEY,
  points_issued  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payouts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payout_amount INTEGER NOT NULL,
  points_cost   INTEGER NOT NULL,
  payout_id     TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  ip            TEXT,
  faucetpay_username TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_ip_date ON payouts(ip, created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_wallet_date ON payouts(faucetpay_username, created_at);

CREATE TABLE IF NOT EXISTS promo_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL UNIQUE,
  points     INTEGER NOT NULL,
  max_uses   INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS code_redemptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (code, user_id)
);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user ON code_redemptions(user_id);

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
