// Server-side economy — AUTHORITATIVE. Client src/lib/points.ts mirrors this.
// Never trust client-computed points; recompute here from the raw score.

// Payout currency config — change the coin here (and the client mirror in
// src/lib/points.ts) and everything else follows.
export const PAYOUT_CURRENCY = {
  currency: 'PEPE', // FaucetPay currency code sent to the API
  symbol: 'PEPE', // display abbreviation
  pointsPerUnit: 1_000, // points needed to redeem 1 unit
  minUnits: 1, // minimum redeemable units
  unitsPerWhole: 1, // FaucetPay amount base unit per whole unit (1 = whole tokens)
} as const

export const MIN_REDEMPTION_POINTS = PAYOUT_CURRENCY.pointsPerUnit * PAYOUT_CURRENCY.minUnits
export const DAILY_GLOBAL_POINTS = 5_000
export const DAILY_USER_CAP = 2_000
export const MIN_PLAY_SECONDS = 5

const GAME_LIMITS: Record<string, number> = {
  '2048': 500,
  memory: 300,
  whack: 250,
  reaction: 150,
  snake: 400,
  typing: 300,
  queens: 200,
  tango: 150,
  pinpoint: 150,
}

export function isKnownGame(game: string): boolean {
  return game in GAME_LIMITS
}

export function maxPointsForGame(game: string): number {
  return GAME_LIMITS[game] ?? 0
}

export function pointsForScore(game: string, score: number): number {
  if (!isKnownGame(game) || !Number.isFinite(score) || score <= 0) return 0
  let points: number
  switch (game) {
    case '2048':
      points = Math.floor(score / 2)
      break
    case 'memory':
      points = Math.floor(score / 4)
      break
    case 'whack':
      points = score * 2
      break
    case 'reaction':
      points = score < 500 ? Math.floor((500 - score) / 3) : 0
      break
    case 'snake':
      points = score * 4
      break
    case 'typing':
      points = Math.floor(score / 2)
      break
    case 'queens':
      points = score > 0 ? Math.max(20, Math.min(200, 200 - score * 2)) : 0
      break
    case 'tango':
      points = score > 0 ? Math.max(15, Math.min(150, 180 - score)) : 0
      break
    case 'pinpoint':
      points = score * 30
      break
    default:
      points = 0
  }
  return Math.max(0, Math.min(points, maxPointsForGame(game)))
}

export function todayUtc(date: Date): string {
  return date.toISOString().slice(0, 10)
}
