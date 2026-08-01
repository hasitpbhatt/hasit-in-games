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

const MAX_SCORE = 1_000_000

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  let body: { game?: string; score?: number; playSeconds?: number }
  try {
    body = await readBody<{ game?: string; score?: number; playSeconds?: number }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }

  const game = body.game ?? ''
  const score = Number(body.score)
  const playSeconds = Number(body.playSeconds)

  if (!isKnownGame(game)) return error('Unknown game')
  if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) return error('Invalid score')
  if (!Number.isFinite(playSeconds) || playSeconds < MIN_PLAY_SECONDS) {
    return error(`Playtime too short — play at least ${MIN_PLAY_SECONDS}s`)
  }

  const points = pointsForScore(game, score)
  if (points <= 0) return error('Score too low to earn points')

  const day = todayUtc(new Date())

  // Per-user daily cap.
  const earnedToday = await todayEarned(db, user.id)
  const userRemaining = DAILY_USER_CAP - earnedToday
  const userAward = Math.min(points, Math.max(0, userRemaining))

  // Global daily pot.
  const budgetRow = await db
    .prepare('SELECT points_issued FROM daily_budget WHERE date = ?1')
    .bind(day)
    .first<{ points_issued: number }>()
  const issued = budgetRow?.points_issued ?? 0
  const globalRemaining = Math.max(0, DAILY_GLOBAL_POINTS - issued)
  const award = Math.min(userAward, globalRemaining)

  if (award <= 0) {
    // Still record the play but award nothing (pot or user cap drained).
    await db
      .prepare('INSERT INTO score_events (user_id, game, score, points) VALUES (?1, ?2, ?3, 0)')
      .bind(user.id, game, score)
      .run()
    return json({
      points: 0,
      balance: user.balance,
      todayEarned: earnedToday,
      capped: true,
    })
  }

  await db.batch([
    db
      .prepare('INSERT INTO score_events (user_id, game, score, points) VALUES (?1, ?2, ?3, ?4)')
      .bind(user.id, game, score, award),
    db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(award, user.id),
    db
      .prepare('INSERT INTO daily_budget (date, points_issued) VALUES (?1, ?2) ON CONFLICT(date) DO UPDATE SET points_issued = points_issued + ?2')
      .bind(day, award),
  ])

  const newBalance = user.balance + award
  return json({
    points: award,
    balance: newBalance,
    todayEarned: earnedToday + award,
    capped: award < points,
  })
}
