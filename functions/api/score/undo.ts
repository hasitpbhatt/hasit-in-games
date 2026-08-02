import { getUserByToken, readSessionCookie, todayEarned } from '../../_shared/db'
import { error, json, type Env } from '../../_shared/http'

const UNDO_WINDOW_SECONDS = 5

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  // Find the most recent award for this user within the undo window.
  // created_at is stored as UTC 'YYYY-MM-DD HH:MM:SS' (SQLite datetime('now')).
  const latest = await db
    .prepare(
      "SELECT id, points, ip, created_at FROM score_events WHERE user_id = ?1 AND points > 0 AND created_at >= datetime('now', ?2) ORDER BY id DESC LIMIT 1",
    )
    .bind(user.id, `-${UNDO_WINDOW_SECONDS} seconds`)
    .first<{ id: number; points: number; ip: string | null; created_at: string }>()
  if (!latest) {
    return error('No recent submission to undo', 409)
  }

  const day = latest.created_at.slice(0, 10)

  // Atomically: delete the event, refund the balance (never below 0), and
  // decrement all three caps.
  await db.batch([
    db.prepare('DELETE FROM score_events WHERE id = ?1').bind(latest.id),
    db.prepare('UPDATE users SET balance = MAX(0, balance - ?1) WHERE id = ?2').bind(latest.points, user.id),
    db
      .prepare('UPDATE user_daily SET points_issued = MAX(0, points_issued - ?1) WHERE user_id = ?2 AND date = ?3')
      .bind(latest.points, user.id, day),
    db.prepare('UPDATE daily_budget SET points_issued = MAX(0, points_issued - ?1) WHERE date = ?2').bind(latest.points, day),
    ...(latest.ip
      ? [
          db
            .prepare('UPDATE ip_daily SET points_issued = MAX(0, points_issued - ?1) WHERE ip = ?2 AND date = ?3')
            .bind(latest.points, latest.ip, day),
        ]
      : []),
  ])

  const userNow = await db.prepare('SELECT balance FROM users WHERE id = ?1').bind(user.id).first<{ balance: number }>()
  const earned = await todayEarned(db, user.id)

  return json({ ok: true, balance: userNow?.balance ?? 0, todayEarned: earned })
}
