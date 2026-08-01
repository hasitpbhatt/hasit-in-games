import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { MIN_REDEMPTION_POINTS } from '../lib/points'
import { useAuth } from '../store/auth'
import { PromoBox } from './auth/PromoBox'

export function WalletSheet() {
  const { user, todayEarned, todayCap, loadPayouts, payouts, applyPromoCode } = useAuth()
  const [faucet, setFaucet] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    loadPayouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) return null

  const eligible = user.balance >= MIN_REDEMPTION_POINTS
  const trx = Math.floor(user.balance / MIN_REDEMPTION_POINTS)
  const capPct = todayCap > 0 ? Math.min(100, Math.round((todayEarned / todayCap) * 100)) : 0
  const pointsToGo = MIN_REDEMPTION_POINTS - user.balance

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const res = await api.redeem(faucet.trim())
      setMessage({ kind: 'ok', text: `Payout sent! ${res.payout.trxAmount} TRX on its way to your FaucetPay.` })
      setFaucet('')
      loadPayouts()
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Payout failed' })
    } finally {
      setBusy(false)
    }
  }

  const redeemPromo = async (code: string) => {
    return applyPromoCode(code)
  }

  return (
    <>
      <div className="sheet-heading">
        <h2>Wallet</h2>
        <p>Your points, daily progress, and TRX redemptions.</p>
      </div>

      <div className="wallet-hero">
        <div>
          <div className="wallet-pts">{user.balance.toLocaleString()}</div>
          <div className="pts-label">
            points · ≈ {trx} TRX ready to withdraw
          </div>
        </div>
        <div className="wallet-progress-block">
          <div className="progress" aria-label={`Daily cap ${capPct}% used`}>
            <span style={{ width: `${capPct}%` }} />
          </div>
          <div className="pts-label">
            today {todayEarned.toLocaleString()} / {todayCap.toLocaleString()} pts cap
          </div>
        </div>
      </div>

      <div className="redeem-form">
        <div className="redeem-form-head">
          <h3>Withdraw TRX</h3>
          <span className="chip">{MIN_REDEMPTION_POINTS.toLocaleString()} pts = 1 TRX</span>
        </div>
        <form onSubmit={redeem}>
          <label className="auth-field">
            FaucetPay username
            <input
              value={faucet}
              onChange={(e) => setFaucet(e.target.value)}
              placeholder="your faucetpay username"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]{3,20}"
              required
              disabled={busy || !eligible}
            />
          </label>
          <button className="btn btn-primary btn-lg btn-block" disabled={!eligible || busy}>
            {busy
              ? 'Sending…'
              : eligible
                ? `Withdraw ${trx} TRX (${(trx * MIN_REDEMPTION_POINTS).toLocaleString()} pts)`
                : `Need ${pointsToGo.toLocaleString()} more pts`}
          </button>
        </form>
        {!eligible && (
          <p className="redeem-note">
            You need {MIN_REDEMPTION_POINTS.toLocaleString()} points to withdraw. Keep playing to build your balance.
          </p>
        )}
        {message && (
          <p className={`promo-msg ${message.kind}`} role="status">
            {message.text}
          </p>
        )}
      </div>

      <PromoBox onApply={redeemPromo} />

      {payouts.length > 0 && (
        <div>
          <p className="section-label" style={{ margin: '0 0 8px' }}>
            Payout history
          </p>
          {payouts.slice(0, 5).map((p) => (
            <div className="payout-row" key={p.id}>
              <span>
                {p.trxAmount} TRX · {p.pointsCost.toLocaleString()} pts
              </span>
              <span className={`payout-status ${p.status}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
