import { getUserByToken, readSessionCookie, todayEarned } from '../_shared/db'
import { DAILY_USER_CAP } from '../_shared/economy'
import { error, json, type Env } from '../_shared/http'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  const earned = await todayEarned(db, user.id)
  return json({
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
}
