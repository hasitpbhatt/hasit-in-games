import { getUserByToken, readSessionCookie } from '../../_shared/db'
import { isKnownGame } from '../../_shared/economy'
import { error, json, readBody, type Env } from '../../_shared/http'
import { rateLimitOk } from '../../_shared/rateLimit'

// Sessions are single-use nonces that anchor playSeconds to server wall-clock
// time. They're cheap to mint and purged aggressively, so no cleanup job is
// needed — each start also drops this user's stale rows.
const SESSION_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  if (!(await rateLimitOk(db, 'session', String(user.id)))) {
    return error('Too many rounds — slow down', 429)
  }

  let body: { game?: string }
  try {
    body = await readBody<{ game?: string }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }
  if (typeof body.game !== 'string' || !isKnownGame(body.game)) {
    return error('Unknown game')
  }

  await db
    .prepare('DELETE FROM play_sessions WHERE user_id = ?1 AND started_at < ?2')
    .bind(user.id, Date.now() - SESSION_MAX_AGE_MS)
    .run()

  const sessionId = crypto.randomUUID()
  const startedAt = Date.now()
  await db
    .prepare('INSERT INTO play_sessions (id, user_id, game, started_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(sessionId, user.id, body.game, startedAt)
    .run()

  return json({ sessionId, startedAt })
}
