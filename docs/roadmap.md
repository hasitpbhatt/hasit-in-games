# hasit-in-games — Roadmap

**Status:** Phase 0 (scaffolding)
**Subdomain:** `games.hasit.in` → Cloudflare Pages (Vite + React + TS + Pages Functions)

Skill-based arcade games. Play → earn points → redeem points for PEPE via
FaucetPay. Deliberately small budget: **max ~$0.10/day (~$3/month)** in total
payouts. Not a gambling product — skill games only, no luck/wager mechanics.

---

## Decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| Redemption | FaucetPay **username** | Internal sends, low friction, micro amounts work |
| Coin | **PEPE** | Cheap, fast, faucet-friendly |
| Budget | **$0.10/day** global | Deliberate ceiling |
| Scale | Small / friends | Simple anti-abuse, no CAPTCHA/email KYC needed at launch |
| Stack | Vite + React + CF Pages Functions | Same proven pattern as `quizify.hasit.in` |
| Storage | Cloudflare **D1** (SQLite) | Free tier, SQL, fits the ledger model |

FaucetPay API sends are fee-free. `to` accepts a FaucetPay username; validate it
with `checkaddress` before paying out. Amount is in the coin's smallest unit.

---

## Rules & constraints to respect

- **India gambling law:** skill games only. No chance-based rewards, no "bet"
  mechanics, no wager framing. Add an 18+ gate and short Terms/Privacy pages.
- **FaucetPay ToS:** reward/faucet sites are the intended use case. Don't hammer
  the API — cache balance, honor `rate_limit_remaining`, no per-request balance
  calls.
- **Never trust the client.** Every score is submitted to a Pages Function that
  re-validates the result server-side before crediting points.
- **API key hygiene.** `FAUCETPAY_API_KEY` lives only in CF secrets / `wrangler`
  env — never in client code or the repo.
- **Keep games.hasit.in ad-free** (separate from the AdSense account on hasit.in).
- **DPDP (India data privacy):** collect the minimum — username, hashed password,
  wallet username, scores.

---

## Points economy

- 1 PEPE ≈ $0.20 (verify at launch); **1 PEPE = 1,000 points**.
- Minimum redemption: **1 PEPE** (~$0.20).
- Daily budget: **~$0.10** → **5,000 points issued globally/day**.
- Per-user daily cap: ~**1,000–2,000 points/day** ($0.02–0.04).
- When the global daily pot is drained, new scores credit but payouts queue to the
  next day (`pending` status, auto-processed).

---

## API surface (Pages Functions)

| Route | Method | Purpose |
|---|---|---|
| `/api/register` | POST | Create user (username + password hash) |
| `/api/login` | POST | Login, issue session token |
| `/api/me` | GET | Current user + balance + daily earned |
| `/api/score` | POST | Submit validated game result, credit points |
| `/api/redeem` | POST | Check username, verify balance, trigger FaucetPay send |
| `/api/redeem-code` | POST | Redeem a promo code → points added to balance |
| `/api/admin/codes` | POST/GET | Create / list promo codes (requires `x-admin-secret` = `ADMIN_SECRET`) |
| `/api/payouts` | GET | List own payout history |
| `/api/leaderboard` | GET | Optional, no real names |

---

## D1 schema (`schema.sql`)

- `users` — id, username, password_hash, salt, faucetpay_username, balance, created_at
- `sessions` — token, user_id, expires_at
- `score_events` — id, user_id, game, score, points, created_at
- `daily_budget` — date, points_issued (global daily pot rollup)
- `payouts` — id, user_id, payout_amount, points_cost, payout_id, status, created_at
- `promo_codes` — id, code, points, max_uses, used_count, active, created_at
- `code_redemptions` — id, code, user_id, created_at (UNIQUE per code+user)

---

## Games (Phase 1 — skill-based, mobile-friendly)

1. 2048
2. Memory match
3. Whack-a-mole
4. Snake
5. Typing-speed test

Each game has a bounded score→points formula with a daily cap.

---

## Phases

- **Phase 0 (now):** repo scaffold, git, roadmap, schema draft, empty API stubs.
- **Phase 1:** auth + ledger + one game (2048) + working manual redeem end-to-end.
- **Phase 2:** remaining games, redeem UI, caps + rollover, D1 deploy.
- **Phase 3:** terms/privacy, 18+ gate, link from hasit.in, tune economy from play.

---

## Costs

- Cloudflare Pages/D1/Functions: free tier.
- FaucetPay: $0 fees.
- Real spend: ~$3/month payout budget + one-time PEPE funding (~$5–10 to start).
