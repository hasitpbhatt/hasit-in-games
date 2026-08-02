import { getUserByToken, readSessionCookie, todayEarned } from '../_shared/db'
import {
  DAILY_GLOBAL_POINTS,
  DAILY_USER_CAP,
  MIN_PLAY_SECONDS,
  isKnownGame,
  pointsForScore,
  todayUtc,
} from '../_shared/economy'
import { error, json, readBody, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const MAX_SCORE = 1_000_000

// Reserve against the global daily pot. Atomic: the conditional UPDATE fails
// (changes !== 1) if the pot is already exhausted, so concurrent submits can't
// overshoot it. Returns the points actually awarded (clamped to what's left).
async function reserveGlobal(db: D1Database, day: string, amount: number): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO daily_budget (date, points_issued) VALUES (?1, ?2)
       ON CONFLICT(date) DO UPDATE SET points_issued = points_issued + ?2
       WHERE points_issued + ?2 <= ?3`,
    )
    .bind(day, amount, DAILY_GLOBAL_POINTS)
    .run()
  if (res.meta.changes === 1) return amount
  const row = await db
    .prepare('SELECT points_issued FROM daily_budget WHERE date = ?1')
    .bind(day)
    .first<{ points_issued: number }>()
  const remaining = DAILY_GLOBAL_POINTS - (row?.points_issued ?? 0)
  if (remaining <= 0) return 0
  const partial = Math.min(amount, remaining)
  const retry = await db
    .prepare('UPDATE daily_budget SET points_issued = points_issued + ?1 WHERE date = ?2 AND points_issued + ?1 <= ?3')
    .bind(partial, day, DAILY_GLOBAL_POINTS)
    .run()
  return retry.meta.changes === 1 ? partial : 0
}

// Reserve against the per-user daily cap. Same atomic pattern as reserveGlobal.
async function reserveUser(db: D1Database, userId: number, day: string, amount: number): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO user_daily (user_id, date, points_issued) VALUES (?1, ?2, ?3)
       ON CONFLICT(user_id, date) DO UPDATE SET points_issued = points_issued + ?3
       WHERE points_issued + ?3 <= ?4`,
    )
    .bind(userId, day, amount, DAILY_USER_CAP)
    .run()
  if (res.meta.changes === 1) return amount
  const row = await db
    .prepare('SELECT points_issued FROM user_daily WHERE user_id = ?1 AND date = ?2')
    .bind(userId, day)
    .first<{ points_issued: number }>()
  const remaining = DAILY_USER_CAP - (row?.points_issued ?? 0)
  if (remaining <= 0) return 0
  const partial = Math.min(amount, remaining)
  const retry = await db
    .prepare('UPDATE user_daily SET points_issued = points_issued + ?1 WHERE user_id = ?2 AND date = ?3 AND points_issued + ?1 <= ?4')
    .bind(partial, userId, day, DAILY_USER_CAP)
    .run()
  return retry.meta.changes === 1 ? partial : 0
}

// Give back a global reservation that the user cap refused, so the shared pot
// isn't consumed by points that were never awarded.
async function refundGlobal(db: D1Database, day: string, amount: number): Promise<void> {
  await db
    .prepare('UPDATE daily_budget SET points_issued = MAX(0, points_issued - ?1) WHERE date = ?2')
    .bind(amount, day)
    .run()
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  if (!(await rateLimitOk(db, 'score', String(user.id)))) {
    return error('Too many submissions — slow down', 429)
  }

  let body: { game?: string; score?: number; playSeconds?: number }
  try {
    body = await readBody<{ game?: string; score?: number; playSeconds?: number }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }

  const game = body.game ?? ''
  const score = body.score
  const playSeconds = body.playSeconds

  // Strict type checks: Number("500") or Boolean(true) must NOT slip through.
  if (!isKnownGame(game)) return error('Unknown game')
  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
    return error('Invalid score')
  }
  if (typeof playSeconds !== 'number' || !Number.isFinite(playSeconds) || playSeconds < MIN_PLAY_SECONDS) {
    return error(`Playtime too short — play at least ${MIN_PLAY_SECONDS}s`)
  }

  const points = pointsForScore(game, score)
  if (points <= 0) return error('Score too low to earn points')

  const day = todayUtc(new Date())

  // Reserve from the global pot first, then the user cap. Both are atomic, so
  // concurrent submits at the cap boundary can't overshoot either limit.
  const globalAward = await reserveGlobal(db, day, points)
  if (globalAward <= 0) {
    await db
      .prepare('INSERT INTO score_events (user_id, game, score, points) VALUES (?1, ?2, ?3, 0)')
      .bind(user.id, game, score)
      .run()
    return json({ points: 0, balance: user.balance, todayEarned: await todayEarned(db, user.id), capped: true })
  }

  const userAward = await reserveUser(db, user.id, day, globalAward)
  if (userAward < globalAward) {
    await refundGlobal(db, day, globalAward - userAward)
  }
  if (userAward <= 0) {
    await db
      .prepare('INSERT INTO score_events (user_id, game, score, points) VALUES (?1, ?2, ?3, 0)')
      .bind(user.id, game, score)
      .run()
    return json({ points: 0, balance: user.balance, todayEarned: await todayEarned(db, user.id), capped: true })
  }

  await db.batch([
    db
      .prepare('INSERT INTO score_events (user_id, game, score, points) VALUES (?1, ?2, ?3, ?4)')
      .bind(user.id, game, score, userAward),
    db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(userAward, user.id),
  ])

  const newBalance = user.balance + userAward
  return json({
    points: userAward,
    balance: newBalance,
    todayEarned: await todayEarned(db, user.id),
    capped: userAward < points,
  })
}
