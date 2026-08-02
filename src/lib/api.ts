import type { GameId } from './points'
import type { MeResponse, Payout, ScoreResult } from './types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...init,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`
    throw new ApiError(res.status, msg)
  }
  return body as T
}

export const api = {
  register(username: string, password: string) {
    return request<MeResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  login(username: string, password: string) {
    return request<MeResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  logout() {
    return request<{ ok: true }>('/api/logout', { method: 'POST' })
  },

  me() {
    return request<MeResponse>('/api/me')
  },

  submitScore(game: GameId, score: number, playSeconds: number) {
    return request<ScoreResult>('/api/score', {
      method: 'POST',
      body: JSON.stringify({ game, score, playSeconds }),
    })
  },

  undoScore() {
    return request<{ ok: true; balance: number; todayEarned: number }>('/api/score/undo', {
      method: 'POST',
    })
  },

  redeem(faucetpayUsername: string) {
    return request<{ balance: number; payout: Payout }>('/api/redeem', {
      method: 'POST',
      body: JSON.stringify({ faucetpayUsername }),
    })
  },

  redeemCode(code: string) {
    return request<{ points: number; balance: number }>('/api/redeem-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },

  payouts() {
    return request<{ payouts: Payout[] }>('/api/payouts')
  },
}
