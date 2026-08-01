import { newSessionToken, verifyPassword } from '../_shared/auth'
import { createSession, findUserByUsername, sessionCookie, todayEarned } from '../_shared/db'
import { error, json, readBody, type Env } from '../_shared/http'

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

  const user = username ? await findUserByUsername(db, username) : null
  if (!user) {
    return error('Invalid username or password', 401)
  }

  const ok = await verifyPassword(password, user.salt, user.password_hash)
  if (!ok) {
    return error('Invalid username or password', 401)
  }

  const token = newSessionToken()
  await createSession(db, user.id, token)

  const earned = await todayEarned(db, user.id)
  const res = json({
    user: {
      id: user.id,
      username: user.username,
      faucetpayUsername: user.faucetpay_username,
      balance: user.balance,
      createdAt: user.created_at,
    },
    todayEarned: earned,
  })
  res.headers.append('Set-Cookie', sessionCookie(token))
  return res
}
