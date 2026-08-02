// Points economy — CLIENT copy of server constants.
// The server (functions/_shared/economy.ts) is authoritative and recomputes
// every award from the raw score; scoring formulas live ONLY there.

// Payout currency config — mirrors functions/_shared/economy.ts.
// Change the coin here (and the server mirror) and everything else follows.
export const PAYOUT_CURRENCY = {
  currency: 'PEPE', // FaucetPay currency code
  symbol: 'PEPE', // display abbreviation
  pointsPerUnit: 1_000, // points needed to redeem 1 unit
  minUnits: 1, // minimum redeemable units
  unitsPerWhole: 1, // FaucetPay amount base unit per whole unit
} as const

export const MIN_REDEMPTION_POINTS = PAYOUT_CURRENCY.pointsPerUnit * PAYOUT_CURRENCY.minUnits

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
  'toadhop',
] as const
export type GameId = (typeof GAME_IDS)[number]

export interface GameDef {
  id: GameId
  name: string
  description: string
  rules: string
  icon: string
  maxPointsPerPlay: number
}

export const GAMES: GameDef[] = [
  {
    id: '2048',
    name: '2048',
    description: 'Slide tiles, merge numbers, chase 2048.',
    rules: 'Slide tiles to combine matching numbers. Points scale with the highest tile you reach — a full 500 pts at 2048.',
    icon: '🔢',
    maxPointsPerPlay: 500,
  },
  {
    id: 'memory',
    name: 'Memory Match',
    description: 'Flip cards and find matching pairs.',
    rules: 'Find all 8 pairs in as few moves as possible. Fewer moves = more points.',
    icon: '🧠',
    maxPointsPerPlay: 300,
  },
  {
    id: 'whack',
    name: 'Whack-a-Mole',
    description: 'Whack moles before they hide.',
    rules: 'Tap moles as they pop up. More moles whacked in 30 seconds = more points.',
    icon: '🔨',
    maxPointsPerPlay: 250,
  },
  {
    id: 'reaction',
    name: 'Reaction Time',
    description: 'Tap as fast as you can.',
    rules: 'Wait for the screen to change, then tap as fast as you can. Faster average reaction across 5 trials = more points.',
    icon: '⚡',
    maxPointsPerPlay: 150,
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Grow the snake, don\'t crash.',
    rules: 'Guide the snake to eat food and grow. Longer runs pay more — points scale with food eaten.',
    icon: '🐍',
    maxPointsPerPlay: 400,
  },
  {
    id: 'typing',
    name: 'Typing Sprint',
    description: 'How fast can you type?',
    rules: 'Type as many words as you can in 30 seconds. More correct characters = more points.',
    icon: '⌨️',
    maxPointsPerPlay: 300,
  },
  {
    id: 'queens',
    name: 'Queens',
    description: 'One queen per row, column & color — no two may touch.',
    rules: 'Place 8 queens on the board so no two queens threaten each other. Solve faster = more points.',
    icon: '👑',
    maxPointsPerPlay: 200,
  },
  {
    id: 'tango',
    name: 'Tango',
    description: 'Balance suns & moons — no three in a row.',
    rules: 'Fill the grid with sun and moon symbols. Each row and column must have exactly 3 of each. Solve faster = more points.',
    icon: '☀️',
    maxPointsPerPlay: 150,
  },
  {
    id: 'pinpoint',
    name: 'Pinpoint',
    description: 'Guess the category from the fewest clues.',
    rules: 'Read 8 clues per round and guess the category. More categories solved in 60 seconds = more points.',
    icon: '🎯',
    maxPointsPerPlay: 150,
  },
  {
    id: 'toadhop',
    name: 'Toad Hop',
    description: 'Hold to charge the frog, release to re-light the lily circuit.',
    rules: 'Hold to charge the leap, release inside the glowing band for a perfect landing. Each perfect re-lights a lily pad. Three falls end the round.',
    icon: '🐸',
    maxPointsPerPlay: 250,
  },
]
