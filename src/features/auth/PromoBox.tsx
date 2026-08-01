import { useState } from 'react'
import { useAuth } from '../../store/auth'

interface PromoBoxProps {
  onApply?: (code: string) => Promise<number>
}

export function PromoBox({ onApply }: PromoBoxProps) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const { applyPromoCode } = useAuth()

  const apply = onApply ?? applyPromoCode

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const points = await apply(code.trim())
      setMessage({ kind: 'ok', text: `+${points.toLocaleString()} points added to your balance!` })
      setCode('')
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Failed to redeem code' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="promo-block">
      <div className="redeem-form-head">
        <h3>Promo code</h3>
      </div>
      <form className="promo-box" onSubmit={submit} style={{ maxWidth: '100%', margin: 0 }}>
        <span className="promo-icon" aria-hidden>
          🎁
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter a promo code"
          maxLength={30}
          aria-label="Promo code"
        />
        <button className="btn btn-primary" disabled={busy || !code.trim()}>
          {busy ? '…' : 'Redeem'}
        </button>
        {message && (
          <p className={`promo-msg ${message.kind}`} role="status">
            {message.text}
          </p>
        )}
      </form>
    </div>
  )
}
