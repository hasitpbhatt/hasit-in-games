import { getUserByToken, readSessionCookie } from '../_shared/db'
import { error, json, readBody, type Env } from '../_shared/http'

const CODE_RE = /^[A-Za-z0-9]{3,30}$/

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  let body: { code?: string }
  try {
    body = await readBody<{ code?: string }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }

  const code = body.code?.trim().toUpperCase() ?? ''
  if (!CODE_RE.test(code)) {
    return error('Enter a valid promo code (3-30 letters/numbers)')
  }

  const promo = await db
    .prepare('SELECT * FROM promo_codes WHERE code = ?1 AND active = 1')
    .bind(code)
    .first<{ code: string; points: number; max_uses: number; used_count: number }>()
  if (!promo) {
    return error('Invalid promo code')
  }
  if (promo.used_count >= promo.max_uses) {
    return error('This promo code is fully used')
  }

  // Already redeemed by this user?
  const existing = await db
    .prepare('SELECT id FROM code_redemptions WHERE code = ?1 AND user_id = ?2')
    .bind(code, user.id)
    .first()
  if (existing) {
    return error('You have already redeemed this code')
  }

  // Atomically increment used_count only if capacity remains.
  const bump = await db
    .prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?1 AND used_count < max_uses AND active = 1')
    .bind(code)
    .run()
  if (bump.meta.changes !== 1) {
    return error('This promo code is fully used')
  }

  try {
    await db
      .prepare('INSERT INTO code_redemptions (code, user_id) VALUES (?1, ?2)')
      .bind(code, user.id)
      .run()
  } catch {
    // Already redeemed (UNIQUE constraint) — undo the bump so the use isn't burned.
    await db
      .prepare('UPDATE promo_codes SET used_count = MAX(0, used_count - 1) WHERE code = ?1')
      .bind(code)
      .run()
    return error('You have already redeemed this code', 409)
  }

  await db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(promo.points, user.id).run()

  const newBalance = user.balance + promo.points
  return json({ points: promo.points, balance: newBalance })
}
