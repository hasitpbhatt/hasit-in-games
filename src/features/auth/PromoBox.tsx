import { useState } from 'react'
import { useAuth } from '../../store/auth'

export function PromoBox() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const { applyPromoCode } = useAuth()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const points = await applyPromoCode(code.trim())
      setMessage({ kind: 'ok', text: `+${points.toLocaleString()} points added to your balance!` })
      setCode('')
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Failed to redeem code' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="promo-box" onSubmit={submit}>
      <span className="promo-icon">🎁</span>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Have a promo code? Enter it"
        maxLength={30}
      />
      <button className="btn btn-primary" disabled={busy || !code.trim()}>
        {busy ? '…' : 'Redeem'}
      </button>
      {message && <p className={`promo-msg ${message.kind}`}>{message.text}</p>}
    </form>
  )
}
