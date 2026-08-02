import { hashPassword, newSessionToken } from '../_shared/auth'
import { createSession, findUserByUsername, sessionCookie, todayEarned } from '../_shared/db'
import { DAILY_USER_CAP } from '../_shared/economy'
import { error, json, readBody, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/
const HASH_ITERATIONS = 600_000

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB

  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown'
  if (!(await rateLimitOk(db, 'auth', ip))) {
    return error('Too many attempts — try again later', 429)
  }

  let body: { username?: string; password?: string }
  try {
    body = await readBody<{ username?: string; password?: string }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }

  const username = body.username?.trim()
  const password = body.password ?? ''

  if (!username || !USERNAME_RE.test(username)) {
    return error('Username must be 3-20 chars (letters, numbers, underscore)')
  }
  if (password.length < 6) {
    return error('Password must be at least 6 characters')
  }

  const { salt, hash } = await hashPassword(password, undefined, HASH_ITERATIONS)
  try {
    await db
      .prepare('INSERT INTO users (username, password_hash, salt, kdf_iterations) VALUES (?1, ?2, ?3, ?4)')
      .bind(username, hash, salt, HASH_ITERATIONS)
      .run()
  } catch {
    // Duplicate username (or any constraint failure) — keep the message generic
    // so account names aren't enumerable, and cover the INSERT race.
    return error('Registration failed — try again', 409)
  }

  const user = await findUserByUsername(db, username)
  if (!user) return error('Failed to create user', 500)

  const token = newSessionToken()
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
      },
      todayEarned: earned,
      todayCap: DAILY_USER_CAP,
    },
    201,
  )
  res.headers.append('Set-Cookie', sessionCookie(token, undefined, secure))
  return res
}
