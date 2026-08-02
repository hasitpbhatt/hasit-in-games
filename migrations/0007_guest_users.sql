-- Guest-first accounts: add last_used_at (activity timestamp) to users, used to
-- purge abandoned guest accounts. SQLite's ALTER TABLE ... ADD COLUMN can't
-- carry a non-constant default like datetime('now'), so backfill existing rows
-- explicitly. Fresh databases (schema.sql) use CREATE TABLE, which does allow the
-- expression default — hence the NOT NULL there vs. the nullable ALTER here;
-- in practice every row is populated (guests set it at creation, /api/me refreshes it).
ALTER TABLE users ADD COLUMN last_used_at TEXT;
UPDATE users SET last_used_at = datetime('now') WHERE last_used_at IS NULL;
