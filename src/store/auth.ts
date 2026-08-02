import { create } from 'zustand'
import { api } from '../lib/api'
import type { Payout, User } from '../lib/types'

interface AuthState {
  user: User | null
  todayEarned: number
  todayCap: number
  payouts: Payout[]
  loading: boolean
  createGuest: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  loadPayouts: () => Promise<void>
  applyPromoCode: (code: string) => Promise<number>
  applyEarned: (balance: number, todayEarned: number) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  todayEarned: 0,
  todayCap: 0,
  payouts: [],
  loading: true,

  createGuest: async () => {
    const data = await api.guest()
    set({ user: data.user, todayEarned: data.todayEarned, todayCap: data.todayCap, loading: false })
  },

  logout: async () => {
    await api.logout()
    set({ user: null, todayEarned: 0, todayCap: 0, payouts: [] })
  },

  refresh: async () => {
    try {
      const data = await api.me()
      set({ user: data.user, todayEarned: data.todayEarned, todayCap: data.todayCap, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  loadPayouts: async () => {
    const data = await api.payouts()
    set({ payouts: data.payouts })
  },

  applyPromoCode: async (code) => {
    const data = await api.redeemCode(code)
    set((state) => ({ user: state.user ? { ...state.user, balance: data.balance } : null }))
    return data.points
  },

  applyEarned: (balance, todayEarned) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
      todayEarned,
    })),
}))
