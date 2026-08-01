# hasit-in-games

Skill-based arcade games on **games.hasit.in**. Play → earn points → redeem for
TRX via FaucetPay. Deliberately small budget: **~$0.10/day (~$3/month)** in
total payouts.

See [`docs/roadmap.md`](docs/roadmap.md) for the full plan, economy, and
locked decisions.

---

## What it is

A minimalist arcade lobby where every game is **skill-based only** — no luck,
no wagers. Players register with a username + password, play games to earn
points, and redeem accumulated points for TRX sent to their FaucetPay wallet.

Key properties:

| Property | Value |
|---|---|
| Payout coin | TRX (via FaucetPay) |
| Conversion | 1 TRX = 10,000 points |
| Global daily pot | 5,000 points (~$0.10/day) |
| Per-user daily cap | 2,000 points |
| Min. redemption | 1 TRX (10,000 points) |
| Anti-abuse | Min 5s playtime, server-side score validation |
| Auth | PBKDF2 (100k iters) + salted passwords, 30-day session tokens |

---

## Architecture

```
  ┌─────────────┐  /api/*  ┌──────────────────────┐  D1 SQL  ┌──────────┐
  │   Browser   │ ───────→ │  Pages Functions     │ ◄──────► │    D1    │
  │  (Vite HMR) │          │  (TypeScript)        │          │ (SQLite) │
  └─────────────┘          │                      │          └──────────┘
                            │  • validates scores │
                            │  • enforces caps    │
                            │  • manages sessions │
                            └────────┬───────────┘
                                     │ FaucetPay API (server-only key)
                                     ▼
                            ┌──────────────────────┐
                            │  faucetpay.io        │
                            │  send / checkaddress │
                            └──────────────────────┘
```

**Never trust the client.** The frontend computes an *estimated* points value
(`src/lib/points.ts`) for instant feedback, but the Pages Function in
`funcions/api/score.ts` **recomputes points from the raw score** using the
authoritative formula in `functions/_shared/economy.ts`. The server also
enforces:

- Per-user daily cap (2,000 points)
- Global daily pot (5,000 points)
- Minimum play time (5 seconds)

If either cap is hit, the play is still recorded but no points are awarded
(`capped: true` in the response).

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| API | Cloudflare Pages Functions (TypeScript) |
| Database | Cloudflare D1 (SQLite) |
| Auth | Web Crypto (PBKDF2-HMAC-SHA256), HttpOnly session cookies |
| Payouts | FaucetPay REST API (TRX) |
| Linting | Oxlint |

---

## Local dev

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [wrangler](https://developers.cloudflare.com/pages/package.json) (`npx wrangler` works without install)
- A FaucetPay API key (set up in [Secrets](#secrets) below)

### Quick start

```bash
# 1. Install deps
make install

# 2. Initialize the local D1 database (create + run schema)
make db-init

# 3. Set up secrets locally
make secrets-dev   # or manually create .dev.vars

# 4. Start both Vite (HMR) and Wrangler Pages (Functions + static)
make dev
```

Open http://localhost:5173.

> **Tip:** `make dev` starts two processes — Vite on `:5173` (frontend with HMR)
> and `wrangler pages dev dist` on `:8788` (static site + Functions + local D1).
> Vite proxies `/api/*` to `:8788`. If you change Functions code, wrangler
> hot-reloads automatically. For frontend-only changes, Vite provides HMR.
> A pre-built `dist/` is required for `wrangler pages dev` — `make dev` handles
> the initial build for you.

Alternatively, run everything manually:

```bash
npm install

# Terminal 1: build once, then serve static + Functions locally
npm run build
npx wrangler d1 execute hasit-in-games --local --file schema.sql
npx wrangler pages dev dist

# Terminal 2: Vite dev server (HMR, proxies /api → :8788)
npm run dev
```

---

## Secrets

The FaucetPay API key and admin secret are **server-side only** — they never
touch the browser bundle.

```bash
# Local dev (used by `npx wrangler pages dev`)
echo "FAUCETPAY_API_KEY=your_key_here
ADMIN_SECRET=your_admin_secret" > .dev.vars

# Production
npx wrangler pages secret put FAUCETPAY_API_KEY
npx wrangler pages secret put ADMIN_SECRET
```

> See `.env.example` for the exact variable names. **Never** commit `.dev.vars`
> or `.env`.

---

## API reference

All routes are mounted on the root path (e.g. `POST /api/register`). Auth is
handled via an HttpOnly session cookie (`hasit_session`).

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/register` | POST | — | Create account (username + password, min 6 chars) |
| `/api/login` | POST | — | Authenticate, issue session cookie |
| `/api/logout` | POST | ✅ | Delete session |
| `/api/me` | GET | ✅ | Current user profile + balance + daily progress |
| `/api/score` | POST | ✅ | Submit a game result; server re-validates + credits points |
| `/api/redeem` | POST | ✅ | Validate FaucetPay username + send TRX |
| `/api/redeem-code` | POST | ✅ | Redeem a promo code → credit balance |
| `/api/payouts` | GET | ✅ | List own payout history |
| `/api/admin/codes` | POST | admin | Create a promo code |
| `/api/admin/codes` | GET | admin | List all promo codes |

### `/api/score` — server-side validation

**Request:**
```json
POST /api/score
Content-Type: application/json

{ "game": "2048", "score": 3528, "playSeconds": 24 }
```

**Response:**
```json
{
  "points": 500,          // points actually awarded (may be < server-computed)
  "balance": 500,         // new total balance
  "todayEarned": 500,     // user's earnings today
  "capped": false         // true if caps reduced the award
}
```

The server rejects scores with:
- Unknown game ID
- Score ≤ 0 or > 1,000,000
- Play time < 5 seconds
- Server-computed points ≤ 0

### Scoring formula

| Game | Formula | Max per play |
|---|---|---|
| 2048 | `floor(score / 2)` | 500 |
| Memory | `floor(score / 4)` | 300 |
| Whack-a-Mole | `score * 2` | 250 |
| Reaction Time | `score < 500 ? floor((500 - score) / 3) : 0` | 150 |
| Snake | `score * 4` | 400 |
| Typing Sprint | `floor(score / 2)` | 300 |
| Queens | `solve_seconds > 0 ? max(20, min(200, 200 - seconds * 2)) : 0` | 200 |
| Tango | `solve_seconds > 0 ? max(15, min(150, 180 - seconds)) : 0` | 150 |
| Pinpoint | `correct_categories * 30` | 150 |

The formula lives in `functions/_shared/economy.ts` (authoritative) and is
mirrored client-side in `src/lib/points.ts` for UI feedback. The server value
always wins.

---

## Deployment

### 1. Create the D1 database (one-time)

```bash
npx wrangler d1 create hasit-in-games
# Copy the `database_id` into wrangler.jsonc
npx wrangler d1 execute hasit-in-games --remote --file schema.sql
```

### 2. Set production secrets

```bash
npx wrangler pages secret put FAUCETPAY_API_KEY
npx wrangler pages secret put ADMIN_SECRET
```

### 3. Deploy

```bash
npm run deploy
# or: npx wrangler pages deploy dist
```

> This is a **Cloudflare Pages** project (Vite SPA + `functions/` Pages
> Functions + D1), not a standalone Worker. Use `wrangler pages deploy`, never
> `wrangler deploy` (that targets Workers and needs a `main` script).
>
> **Dashboard (Git integration):** set Build command to `npm run build` and
> Build output directory to `dist`. Pages auto-detects the `functions/`
> directory; the D1 binding and secrets are configured under
> **Project settings → Bindings**. The `wrangler.jsonc` `pages_build_output_dir`
> is only used for CLI deploys and local dev.

Cloudflare Pages builds from `dist/` (configured via `pages_build_output_dir` in
`wrangler.jsonc`). The `wrangler.toml`-equivalent Pages config in `wrangler.jsonc`
binds the D1 database and makes secrets available as environment variables.

---

## Project layout

```
.
├── src/                     # Frontend (Vite + React)
│   ├── features/
│   │   ├── auth/            # Login, register, promo box
│   │   └── games/           # Game components (2048 implemented)
│   ├── lib/                 # API client, points config, types
│   ├── store/               # Zustand auth store
│   └── styles/              # CSS (no framework, no Tailwind)
├── functions/               # Cloudflare Pages Functions (backend)
│   ├── _shared/             # Shared utilities (db, auth, economy, faucetpay, http, types)
│   └── api/                 # Route handlers
│       └── admin/           # Admin endpoints (guarded by ADMIN_SECRET)
├── schema.sql               # D1 schema
├── wrangler.jsonc           # Pages + D1 config
├── vite.config.ts           # Vite config (proxies /api → :8788)
└── docs/roadmap.md          # Full plan + economy + decisions
```

---

## Development guidelines

- **Server is authoritative.** Every client-submitted score is re-validated
  server-side. Keep `functions/_shared/economy.ts` and `src/lib/points.ts`
  in sync — when you change the scoring formula, update both.
- **No client-side points.** Points are computed from the final score, not
  from user actions during the game.
- **Secrets hygiene.** `FAUCETPAY_API_KEY` and `ADMIN_SECRET` go in
  `pages secret`, never in client code or committed files.
- **D1 migrations.** Schema changes use `schema.sql` for now. As the DB
  grows, split into versioned files under `functions/migrations/` (the
  `migrations_dir` is already configured in `wrangler.jsonc`).
- **Games are skill-based only.** No randomness in scoring, no wager framing.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (proxies `/api/*` to `wrangler pages dev` on `:8788`) |
| `npm run build` | `tsc -b && vite build` — production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Oxlint — check all files |
| `npm run typecheck` | `tsc -b` (client) + `tsc -p tsconfig.functions.json` (functions) |
| `npm run deploy` | `npm run build && npx wrangler pages deploy dist` |
| `npx wrangler pages dev dist` | Full-stack local dev: static site + Functions + local D1 |

---

## Costs

- **Cloudflare Pages / D1 / Functions:** free tier (covers current traffic).
- **FaucetPay:** $0 fees on sends.
- **Real spend:** ~$3/month payout budget + one-time TRX funding (~$5–10 to start).
