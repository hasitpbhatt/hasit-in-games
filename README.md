# hasit-in-games

Skill-based arcade games on **games.hasit.in**. Play → earn points → redeem for
TRX via FaucetPay. Small, deliberate budget: **~$0.10/day (~$3/month)** in total
payouts.

See [`docs/roadmap.md`](docs/roadmap.md) for the full plan, economy, and decisions.

## Stack

- Vite + React + TypeScript (frontend)
- Cloudflare Pages Functions (serverless API)
- Cloudflare D1 (SQLite ledger)

## Local dev

```bash
npm install

# 1. Build the static site
npm run build

# 2. Run Pages Functions + static site together (port 8788)
npx wrangler d1 execute hasit-in-games --local --file schema.sql
npx wrangler pages dev dist

# 3. In a second terminal, run Vite for HMR (proxies /api → 8788)
npm run dev
```

Open http://localhost:5173

## D1 setup (one-time)

```bash
npx wrangler d1 create hasit-in-games      # copy the database_id into wrangler.jsonc
npx wrangler d1 execute hasit-in-games --remote --file schema.sql
```

## Secrets

FaucetPay API key is server-side only:

```bash
npx wrangler pages secret put FAUCETPAY_API_KEY
# locally: add to .dev.vars
```

Never put the key in client code or commit it.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (HMR, proxies /api to wrangler) |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |
