import { hashPassword, newSessionToken } from '../_shared/auth'
import { createSession, findUserByUsername, purgeExpiredSessions, purgeStaleGuests, sessionCookie, todayEarned } from '../_shared/db'
import { DAILY_USER_CAP } from '../_shared/economy'
import { error, json, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const GUEST_PREFIX = 'guest_'

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Auto-provision a guest account: a server-side users row with a generated
// handle (guest_<hex>) and a throwaway password hash, then issue the normal
// 30-day session cookie. The player never provides a username or password —
// the cookie is the only identity they need. last_used_at is seeded here and
// refreshed on each /api/me so stale guest rows can be reaped later.
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
  for (let attempt = 0; attempt < 4; attempt++) {
    username = `${GUEST_PREFIX}${randomHex(4)}`
    try {
      await db
        .prepare(
          "INSERT INTO users (username, password_hash, salt, balance, last_used_at) VALUES (?1, ?2, ?3, 0, datetime('now'))",
        )
        .bind(username, passwordHash.hash, passwordHash.salt)
        .run()
      break
    } catch {
      // Vanishingly rare UNIQUE collision — retry with a fresh handle.
      username = ''
    }
  }
  if (!username) {
    return error('Could not create guest account — try again', 500)
  }

  // Re-fetch the freshly created row to get its id/server timestamps instead of
  // trusting INSERT meta.last_row_id, which is unreliable across D1 versions.
  // Mirrors the pattern in /api/register.
  const user = await findUserByUsername(db, username)
  if (!user) {
    return error('Could not create guest account — try again', 500)
  }

  await createSession(db, user.id, token)

  const earned = await todayEarned(db, user.id)
  const secure = context.request.url.startsWith('https://')
  const res = json(
    {
      user: {
        id: user.id,
        username: user.username,
        faucetpayUsername: user.faucetpay_username,
        balance: user.balance,
        createdAt: user.created_at,
        lastUsedAt: user.last_used_at,
      },
      todayEarned: earned,
      todayCap: DAILY_USER_CAP,
    },
    201,
  )
  res.headers.append('Set-Cookie', sessionCookie(token, undefined, secure))
  return res
}
