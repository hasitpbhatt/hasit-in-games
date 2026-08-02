// Server-side soul-progress verification — AUTHORITATIVE.
// The client computes the same 0–100% arcade soul from local state, but the
// one-time completion reward is only granted here, after re-deriving progress
// from the user's accepted score history. This mirrors src/lib/story.ts
// (CHAMBERS thresholds + ACHIEVEMENTS tests); keep both in sync.

interface ChamberThreshold {
  metric: 'score' | 'tile'
  direction: 'higher' | 'lower'
  threshold: number
}

const CHAMBER_THRESHOLDS: Record<string, ChamberThreshold> = {
  memory: { metric: 'score', direction: 'higher', threshold: 1000 },
  whack: { metric: 'score', direction: 'higher', threshold: 25 },
  snake: { metric: 'score', direction: 'higher', threshold: 25 },
  toadhop: { metric: 'score', direction: 'higher', threshold: 25 },
  typing: { metric: 'score', direction: 'higher', threshold: 180 },
  pinpoint: { metric: 'score', direction: 'higher', threshold: 4 },
  wordladder: { metric: 'score', direction: 'higher', threshold: 20 },
  anagram: { metric: 'score', direction: 'higher', threshold: 20 },
  panel: { metric: 'score', direction: 'lower', threshold: 90 },
  queens: { metric: 'score', direction: 'lower', threshold: 135 },
  tango: { metric: 'score', direction: 'lower', threshold: 90 },
  '2048': { metric: 'tile', direction: 'higher', threshold: 256 },
}

// Mirrors ACHIEVEMENTS.length in src/lib/story.ts: first play, first purify,
// one per healed cabinet, and the 10k lifetime-points ledger seal.
const CHAMBER_COUNT = Object.keys(CHAMBER_THRESHOLDS).length
const ACHIEVEMENT_COUNT = 15
const LIFETIME_POINTS_ACHIEVEMENT = 10_000

export const SOUL_COMPLETION_BONUS = 5_000

export interface SoulProgress {
  purifiedCount: number
  unlockedCount: number
  soulPct: number
  complete: boolean
}

export async function soulProgress(db: D1Database, userId: number): Promise<SoulProgress> {
  const bests = await db
    .prepare(
      `SELECT game, MAX(score) AS best, MAX(COALESCE(highest_tile, 0)) AS best_tile
       FROM score_events WHERE user_id = ?1 GROUP BY game`,
    )
    .bind(userId)
    .all<{ game: string; best: number; best_tile: number }>()

  const byGame = new Map<string, { best: number; best_tile: number }>()
  for (const row of bests.results ?? []) byGame.set(row.game, row)

  let purifiedCount = 0
  for (const [game, def] of Object.entries(CHAMBER_THRESHOLDS)) {
    const rec = byGame.get(game)
    if (!rec) continue
    const value = def.metric === 'tile' ? rec.best_tile : rec.best
    if (value <= 0) continue
    const healed = def.direction === 'lower' ? value <= def.threshold : value >= def.threshold
    if (healed) purifiedCount++
  }

  const totals = await db
    .prepare('SELECT COUNT(*) AS plays, COALESCE(SUM(points), 0) AS lifetime FROM score_events WHERE user_id = ?1')
    .bind(userId)
    .first<{ plays: number; lifetime: number }>()

  let unlockedCount = 0
  if (purifiedCount >= 1) unlockedCount++ // first_purify
  unlockedCount += purifiedCount // purify_<game> per healed cabinet
  if ((totals?.plays ?? 0) >= 1) unlockedCount++ // first_play
  if ((totals?.lifetime ?? 0) >= LIFETIME_POINTS_ACHIEVEMENT) unlockedCount++ // skill_credits

  const soulPct = Math.max(
    0,
    Math.min(100, Math.round(70 * (purifiedCount / CHAMBER_COUNT) + 30 * (unlockedCount / ACHIEVEMENT_COUNT))),
  )
  return { purifiedCount, unlockedCount, soulPct, complete: soulPct >= 100 }
}
