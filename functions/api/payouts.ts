import { getUserByToken, readSessionCookie } from '../_shared/db'
import { error, json, type Env } from '../_shared/http'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }

  const rows = await db
    .prepare('SELECT id, trx_amount, points_cost, payout_id, status, created_at FROM payouts WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 50')
    .bind(user.id)
    .all<{ id: number; trx_amount: number; points_cost: number; payout_id: string | null; status: string; created_at: string }>()

  const payouts = rows.results.map((r) => ({
    id: r.id,
    trxAmount: r.trx_amount,
    pointsCost: r.points_cost,
    payoutId: r.payout_id,
    status: r.status,
    createdAt: r.created_at,
  }))

  return json({ payouts })
}
