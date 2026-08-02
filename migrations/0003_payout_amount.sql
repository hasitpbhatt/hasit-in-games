-- hasit-in-games: rename trx_amount -> payout_amount (currency-agnostic).
-- payouts.payout_amount stores the number of payout units (was TRX, now PEPE).
ALTER TABLE payouts RENAME COLUMN trx_amount TO payout_amount;
