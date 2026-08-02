export interface User {
  id: number
  username: string
  faucetpayUsername: string | null
  balance: number
  createdAt: string
}

export interface MeResponse {
  user: User
  todayEarned: number
  todayCap: number
}

export interface ScoreResult {
  points: number
  balance: number
  todayEarned: number
  capped: boolean
  // Which ceiling ate the round: the shared daily pot ('pot'), the per-user
  // daily cap ('user'), or the per-IP daily cap ('ip'). Undefined when the
  // round wasn't capped.
  capReason?: 'pot' | 'user' | 'ip'
}

export interface SoulCompleteResult {
  awarded: boolean
  amount: number
  balance: number
  todayEarned: number
}

// Optional per-game achievement data sent with a score submission.
// Mirrors functions/_shared/economy.ts ScoreDetail.
export interface ScoreDetail {
  highestTile?: number
}

export interface Payout {
  id: number
  payoutAmount: number
  pointsCost: number
  payoutId: string | null
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
}

import type { GameId } from './points'

export interface GameDefinition {
  id: GameId
  name: string
  description: string
  icon: string
}
