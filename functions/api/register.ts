import { hashPassword, newSessionToken } from '../_shared/auth'
import { createSession, findUserByUsername, sessionCookie, todayEarned } from '../_shared/db'
import { error, json, readBody, type Env } from '../_shared/http'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
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

  const existing = await findUserByUsername(db, username)
  if (existing) {
    return error('Username already taken', 409)
  }

  const { salt, hash } = await hashPassword(password)
  await db
    .prepare('INSERT INTO users (username, password_hash, salt) VALUES (?1, ?2, ?3)')
    .bind(username, hash, salt)
    .run()

  const user = await findUserByUsername(db, username)
  if (!user) return error('Failed to create user', 500)

  const token = newSessionToken()
  await createSession(db, user.id, token)

  const earned = await todayEarned(db, user.id)
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
    },
    201,
  )
  res.headers.append('Set-Cookie', sessionCookie(token))
  return res
}
