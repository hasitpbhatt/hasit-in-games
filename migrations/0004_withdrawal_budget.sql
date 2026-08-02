-- hasit-in-games: daily withdrawal budget (per username OR per IP).
-- Adds payouts.ip and payouts.faucetpay_username so the server can enforce
-- MAX_WITHDRAW_POINTS_PER_DAY per IP and per destination FaucetPay wallet
-- (per-account enforcement uses the existing payouts.user_id column).

ALTER TABLE payouts ADD COLUMN ip TEXT;
ALTER TABLE payouts ADD COLUMN faucetpay_username TEXT;
CREATE INDEX IF NOT EXISTS idx_payouts_ip_date ON payouts(ip, created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_wallet_date ON payouts(faucetpay_username, created_at);
