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
}

export interface Payout {
  id: number
  trxAmount: number
  pointsCost: number
  payoutId: string | null
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
}

export type GameId = '2048' | 'memory' | 'whack' | 'reaction' | 'snake' | 'typing'

export interface GameDefinition {
  id: GameId
  name: string
  description: string
  icon: string
}
