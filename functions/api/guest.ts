import { hashPassword, newSessionToken } from '../_shared/auth'
import { createSession, purgeExpiredSessions, purgeStaleGuests, sessionCookie, todayEarned } from '../_shared/db'
import { DAILY_USER_CAP } from '../_shared/economy'
import { error, json, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const GUEST_PREFIX = 'guest_'

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Auto-provision a guest account: a server-side users row with a throwaway,
// unknown password (hash of a random UUID) and a generated handle. The player
// never provides a username or password — the session cookie is the only
// identity they need. last_used_at is seeded here and refreshed on each /me so
// stale guest rows can be reaped later.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB

  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown'
  if (!(await rateLimitOk(db, 'auth', ip))) {
    return error('Too many attempts — try again later', 429)
  }

  const passwordHash = await hashPassword(crypto.randomUUID())
  await purgeExpiredSessions(db)
  await purgeStaleGuests(db)

  const token = newSessionToken()
  let username = ''
  let userId: number | null = null
  for (let attempt = 0; attempt < 4 && userId == null; attempt++) {
    username = `${GUEST_PREFIX}${randomHex(4)}`
    try {
      const res = await db
        .prepare(
          "INSERT INTO users (username, password_hash, salt, balance, last_used_at) VALUES (?1, ?2, ?3, 0, datetime('now'))",
        )
        .bind(username, passwordHash.hash, passwordHash.salt)
        .run()
      userId = Number(res.meta.last_row_id)
    } catch {
      // Vanishingly rare UNIQUE collision — retry with a fresh handle.
    }
  }
  if (userId == null) {
    return error('Could not create guest account — try again', 500)
  }

  await createSession(db, userId, token)

  const earned = await todayEarned(db, userId)
  const secure = context.request.url.startsWith('https://')
  const res = json(
    {
      user: {
        id: userId,
        username,
        faucetpayUsername: null,
        balance: 0,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      },
      todayEarned: earned,
      todayCap: DAILY_USER_CAP,
    },
    201,
  )
  res.headers.append('Set-Cookie', sessionCookie(token, undefined, secure))
  return res
}
