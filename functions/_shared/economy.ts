// Server-side economy — AUTHORITATIVE. Client src/lib/points.ts mirrors this.
// Never trust client-computed points; recompute here from the raw score.

export const POINTS_PER_TRX = 10_000
export const MIN_REDEMPTION_POINTS = POINTS_PER_TRX
export const DAILY_GLOBAL_POINTS = 5_000
export const DAILY_USER_CAP = 2_000
export const MIN_PLAY_SECONDS = 5

// TRX smallest unit: 1 TRX = 1_000_000 suns.
export const SUNS_PER_TRX = 1_000_000

const GAME_LIMITS: Record<string, number> = {
  '2048': 500,
  memory: 300,
  whack: 250,
  reaction: 150,
  snake: 400,
  typing: 300,
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
    default:
      points = 0
  }
  return Math.max(0, Math.min(points, maxPointsForGame(game)))
}

export function todayUtc(date: Date): string {
  return date.toISOString().slice(0, 10)
}
