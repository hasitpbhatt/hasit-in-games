import { create } from 'zustand'
import type { GameId } from '../lib/points'
import {
  ACHIEVEMENTS,
  CHAMBERS,
  CHAMBER_ORDER,
  TITLES,
  type ProgressSnapshot,
  type StreakTier,
  chamberHealed,
  computeSoulPct,
  streakTier,
  titleById,
  achievementById,
  todayUtc,
  yesterdayUtc,
} from '../lib/story'

// Local-first progression for the narrative soul layer. Stored in localStorage.
// Everything here is derived from server-ACCEPTED runs (recorded by
// useScoreSubmit when res.points > 0 || res.capped), so garbage/bot scores never
// advance anything. Titles, achievements, and streaks mint ZERO points — the
// PEPE ledger and daily caps are never touched by this store.

interface Persisted {
  v: number
  scores: Partial<Record<GameId, number>>
  tiles: Partial<Record<string, number>>
  lifetimePoints: number
  plays: number
  streak: number
  lastPlayDate: string | null
  introSeen: boolean
  welcomeDate: string | null
  briefings: string[]
}

const KEY = 'sa:progress'
const V = 1

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Persisted
      if (p && p.v === V) return p
    }
  } catch {
    /* storage unavailable — ignore */
  }
  return {
    v: V,
    scores: {},
    tiles: {},
    lifetimePoints: 0,
    plays: 0,
    streak: 0,
    lastPlayDate: null,
    introSeen: false,
    welcomeDate: null,
    briefings: [],
  }
}

function save(p: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable — ignore */
  }
}

function snapshot(p: Persisted): Omit<ProgressSnapshot, 'unlocked'> & { unlocked: string[] } {
  const base: ProgressSnapshot = {
    scores: p.scores,
    tiles: p.tiles,
    purified: [],
    lifetimePoints: p.lifetimePoints,
    plays: p.plays,
    unlocked: [],
  }
  base.purified = CHAMBER_ORDER.filter((id) => chamberHealed(CHAMBERS[id], base))
  base.unlocked = ACHIEVEMENTS.filter((a) => a.test(base)).map((a) => a.id)
  return base
}

function derived(p: Persisted) {
  const snap = snapshot(p)
  const soulPct = computeSoulPct(snap.purified.length, snap.unlocked.length)
  const titles = TITLES.filter((t) => t.test(snap))
    .sort((a, b) => a.rank - b.rank)
    .map((t) => t.id)
  return { purified: snap.purified, unlocked: snap.unlocked, titles, soulPct, snap }
}

export interface NarrativeNotice {
  kind: 'achievement' | 'title' | 'welcome'
  label: string
  text: string
}

interface ProgressState {
  scores: Partial<Record<GameId, number>>
  tiles: Partial<Record<string, number>>
  lifetimePoints: number
  plays: number
  streak: number
  introSeen: boolean
  welcomeDate: string | null
  briefings: string[]
  purified: GameId[]
  unlocked: string[]
  titles: string[]
  soulPct: number
  streakTier: StreakTier | null
  notice: NarrativeNotice | null
  briefed: (game: GameId) => boolean
  recordAccepted: (game: GameId, score: number, tile?: number, points?: number) => void
  markIntroSeen: () => void
  markBriefed: (game: GameId) => void
  clearNotice: () => void
  refresh: () => void
}

const init = load()
const initDerived = derived(init)
const initStreakTier = streakTier(init.streak)

export const useProgress = create<ProgressState>((set, get) => ({
  scores: init.scores,
  tiles: init.tiles,
  lifetimePoints: init.lifetimePoints,
  plays: init.plays,
  streak: init.streak,
  introSeen: init.introSeen,
  welcomeDate: init.welcomeDate,
  briefings: init.briefings,
  purified: initDerived.purified,
  unlocked: initDerived.unlocked,
  titles: initDerived.titles,
  soulPct: initDerived.soulPct,
  streakTier: initStreakTier,
  notice: null,

  briefed: (game) => get().briefings.includes(game),

  recordAccepted: (game, score, tile, points) => {
    const p = load()
    const def = CHAMBERS[game]
    const dir = def?.direction ?? 'higher'
    const prev = p.scores[game]
    p.scores[game] = prev == null ? score : dir === 'lower' ? Math.min(prev, score) : Math.max(prev, score)
    if (tile != null) p.tiles['2048'] = Math.max(p.tiles['2048'] ?? 0, tile)
    p.plays += 1
    if (points != null && points > 0) p.lifetimePoints += points

    const today = todayUtc()
    if (p.lastPlayDate !== today) {
      p.streak = p.lastPlayDate === yesterdayUtc() ? p.streak + 1 : 1
      p.lastPlayDate = today
    }
    save(p)

    const before = get()
    const after = derived(p)
    const newTitles = after.titles.filter((t) => !before.titles.includes(t))
    const newUnlocked = after.unlocked.filter((u) => !before.unlocked.includes(u))

    let notice: NarrativeNotice | null = null
    if (newTitles.length > 0) {
      const last = newTitles[newTitles.length - 1]
      const t = titleById(last)
      notice = {
        kind: 'title',
        label: 'Title conferred',
        text: `Croak names you the ${t?.name ?? '\u2026'} — guard the cabinets well.`,
      }
    } else if (newUnlocked.length > 0) {
      const last = newUnlocked[newUnlocked.length - 1]
      const a = achievementById(last)
      notice = { kind: 'achievement', label: 'Achievement unlocked', text: `${a?.name} — ${a?.flavor}` }
    }

    set({
      scores: p.scores,
      tiles: p.tiles,
      lifetimePoints: p.lifetimePoints,
      plays: p.plays,
      streak: p.streak,
      briefings: p.briefings,
      purified: after.purified,
      unlocked: after.unlocked,
      titles: after.titles,
      soulPct: after.soulPct,
      streakTier: streakTier(p.streak),
      notice: notice ?? before.notice,
    })
  },

  markIntroSeen: () => {
    const p = load()
    p.introSeen = true
    save(p)
    set({ introSeen: true })
  },

  markBriefed: (game) => {
    const p = load()
    if (!p.briefings.includes(game)) {
      p.briefings.push(game)
      save(p)
    }
    set({ briefings: p.briefings })
  },

  clearNotice: () => set({ notice: null }),

  refresh: () => {
    const p = load()
    const today = todayUtc()
    let notice = get().notice
    if (p.welcomeDate !== today) {
      p.welcomeDate = today
      const days = p.streak
      const text =
        days >= 7
          ? `Day ${days}. The sign says OPEN. It means you.`
          : days >= 2
            ? `Day ${days} — the neon\u2019s a little brighter.`
            : 'Back on shift, keeper. The cabinets missed you.'
      notice = { kind: 'welcome', label: 'Welcome back', text }
      save(p)
    }
    const after = derived(p)
    set({
      ...p,
      purified: after.purified,
      unlocked: after.unlocked,
      titles: after.titles,
      soulPct: after.soulPct,
      streakTier: streakTier(p.streak),
      notice,
    })
  },
}))
