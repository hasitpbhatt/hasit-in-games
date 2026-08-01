import { create } from 'zustand'
import { api } from '../lib/api'
import type { Payout, User } from '../lib/types'

interface AuthState {
  user: User | null
  todayEarned: number
  payouts: Payout[]
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  loadPayouts: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  todayEarned: 0,
  payouts: [],
  loading: true,

  login: async (username, password) => {
    const data = await api.login(username, password)
    set({ user: data.user, todayEarned: data.todayEarned, loading: false })
  },

  register: async (username, password) => {
    const data = await api.register(username, password)
    set({ user: data.user, todayEarned: data.todayEarned, loading: false })
  },

  logout: async () => {
    await api.logout()
    set({ user: null, todayEarned: 0, payouts: [] })
  },

  refresh: async () => {
    try {
      const data = await api.me()
      set({ user: data.user, todayEarned: data.todayEarned, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  loadPayouts: async () => {
    const data = await api.payouts()
    set({ payouts: data.payouts })
  },
}))
