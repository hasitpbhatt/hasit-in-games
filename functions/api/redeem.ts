import { getUserByToken, readSessionCookie } from '../_shared/db'
import { MIN_REDEMPTION_POINTS, POINTS_PER_TRX, SUNS_PER_TRX } from '../_shared/economy'
import { faucetCheckUser, faucetSend } from '../_shared/faucetpay'
import { error, json, readBody, type Env } from '../_shared/http'

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

  if (user.balance < MIN_REDEMPTION_POINTS) {
    return error('Not enough points — minimum redemption is 10,000 points (1 TRX)')
  }

  // Verify the FaucetPay user exists before deducting anything.
  const userHash = await faucetCheckUser(apiKey, faucetpayUsername)
  if (!userHash) {
    return error('That FaucetPay username does not exist')
  }

  const trxAmount = Math.floor(user.balance / POINTS_PER_TRX)
  const pointsCost = trxAmount * POINTS_PER_TRX
  const amountSuns = trxAmount * SUNS_PER_TRX

  let sendResult
  try {
    sendResult = await faucetSend(apiKey, amountSuns, faucetpayUsername)
  } catch (e) {
    return error(e instanceof Error ? e.message : 'Payout failed')
  }

  await db.batch([
    db
      .prepare('UPDATE users SET balance = balance - ?1, faucetpay_username = ?2 WHERE id = ?3')
      .bind(pointsCost, faucetpayUsername, user.id),
    db
      .prepare(
        'INSERT INTO payouts (user_id, trx_amount, points_cost, payout_id, status) VALUES (?1, ?2, ?3, ?4, ?5)',
      )
      .bind(user.id, trxAmount, pointsCost, sendResult.payoutId, 'paid'),
  ])

  return json({
    payout: {
      id: 0,
      trxAmount,
      pointsCost,
      payoutId: sendResult.payoutId,
      status: 'paid',
      createdAt: new Date().toISOString(),
    },
  })
}
