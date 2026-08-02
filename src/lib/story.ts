import type { GameId } from './points'

// The narrative layer for SkillArcade — "The Last Cabinet".
// This file is pure data + pure derivation. It never touches the economy:
// the PEPE ledger, caps, and scoring live ONLY in points.ts (client mirror) and
// functions/_shared/economy.ts (authoritative). The story here is framing.

export interface ChamberDef {
  game: GameId
  chapter: number
  chamber: string
  hook: string
  briefing: string
  accent: string
  // A chamber is Healed when the best server-accepted run crosses `threshold`.
  // metric 'tile' uses the 2048 highestTile detail; 'score' uses the raw score.
  metric: 'score' | 'tile'
  direction: 'higher' | 'lower'
  threshold: number
}

export const CHAPTERS: ReadonlyArray<{ id: number; name: string; story: string }> = [
  { id: 1, name: 'First Light', story: 'The front half of the arcade hums back to life.' },
  { id: 2, name: 'Garden of Moles & Serpents', story: 'The service closet purges its vermin.' },
  { id: 3, name: "The Order's Tongue", story: 'The order\u2019s tongue is spoken again.' },
  { id: 4, name: 'Logic Loom', story: 'The deep logic circuits re-weave.' },
  { id: 5, name: 'The Million-Tile Heart', story: 'The arcade\u2019s heart re-forges its core.' },
]

// Recommended play order: chambers are shown in this order in the vault/Journal.
export const CHAMBER_ORDER: readonly GameId[] = [
  'memory',
  'whack',
  'snake',
  'toadhop',
  'typing',
  'pinpoint',
  'wordladder',
  'anagram',
  'panel',
  'queens',
  'tango',
  '2048',
]

export const CHAMBERS: Record<GameId, ChamberDef> = {
  memory: {
    game: 'memory',
    chapter: 1,
    chamber: 'The Trophy Vault',
    hook: 'The Nullmoth threw the champions\u2019 snapshots into a mirror-storm.',
    briefing: 'Clean the memory cabinet. Find every pair — the vault remembers.',
    accent: '#f472b6',
    metric: 'score',
    direction: 'higher',
    threshold: 1000,
  },
  whack: {
    game: 'whack',
    chapter: 2,
    chamber: 'The Mole Den',
    hook: 'Larvae chewed the floor\u2019s signal — whack the whole den.',
    briefing: 'Pests in the wiring closet. Whack a full shift; the moths hate a tidy floor.',
    accent: '#f59e0b',
    metric: 'score',
    direction: 'higher',
    threshold: 25,
  },
  snake: {
    game: 'snake',
    chapter: 2,
    chamber: 'The Ghost Line',
    hook: 'A corrupted data-serpent coils through the rack — feed it the clean fruit.',
    briefing: 'Don\u2019t bite yourself, keeper. Long runs are the secret to the snake cabinet.',
    accent: '#22c55e',
    metric: 'score',
    direction: 'higher',
    threshold: 25,
  },
  toadhop: {
    game: 'toadhop',
    chapter: 2,
    chamber: 'The Lily Circuit',
    hook: 'The pond cabinet ran dry — re-light the lily pads with perfect landings.',
    briefing: 'Hold to charge the leap, release inside the band for a perfect landing. Three falls and the circuit goes dark.',
    accent: '#2dd4bf',
    metric: 'score',
    direction: 'higher',
    threshold: 25,
  },
  typing: {
    game: 'typing',
    chapter: 3,
    chamber: 'The Rescue Beacon',
    hook: 'Retype the caretaker\u2019s transmission to call the drained cabinets home.',
    briefing: 'Keyboard cabinet. Type fast, type true — my digits are too webbed for this one.',
    accent: '#60a5fa',
    metric: 'score',
    direction: 'higher',
    threshold: 180,
  },
  pinpoint: {
    game: 'pinpoint',
    chapter: 3,
    chamber: 'The Lost Signposts',
    hook: 'The Nullmoth scrambled every sign — name the categories to light the way.',
    briefing: 'The signs are scrambled. Guess the categories and light the way.',
    accent: '#34d399',
    metric: 'score',
    direction: 'higher',
    threshold: 4,
  },
  wordladder: {
    game: 'wordladder',
    chapter: 3,
    chamber: 'The Stepladder Pass',
    hook: 'The signs hang in broken chains — change one letter at a time and climb back to the naming.',
    briefing: 'A word-chain cabinet. Change one letter per rung; land on the target word to move on.',
    accent: '#38bdf8',
    metric: 'score',
    direction: 'higher',
    threshold: 20,
  },
  anagram: {
    game: 'anagram',
    chapter: 3,
    chamber: 'The Letter Storm',
    hook: 'The Nullmoth shredded the marquee — spell the scattered letters back into words.',
    briefing: 'Unscramble the rack. Every word you find restores a letter of the sign.',
    accent: '#facc15',
    metric: 'score',
    direction: 'higher',
    threshold: 20,
  },
  panel: {
    game: 'panel',
    chapter: 4,
    chamber: 'The Feedback Loop',
    hook: 'The logic circuits hum out of phase — flip the panel dark, one tap at a time.',
    briefing: 'Tap a tile to flip it and its neighbours. Darken the whole panel to seal the loop.',
    accent: '#818cf8',
    metric: 'score',
    direction: 'lower',
    threshold: 90,
  },
  queens: {
    game: 'queens',
    chapter: 4,
    chamber: 'The Throne of Founders',
    hook: 'Gertie\u2019s crown waits on the back wall — seat the queens so the patron returns.',
    briefing: 'The court waits. Place eight queens that never threaten each other.',
    accent: '#a78bfa',
    metric: 'score',
    direction: 'lower',
    threshold: 135,
  },
  tango: {
    game: 'tango',
    chapter: 4,
    chamber: 'The Balance Core',
    hook: 'Sun and moon fell out of phase — set them even and the arcade hums on key.',
    briefing: 'Balance the dials — three of each in every row and column.',
    accent: '#fb923c',
    metric: 'score',
    direction: 'lower',
    threshold: 90,
  },
  '2048': {
    game: '2048',
    chapter: 5,
    chamber: 'The Motherboard Forge',
    hook: 'The arcade\u2019s fusion core shattered — merge the shards back into power.',
    briefing: 'Clean the tile cabinet. Merge to 2048 and the screen stays on.',
    accent: '#d946ef',
    metric: 'tile',
    direction: 'higher',
    threshold: 256,
  },
}

// Progression snapshot consumed by achievement/title tests.
export interface ProgressSnapshot {
  scores: Partial<Record<GameId, number>>
  tiles: Partial<Record<string, number>>
  purified: GameId[]
  lifetimePoints: number
  plays: number
  unlocked: string[]
}

export function chamberHealed(def: ChamberDef, snap: ProgressSnapshot): boolean {
  if (def.metric === 'tile') {
    return (snap.tiles[def.game] ?? 0) >= def.threshold
  }
  const best = snap.scores[def.game]
  if (best == null) return false
  return def.direction === 'lower' ? best <= def.threshold : best >= def.threshold
}

export function purifiedFor(snap: ProgressSnapshot): GameId[] {
  return CHAMBER_ORDER.filter((id) => chamberHealed(CHAMBERS[id], snap))
}

export interface AchievementDef {
  id: string
  name: string
  flavor: string
  test: (snap: ProgressSnapshot) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_play',
    name: "Caretaker's Call",
    flavor: 'You hear the arcade.',
    test: (s) => s.plays >= 1,
  },
  {
    id: 'first_purify',
    name: 'First Spark',
    flavor: 'One cabinet hums again.',
    test: (s) => s.purified.length >= 1,
  },
  {
    id: 'purify_2048',
    name: 'Tile Ascendant',
    flavor: 'The heart beats at 256.',
    test: (s) => s.purified.includes('2048'),
  },
  {
    id: 'purify_memory',
    name: 'Unbroken Pair',
    flavor: 'You remember what was lost.',
    test: (s) => s.purified.includes('memory'),
  },
  {
    id: 'purify_whack',
    name: 'Mole Marshal',
    flavor: 'No mole is safe.',
    test: (s) => s.purified.includes('whack'),
  },
  {
    id: 'purify_snake',
    name: 'Serpent Sovereign',
    flavor: 'Longer than the dark.',
    test: (s) => s.purified.includes('snake'),
  },
  {
    id: 'purify_typing',
    name: 'Key Saint',
    flavor: "The Order's tongue is yours.",
    test: (s) => s.purified.includes('typing'),
  },
  {
    id: 'purify_queens',
    name: 'Regal Strategist',
    flavor: 'Eight queens, zero threats.',
    test: (s) => s.purified.includes('queens'),
  },
  {
    id: 'purify_tango',
    name: 'Solar Balancer',
    flavor: 'Day and night, at peace.',
    test: (s) => s.purified.includes('tango'),
  },
  {
    id: 'purify_pinpoint',
    name: 'Category Sphinx',
    flavor: 'You see the shape of things.',
    test: (s) => s.purified.includes('pinpoint'),
  },
  {
    id: 'purify_wordladder',
    name: 'Stepmaster',
    flavor: 'You climb in single-letter strides.',
    test: (s) => s.purified.includes('wordladder'),
  },
  {
    id: 'purify_anagram',
    name: 'Rackbreaker',
    flavor: 'The letters confess their words.',
    test: (s) => s.purified.includes('anagram'),
  },
  {
    id: 'purify_panel',
    name: 'Linear Overmind',
    flavor: 'The loop closes at the speed of thought.',
    test: (s) => s.purified.includes('panel'),
  },
  {
    id: 'purify_toadhop',
    name: 'Lily Circuit Keeper',
    flavor: 'The pond remembers the frog.',
    test: (s) => s.purified.includes('toadhop'),
  },
  {
    id: 'skill_credits',
    name: 'Sealed Ledger',
    flavor: 'The Order keeps its records.',
    test: (s) => s.lifetimePoints >= 10_000,
  },
]

export function unlockedFor(snap: ProgressSnapshot): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(snap)).map((a) => a.id)
}

export interface TitleDef {
  id: string
  name: string
  desc: string
  rank: number
  test: (snap: ProgressSnapshot) => boolean
}

export const TITLES: TitleDef[] = [
  {
    id: 'novice',
    name: 'Novice Keeper',
    desc: 'Your first achievement earned.',
    rank: 1,
    test: (s) => s.unlocked.length >= 1,
  },
  {
    id: 'first',
    name: 'First Keeper',
    desc: 'Two achievements earned.',
    rank: 2,
    test: (s) => s.unlocked.length >= 2,
  },
  {
    id: 'trialmaster',
    name: 'Trialmaster',
    desc: 'Five cabinets purified.',
    rank: 3,
    test: (s) => s.purified.length >= 5,
  },
  {
    id: 'chronicler',
    name: 'Order Chronicler',
    desc: 'All twelve cabinets purified.',
    rank: 4,
    test: (s) => s.purified.length >= CHAMBER_ORDER.length,
  },
  {
    id: 'warden',
    name: 'Soul Warden',
    desc: 'Full arcade soul restored.',
    rank: 5,
    test: (s) => computeSoulPct(s.purified.length, s.unlocked.length) >= 100,
  },
  {
    id: 'legend',
    name: 'Arcade Legend',
    desc: 'Full soul and a sealed ledger.',
    rank: 6,
    test: (s) => computeSoulPct(s.purified.length, s.unlocked.length) >= 100 && s.lifetimePoints >= 10_000,
  },
]

export function titlesFor(snap: ProgressSnapshot): string[] {
  return TITLES.filter((t) => t.test(snap))
    .sort((a, b) => a.rank - b.rank)
    .map((t) => t.id)
}

export function computeSoulPct(purifiedCount: number, unlockedCount: number): number {
  const pct = 70 * (purifiedCount / CHAMBER_ORDER.length) + 30 * (unlockedCount / ACHIEVEMENTS.length)
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export function titleById(id: string): TitleDef | undefined {
  return TITLES.find((t) => t.id === id)
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

// Arcade soul meter status copy by percentage.
export const SOUL_STATUS: ReadonlyArray<readonly [at: number, text: string]> = [
  [0, 'The arcade\u2019s heart flickers\u2026'],
  [25, 'A few cabinets hum again.'],
  [50, 'The neon steadies. Keepers are home.'],
  [75, 'The floor vibrates with clean signal.'],
  [100, 'The Last Cabinet breathes.'],
]

export function soulStatus(pct: number): string {
  let text = SOUL_STATUS[0][1]
  for (const [at, t] of SOUL_STATUS) {
    if (pct >= at) text = t
    else break
  }
  return text
}

export interface StreakTier {
  id: string
  name: string
  line: string
}

export function streakTier(days: number): StreakTier | null {
  if (days >= 30) return { id: 'everflame', name: 'Everflame', line: 'The Last Cabinet remembers you.' }
  if (days >= 14) return { id: 'inferno', name: 'Inferno', line: 'The arcade forgets the dark.' }
  if (days >= 7) return { id: 'blaze', name: 'Blaze', line: 'Cabinets hum as you pass.' }
  if (days >= 3) return { id: 'kindling', name: 'Kindling', line: 'The fire grows.' }
  if (days >= 1) return { id: 'ember', name: 'Ember', line: 'Your lamp glows faintly.' }
  return null
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayUtc(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
