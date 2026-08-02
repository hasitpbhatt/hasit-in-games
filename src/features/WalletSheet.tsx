import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { MIN_REDEMPTION_POINTS, PAYOUT_CURRENCY } from '../lib/points'
import { useAuth } from '../store/auth'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState } from '../components/EmptyState'
import { PromoBox } from './auth/PromoBox'

export function WalletSheet() {
  const { user, todayEarned, todayCap, loadPayouts, payouts, applyPromoCode, applyEarned } = useAuth()
  const [faucet, setFaucet] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    loadPayouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) return null

  const { symbol } = PAYOUT_CURRENCY
  const eligible = user.balance >= MIN_REDEMPTION_POINTS
  const payoutUnits = Math.floor(user.balance / PAYOUT_CURRENCY.pointsPerUnit)
  const capPct = todayCap > 0 ? Math.min(100, Math.round((todayEarned / todayCap) * 100)) : 0
  const pointsToGo = MIN_REDEMPTION_POINTS - user.balance

  const doRedeem = async () => {
    setConfirming(false)
    setBusy(true)
    setMessage(null)
    try {
      const res = await api.redeem(faucet.trim())
      applyEarned(res.balance, todayEarned)
      setMessage({ kind: 'ok', text: `Payout sent! ${res.payout.payoutAmount} ${symbol} on its way to your FaucetPay.` })
      setFaucet('')
      loadPayouts()
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Payout failed' })
    } finally {
      setBusy(false)
    }
  }

  const redeem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!eligible) return
    setConfirming(true)
  }

  const redeemPromo = async (code: string) => {
    return applyPromoCode(code)
  }

  return (
    <>
      <div className="sheet-heading">
        <h2>Wallet</h2>
        <p>Your points, daily progress, and {symbol} redemptions.</p>
      </div>

      <div className="wallet-hero">
        <div>
          <div className="wallet-pts">{user.balance.toLocaleString()}</div>
          <div className="pts-label">
            points · {payoutUnits} {symbol} ready to withdraw
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
          <h3>Withdraw {symbol}</h3>
          <span className="chip">{MIN_REDEMPTION_POINTS.toLocaleString()} pts = 1 {symbol}</span>
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
                ? `Withdraw ${payoutUnits} ${symbol} (${(payoutUnits * PAYOUT_CURRENCY.pointsPerUnit).toLocaleString()} pts)`
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

      <div>
        <p className="section-label" style={{ margin: '0 0 8px' }}>
          Payout history
        </p>
        {payouts.length > 0 ? (
          payouts.slice(0, 5).map((p) => (
            <div className="payout-row" key={p.id}>
              <span>
                {p.payoutAmount} {symbol} · {p.pointsCost.toLocaleString()} pts
              </span>
              <span className={`payout-status ${p.status}`}>{p.status}</span>
            </div>
          ))
        ) : (
          <EmptyState emoji="📭" title="No payouts yet" subtitle="Once you redeem, your payout history will appear here." />
        )}
      </div>

      <ConfirmModal
        open={confirming}
        title={`Withdraw ${payoutUnits} ${symbol}?`}
        message={`${payoutUnits} ${symbol} (${(payoutUnits * PAYOUT_CURRENCY.pointsPerUnit).toLocaleString()} pts) will be sent to ${faucet.trim()}. This cannot be undone.`}
        confirmLabel="Withdraw"
        onConfirm={doRedeem}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
