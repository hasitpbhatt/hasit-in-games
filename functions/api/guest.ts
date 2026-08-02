import { newSessionToken } from '../_shared/auth'
import { createSession, findUserByUsername, purgeExpiredSessions, purgeStaleGuests, sessionCookie, todayEarned } from '../_shared/db'
import { DAILY_USER_CAP } from '../_shared/economy'
import { error, json, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const GUEST_PREFIX = 'guest_'

// Guests have no password. We store a sentinel hash so the NOT NULL column is
// satisfied without ever running PBKDF2 (which is never called for guests —
// there is no login flow). kdf_iterations is pinned to the Workers-supported
// 100,000 ceiling so a hypothetical future verifyPassword can't hit the runtime
// PBKDF2 cap. (The account-auth endpoints in auth.ts still default to 600k and
// will throw on this runtime if ever re-enabled — see note in AGENTS.md.)
const GUEST_PASSWORD_HASH = 'disabled'
const GUEST_KDF_ITERATIONS = 100_000

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Auto-provision a guest account: a server-side users row with a generated
// handle (guest_<hex>) and no password, then issue the normal 30-day session
// cookie. The player never provides a username or password — the cookie is the
// only identity they need. last_used_at is seeded here and refreshed on each
// /api/me so stale guest rows can be reaped later.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB

  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown'
  if (!(await rateLimitOk(db, 'auth', ip))) {
    return error('Too many attempts — try again later', 429)
  }

  await purgeExpiredSessions(db)
  await purgeStaleGuests(db)

  const token = newSessionToken()
  const salt = randomHex(16)
  let username = ''
  for (let attempt = 0; attempt < 4; attempt++) {
    username = `${GUEST_PREFIX}${randomHex(4)}`
    try {
      await db
        .prepare(
          'INSERT INTO users (username, password_hash, salt, balance, kdf_iterations, last_used_at) VALUES (?1, ?, ?, 0, ?, datetime(\'now\'))',
        )
        .bind(username, GUEST_PASSWORD_HASH, salt, GUEST_KDF_ITERATIONS)
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

  // Re-fetch the freshly created row for its id/server timestamps instead of
  // trusting INSERT meta.last_row_id (unreliable across D1 versions). Mirrors
  // the pattern in /api/register.
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
