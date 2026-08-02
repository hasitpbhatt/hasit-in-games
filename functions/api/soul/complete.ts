import { getUserByToken, readSessionCookie, todayEarned } from '../../_shared/db'
import { error, json, type Env } from '../../_shared/http'
import { rateLimitOk } from '../../_shared/rateLimit'
import { SOUL_COMPLETION_BONUS, soulProgress } from '../../_shared/soul'

// One-time reward for fully restoring the arcade soul (all cabinets healed +
// all achievements). Awarded at most once per account, verified server-side from
// the accepted score history — the client only triggers the claim.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }
  if (!(await rateLimitOk(db, 'soul', String(user.id)))) {
    return error('Too many requests — slow down', 429)
  }

  const progress = await soulProgress(db, user.id)
  const today = await todayEarned(db, user.id)
  if (!progress.complete) {
    return json({ awarded: false, balance: user.balance, todayEarned: today })
  }

  // Grant the bonus atomically with the reward marker: the UNIQUE(user_id,
  // reward) primary key means exactly one request ever wins the insert, so a
  // replay can't double-credit even under concurrent claims.
  try {
    await db.batch([
      db
        .prepare('INSERT INTO user_rewards (user_id, reward) VALUES (?1, ?2)')
        .bind(user.id, 'soul_completion'),
      db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(SOUL_COMPLETION_BONUS, user.id),
    ])
  } catch {
    // Another request granted it in the meantime — not awarded again.
    return json({ awarded: false, balance: user.balance, todayEarned: today })
  }

  return json({
    awarded: true,
    amount: SOUL_COMPLETION_BONUS,
    balance: user.balance + SOUL_COMPLETION_BONUS,
    todayEarned: today,
  })
}
