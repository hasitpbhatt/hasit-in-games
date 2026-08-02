import { newSessionToken, verifyPassword } from '../_shared/auth'
import {
  createSession,
  findUserByUsername,
  purgeExpiredSessions,
  sessionCookie,
  todayEarned,
} from '../_shared/db'
import { DAILY_USER_CAP } from '../_shared/economy'
import { error, json, readBody, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

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

  const user = username ? await findUserByUsername(db, username) : null
  if (!user) {
    return error('Invalid username or password', 401)
  }

  const ok = await verifyPassword(password, user.salt, user.password_hash, user.kdf_iterations)
  if (!ok) {
    return error('Invalid username or password', 401)
  }

  const token = newSessionToken()
  await purgeExpiredSessions(db)
  await createSession(db, user.id, token)

  const earned = await todayEarned(db, user.id)
  const secure = context.request.url.startsWith('https://')
  const res = json({
    user: {
      id: user.id,
      username: user.username,
      faucetpayUsername: user.faucetpay_username,
      balance: user.balance,
      createdAt: user.created_at,
    },
    todayEarned: earned,
    todayCap: DAILY_USER_CAP,
  })
  res.headers.append('Set-Cookie', sessionCookie(token, undefined, secure))
  return res
}
