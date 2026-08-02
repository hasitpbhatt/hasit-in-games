// Points economy — CLIENT copy of server constants.
// The server (functions/_shared/economy.ts) is authoritative and recomputes
// every award from the raw score; scoring formulas live ONLY there.

// 1 TRX = 10,000 points; 1 TRX ≈ $0.20 (verify at launch).
export const POINTS_PER_TRX = 10_000
export const MIN_REDEMPTION_POINTS = POINTS_PER_TRX // 1 TRX

// Global daily pot: ~$0.10/day → 5,000 points issued globally per UTC day.
export const DAILY_GLOBAL_POINTS = 5_000

// Per-user daily earning cap: ~$0.02–0.04/day.
export const DAILY_USER_CAP = 2_000

// Minimum play time (seconds) before a score is accepted — anti-automation.
export const MIN_PLAY_SECONDS = 5

export const GAME_IDS = [
  '2048',
  'memory',
  'whack',
  'reaction',
  'snake',
  'typing',
  'queens',
  'tango',
  'pinpoint',
] as const
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
  {
    id: 'queens',
    name: 'Queens',
    description: 'One queen per row, column & color — no two may touch.',
    icon: '👑',
    maxPointsPerPlay: 200,
  },
  {
    id: 'tango',
    name: 'Tango',
    description: 'Balance suns & moons — no three in a row.',
    icon: '☀️',
    maxPointsPerPlay: 150,
  },
  {
    id: 'pinpoint',
    name: 'Pinpoint',
    description: 'Guess the category from the fewest clues.',
    icon: '🎯',
    maxPointsPerPlay: 150,
  },
]
