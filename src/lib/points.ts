// Points economy — single source of truth for the CLIENT.
// The server (functions/_shared/economy.ts) is authoritative; keep these in sync.

// 1 TRX = 10,000 points; 1 TRX ≈ $0.20 (verify at launch).
export const POINTS_PER_TRX = 10_000
export const MIN_REDEMPTION_POINTS = POINTS_PER_TRX // 1 TRX

// Global daily pot: ~$0.10/day → 5,000 points issued globally per UTC day.
export const DAILY_GLOBAL_POINTS = 5_000

// Per-user daily earning cap: ~$0.02–0.04/day.
export const DAILY_USER_CAP = 2_000

// Minimum play time (seconds) before a score is accepted — anti-automation.
export const MIN_PLAY_SECONDS = 5

export const GAME_IDS = ['2048', 'memory', 'whack', 'reaction', 'snake', 'typing'] as const
export type GameId = (typeof GAME_IDS)[number]

export interface GameDef {
  id: GameId
  name: string
  description: string
  icon: string
  maxPointsPerPlay: number
}

export const GAMES: GameDef[] = [
  {
    id: '2048',
    name: '2048',
    description: 'Slide tiles, merge numbers, chase 2048.',
    icon: '🔢',
    maxPointsPerPlay: 500,
  },
  {
    id: 'memory',
    name: 'Memory Match',
    description: 'Flip cards and find matching pairs.',
    icon: '🧠',
    maxPointsPerPlay: 300,
  },
  {
    id: 'whack',
    name: 'Whack-a-Mole',
    description: 'Whack moles before they hide.',
    icon: '🔨',
    maxPointsPerPlay: 250,
  },
  {
    id: 'reaction',
    name: 'Reaction Time',
    description: 'Tap as fast as you can.',
    icon: '⚡',
    maxPointsPerPlay: 150,
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Grow the snake, don\'t crash.',
    icon: '🐍',
    maxPointsPerPlay: 400,
  },
  {
    id: 'typing',
    name: 'Typing Sprint',
    description: 'How fast can you type?',
    icon: '⌨️',
    maxPointsPerPlay: 300,
  },
]

// Client-side mirror of the server scoring formula.
export function pointsForScore(game: GameId, score: number): number {
  const def = GAMES.find((g) => g.id === game)
  if (!def || score <= 0) return 0
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
  return Math.max(0, Math.min(points, def.maxPointsPerPlay))
}
