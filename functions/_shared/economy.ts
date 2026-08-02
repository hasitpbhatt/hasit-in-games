// Server-side economy — AUTHORITATIVE. Client src/lib/points.ts mirrors the
// payout currency and per-game caps. Never trust client-computed points.

// Payout currency config — change the coin here (and the client mirror in
// src/lib/points.ts) and everything else follows.
export const PAYOUT_CURRENCY = {
  currency: 'PEPE', // FaucetPay currency code sent to the API
  symbol: 'PEPE', // display abbreviation
  pointsPerUnit: 1_000, // points needed to redeem 1 unit
  minUnits: 1, // minimum redeemable units
  unitsPerWhole: 1e8, // FaucetPay send amount = units × 1e8 (satoshi-style base unit)
} as const

export const MIN_REDEMPTION_POINTS = PAYOUT_CURRENCY.pointsPerUnit * PAYOUT_CURRENCY.minUnits
export const DAILY_GLOBAL_POINTS = 5_000
export const DAILY_USER_CAP = 2_000
export const MIN_PLAY_SECONDS = 5

// Daily withdrawal budget (points) enforced per username OR per IP — whichever
// matches. An abuser can't spread across many accounts from one IP, or many IPs
// on one account: either dimension reaching this cap blocks the withdrawal.
export const MAX_WITHDRAW_POINTS_PER_DAY = 20_000

// Optional per-game achievement data the client may send alongside the score.
export interface ScoreDetail {
  // 2048: the highest tile value on the board when the game ended. The server
  // only trusts it because the final board's max tile is monotonically
  // non-decreasing (merges never destroy value), so it must be <= the score.
  highestTile?: number
}

type Tier = ReadonlyArray<readonly [at: number, pts: number]>

interface TierConfig {
  // 'min' → points for value >= at (higher is better, e.g. 2048 tile).
  // 'max' → points for value <= at (lower is better, e.g. solve seconds).
  mode: 'min' | 'max'
  metric: 'score' | 'highestTile'
  max: number
  tiers: Tier
}

// Reward curve per game: a step table keyed on an achievement metric. Random or
// low-skill play lands on the low steps; genuine skill climbs toward the cap.
// The daily global pot (5,000 pts/day) and per-user cap (2,000 pts/day) bound
// total payouts, so the tables only shape how fairly points are distributed.
const TIER_TABLES: Record<string, TierConfig> = {
  // 2048 — rewards the highest tile reached, NOT the raw merge total. Random
  // mashing rarely passes 128; a genuine 2048 is the full 500.
  '2048': {
    mode: 'min',
    metric: 'highestTile',
    max: 500,
    tiers: [
      [16, 5],
      [32, 15],
      [64, 35],
      [128, 70],
      [256, 120],
      [512, 200],
      [1024, 330],
      [2048, 500],
    ],
  },
  // Memory Match — score is already moves-based (1200 − (moves − 8) × 50), so
  // fewer moves = higher score = more points.
  memory: {
    mode: 'min',
    metric: 'score',
    max: 300,
    tiers: [
      [400, 40],
      [600, 90],
      [800, 150],
      [1000, 220],
      [1200, 300],
    ],
  },
  // Whack-a-Mole — moles whacked in a 30s round.
  whack: {
    mode: 'min',
    metric: 'score',
    max: 250,
    tiers: [
      [5, 15],
      [10, 35],
      [15, 60],
      [20, 90],
      [25, 130],
      [30, 170],
      [35, 210],
      [40, 250],
    ],
  },
  // Reaction Time — lower average (ms) is better.
  reaction: {
    mode: 'max',
    metric: 'score',
    max: 150,
    tiers: [
      [200, 150],
      [250, 120],
      [300, 90],
      [350, 60],
      [400, 30],
    ],
  },
  // Snake — food eaten; longer runs are dramatically harder.
  snake: {
    mode: 'min',
    metric: 'score',
    max: 400,
    tiers: [
      [5, 20],
      [8, 40],
      [12, 70],
      [16, 105],
      [20, 150],
      [25, 200],
      [30, 250],
      [40, 320],
      [50, 400],
    ],
  },
  // Typing Sprint — correct characters in a 30s round.
  typing: {
    mode: 'min',
    metric: 'score',
    max: 300,
    tiers: [
      [30, 30],
      [60, 60],
      [90, 95],
      [120, 135],
      [150, 175],
      [180, 215],
      [210, 250],
      [240, 300],
    ],
  },
  // Queens — solve seconds; faster is better.
  queens: {
    mode: 'max',
    metric: 'score',
    max: 200,
    tiers: [
      [45, 200],
      [90, 150],
      [135, 100],
      [180, 50],
    ],
  },
  // Tango — solve seconds; faster is better.
  tango: {
    mode: 'max',
    metric: 'score',
    max: 150,
    tiers: [
      [45, 150],
      [90, 110],
      [135, 70],
      [180, 30],
    ],
  },
  // Pinpoint — categories solved in a 60s round.
  pinpoint: {
    mode: 'min',
    metric: 'score',
    max: 150,
    tiers: [
      [1, 30],
      [2, 60],
      [3, 90],
      [4, 120],
      [5, 150],
    ],
  },
  // Toad Hop — perfect landings in a 60s round (or 3 falls). Bounded count, no
  // luck: the only way to score is genuine hold/release timing under a band
  // that narrows as the round goes on. Same trust model as whack/typing/pinpoint.
  toadhop: {
    mode: 'min',
    metric: 'score',
    max: 250,
    tiers: [
      [4, 10],
      [8, 25],
      [12, 45],
      [16, 70],
      [20, 100],
      [25, 135],
      [30, 175],
      [35, 215],
      [40, 250],
    ],
  },
}

export function isKnownGame(game: string): boolean {
  return game in TIER_TABLES
}

export function maxPointsForGame(game: string): number {
  return TIER_TABLES[game]?.max ?? 0
}

export function pointsForScore(game: string, score: number, detail?: ScoreDetail): number {
  const cfg = TIER_TABLES[game]
  if (!cfg || !Number.isFinite(score) || score <= 0) return 0
  const value = cfg.metric === 'highestTile' ? (detail?.highestTile ?? 0) : score
  if (!Number.isFinite(value) || value <= 0) return 0

  let pts = 0
  for (const [at, p] of cfg.tiers) {
    if (cfg.mode === 'min') {
      if (value >= at) pts = p
      else break
    } else if (value <= at) {
      pts = p
      break
    }
  }
  return Math.max(0, Math.min(pts, cfg.max))
}

export function todayUtc(date: Date): string {
  return date.toISOString().slice(0, 10)
}
