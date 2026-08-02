import { getUserByToken, readSessionCookie } from '../_shared/db'
import { MIN_REDEMPTION_POINTS, PAYOUT_CURRENCY } from '../_shared/economy'
import { faucetCheckUser, faucetSend } from '../_shared/faucetpay'
import { error, json, readBody, type Env } from '../_shared/http'
import { rateLimitOk } from '../_shared/rateLimit'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  const apiKey = context.env.FAUCETPAY_API_KEY
  const user = await getUserByToken(db, readSessionCookie(context.request))
  if (!user) {
    return error('Not authenticated', 401)
  }
  if (!apiKey) {
    return error('Payouts not configured yet', 503)
  }

  if (!(await rateLimitOk(db, 'redeem', String(user.id)))) {
    return error('Too many withdraw attempts — try again later', 429)
  }

  let body: { faucetpayUsername?: string }
  try {
    body = await readBody<{ faucetpayUsername?: string }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }

  const faucetpayUsername = body.faucetpayUsername?.trim()
  if (!faucetpayUsername || !USERNAME_RE.test(faucetpayUsername)) {
    return error('Enter a valid FaucetPay username (3-20 chars)')
  }

  const { currency, pointsPerUnit, minUnits, unitsPerWhole } = PAYOUT_CURRENCY
  const unitAmount = Math.floor(user.balance / pointsPerUnit)
  const pointsCost = unitAmount * pointsPerUnit

  if (unitAmount < minUnits || pointsCost < MIN_REDEMPTION_POINTS) {
    return error(
      `Not enough points — minimum redemption is ${MIN_REDEMPTION_POINTS.toLocaleString()} points (${minUnits} ${currency})`,
    )
  }

  // Verify the FaucetPay user exists before deducting anything.
  const userHash = await faucetCheckUser(apiKey, faucetpayUsername)
  if (!userHash) {
    return error('That FaucetPay username does not exist')
  }

  // Reserve the points ATOMICALLY. The WHERE guard + changes check closes the
  // double-redeem race: two concurrent requests can't both pass this.
  const reserve = await db
    .prepare('UPDATE users SET balance = balance - ?1, faucetpay_username = ?2 WHERE id = ?3 AND balance >= ?1')
    .bind(pointsCost, faucetpayUsername, user.id)
    .run()
  if (reserve.meta.changes !== 1) {
    return error(
      `Not enough points — minimum redemption is ${MIN_REDEMPTION_POINTS.toLocaleString()} points (${minUnits} ${currency})`,
    )
  }

  // Idempotency anchor: if a prior request already created a pending payout,
  // don't send real money again. Stale pending rows (crashed mid-flight) get
  // refunded and retried; fresh ones just tell the user to wait.
  const inFlight = await db
    .prepare("SELECT id, points_cost FROM payouts WHERE user_id = ?1 AND status = 'pending' LIMIT 1")
    .bind(user.id)
    .first<{ id: number; points_cost: number }>()
  if (inFlight) {
    const staleMs = 5 * 60 * 1000
    const fresh = await db
      .prepare("SELECT created_at FROM payouts WHERE id = ?1")
      .bind(inFlight.id)
      .first<{ created_at: string }>()
    const ageMs = Date.now() - new Date(fresh?.created_at ?? 0).getTime()
    if (Number.isFinite(ageMs) && ageMs < staleMs) {
      await db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(pointsCost, user.id)
      return error('A payout is already being processed — wait a moment and try again', 409)
    }
    // Stale: refund what the crashed request reserved, then proceed fresh.
    await db.batch([
      db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(inFlight.points_cost, user.id),
      db.prepare("UPDATE payouts SET status = 'failed' WHERE id = ?1").bind(inFlight.id),
    ])
  }

  // Create a pending payout row as the idempotency anchor BEFORE touching real money.
  const payoutInsert = await db
    .prepare('INSERT INTO payouts (user_id, payout_amount, points_cost, status) VALUES (?1, ?2, ?3, ?4)')
    .bind(user.id, unitAmount, pointsCost, 'pending')
    .run()
  const payoutRowId = payoutInsert.meta.last_row_id

  let sendResult
  try {
    sendResult = await faucetSend({
      apiKey,
      amount: unitAmount * unitsPerWhole,
      to: faucetpayUsername,
      currency,
    })
  } catch (e) {
    // Refund the reserved points; the payout stays 'failed' for the audit trail.
    await db.batch([
      db.prepare('UPDATE users SET balance = balance + ?1 WHERE id = ?2').bind(pointsCost, user.id),
      db.prepare("UPDATE payouts SET status = 'failed' WHERE id = ?1").bind(payoutRowId),
    ])
    return error(e instanceof Error ? e.message : 'Payout failed')
  }

  await db
    .prepare("UPDATE payouts SET status = 'paid', payout_id = ?1 WHERE id = ?2")
    .bind(sendResult.payoutId, payoutRowId)
    .run()

  return json({
    balance: user.balance - pointsCost,
    payout: {
      id: payoutRowId,
      payoutAmount: unitAmount,
      pointsCost,
      payoutId: sendResult.payoutId,
      status: 'paid',
      createdAt: new Date().toISOString(),
    },
  })
}
