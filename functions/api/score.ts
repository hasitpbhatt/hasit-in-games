import { clientIp, getUserByToken, readSessionCookie, todayEarned } from '../_shared/db'
import {
  DAILY_GLOBAL_POINTS,
  DAILY_IP_CAP,
  DAILY_USER_CAP,
  MIN_PLAY_SECONDS,
  isKnownGame,
  pointsForScore,
  todayUtc,
  type ScoreDetail,
} from '../_shared/economy'
import { error, json, readBody, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const MAX_SCORE = 1_000_000

// How closely the client-reported playSeconds must match the wall-clock time
// since the session was minted. Generous for mobile latency, tight enough that
// claiming the 5s minimum requires actually waiting ~5s.
const SESSION_TOLERANCE_MS = 10_000

// 2048 board tiles are powers of two and never destroy value, so the highest
// tile ever reached is present on the final board and can't exceed the score
// (the cumulative sum of merged tiles).
function validHighestTile(ht: unknown, score: number): ht is number {
  return (
    typeof ht === 'number' &&
    Number.isInteger(ht) &&
    ht >= 16 &&
    ht <= 8192 &&
    (ht & (ht - 1)) === 0 &&
    ht <= score
  )
}

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

// Give back a user-cap reservation that the IP cap refused.
async function refundUser(db: D1Database, userId: number, day: string, amount: number): Promise<void> {
  await db
    .prepare('UPDATE user_daily SET points_issued = MAX(0, points_issued - ?1) WHERE user_id = ?2 AND date = ?3')
    .bind(amount, userId, day)
    .run()
}

// Reserve against the per-IP daily cap. Same atomic pattern as the others; an
// abuser juggling many accounts from one network hits this long before the
// per-user cap would stop them.
async function reserveIp(db: D1Database, ip: string, day: string, amount: number): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO ip_daily (ip, date, points_issued) VALUES (?1, ?2, ?3)
       ON CONFLICT(ip, date) DO UPDATE SET points_issued = points_issued + ?3
       WHERE points_issued + ?3 <= ?4`,
    )
    .bind(ip, day, amount, DAILY_IP_CAP)
    .run()
  if (res.meta.changes === 1) return amount
  const row = await db
    .prepare('SELECT points_issued FROM ip_daily WHERE ip = ?1 AND date = ?2')
    .bind(ip, day)
    .first<{ points_issued: number }>()
  const remaining = DAILY_IP_CAP - (row?.points_issued ?? 0)
  if (remaining <= 0) return 0
  const partial = Math.min(amount, remaining)
  const retry = await db
    .prepare('UPDATE ip_daily SET points_issued = points_issued + ?1 WHERE ip = ?2 AND date = ?3 AND points_issued + ?1 <= ?4')
    .bind(partial, ip, day, DAILY_IP_CAP)
    .run()
  return retry.meta.changes === 1 ? partial : 0
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

  let body: { game?: string; score?: number; playSeconds?: number; detail?: ScoreDetail; sessionId?: string }
  try {
    body = await readBody<{ game?: string; score?: number; playSeconds?: number; detail?: ScoreDetail; sessionId?: string }>(
      context.request,
    )
  } catch {
    return error('Invalid JSON body')
  }

  const game = body.game ?? ''
  const score = body.score
  const playSeconds = body.playSeconds
  const detail = body.detail
  const sessionId = body.sessionId
  const ip = clientIp(context.request)

  // Strict type checks: Number("500") or Boolean(true) must NOT slip through.
  if (!isKnownGame(game)) return error('Unknown game')
  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
    return error('Invalid score')
  }
  if (typeof playSeconds !== 'number' || !Number.isFinite(playSeconds) || playSeconds < MIN_PLAY_SECONDS) {
    return error(`Playtime too short — play at least ${MIN_PLAY_SECONDS}s`)
  }
  if (game === '2048' && !validHighestTile(detail?.highestTile, score)) {
    return error('Invalid score detail')
  }

  // The score must be anchored to a server-issued play session, and the claimed
  // play time must match the session's wall-clock age within tolerance. This
  // closes the "POST a max score with playSeconds: 5" farm: a session only
  // exists if the round actually started when it started.
  if (typeof sessionId !== 'string' || !sessionId) {
    return error('Missing play session — start the round first')
  }
  const session = await db
    .prepare('SELECT game, started_at FROM play_sessions WHERE id = ?1 AND user_id = ?2')
    .bind(sessionId, user.id)
    .first<{ game: string; started_at: number }>()
  if (!session || session.game !== game) {
    return error('Invalid play session')
  }
  if (Math.abs(playSeconds * 1000 - (Date.now() - session.started_at)) > SESSION_TOLERANCE_MS) {
    return error('Play session mismatch — start a fresh round')
  }

  // Soft playtime minimum: points scale linearly from 0 up to the full tier
  // reward at MIN_PLAY_SECONDS. The hard gate above keeps instant-quit spam
  // out entirely; this scaling smooths the ramp for borderline rounds.
  const tierPoints = pointsForScore(game, score, detail)
  const points = Math.floor(tierPoints * Math.min(1, playSeconds / MIN_PLAY_SECONDS))
  if (points <= 0) return error('Score too low to earn points')

  // Single-use: consume the session before awarding so a replayed round is
  // rejected even under concurrent submits (exactly one DELETE wins).
  const consumed = await db
    .prepare('DELETE FROM play_sessions WHERE id = ?1 AND user_id = ?2')
    .bind(sessionId, user.id)
    .run()
  if (consumed.meta.changes !== 1) {
    return error('Play session already used — start a fresh round', 409)
  }

  const day = todayUtc(new Date())

  // Reserve from the global pot first, then the user cap. Both are atomic, so
  // concurrent submits at the cap boundary can't overshoot either limit.
  const globalAward = await reserveGlobal(db, day, points)
  if (globalAward <= 0) {
    await db
      .prepare('INSERT INTO score_events (user_id, game, score, points, highest_tile, ip) VALUES (?1, ?2, ?3, 0, ?4, ?5)')
      .bind(user.id, game, score, detail?.highestTile ?? null, ip)
      .run()
    return json({
      points: 0,
      balance: user.balance,
      todayEarned: await todayEarned(db, user.id),
      capped: true,
      capReason: 'pot',
    })
  }

  const userAward = await reserveUser(db, user.id, day, globalAward)
  if (userAward < globalAward) {
    await refundGlobal(db, day, globalAward - userAward)
  }
  if (userAward <= 0) {
    await db
      .prepare('INSERT INTO score_events (user_id, game, score, points, highest_tile, ip) VALUES (?1, ?2, ?3, 0, ?4, ?5)')
      .bind(user.id, game, score, detail?.highestTile ?? null, ip)
      .run()
    return json({
      points: 0,
      balance: user.balance,
      todayEarned: await todayEarned(db, user.id),
      capped: true,
      capReason: 'user',
    })
  }

  // Per-IP cap: closes the multi-account bot vector. Skipped when the platform
  // doesn't supply an IP (e.g. local wrangler dev), never when it does.
  const ipAward = ip ? await reserveIp(db, ip, day, userAward) : userAward
  if (ipAward < userAward) {
    await refundGlobal(db, day, userAward - ipAward)
    await refundUser(db, user.id, day, userAward - ipAward)
  }
  if (ipAward <= 0) {
    await db
      .prepare('INSERT INTO score_events (user_id, game, score, points, highest_tile, ip) VALUES (?1, ?2, ?3, 0, ?4, ?5)')
      .bind(user.id, game, score, detail?.highestTile ?? null, ip)
      .run()
    return json({
      points: 0,
      balance: user.balance,
      todayEarned: await todayEarned(db, user.id),
      capped: true,
      capReason: 'ip',
    })
  }

  await db.batch([
    db
      .prepare('INSERT INTO score_events (user_id, game, score, points, highest_tile, ip) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
      .bind(user.id, game, score, ipAward, detail?.highestTile ?? null, ip),
    db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(ipAward, user.id),
  ])

  const newBalance = user.balance + ipAward
  return json({
    points: ipAward,
    balance: newBalance,
    todayEarned: await todayEarned(db, user.id),
    capped: ipAward < points,
    capReason: globalAward < points ? 'pot' : userAward < globalAward ? 'user' : ipAward < userAward ? 'ip' : undefined,
  })
}
