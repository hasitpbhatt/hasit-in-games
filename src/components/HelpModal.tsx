import { useEffect, useState } from 'react'
import { GAMES } from '../lib/points'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [tab, setTab] = useState('rules')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label="Help" onClick={(e) => e.stopPropagation()}>
        <h2>How to Play</h2>
        <div className="modal-actions" style={{ gap: 6 }}>
          <button className="btn btn-soft" onClick={() => setTab('rules')}>Rules</button>
          <button className="btn btn-soft" onClick={() => setTab('points')}>Points</button>
        </div>
        {tab === 'rules' && (
          <div className="pinpoint-clues">
            {GAMES.map((g) => (
              <div key={g.id}>
                <strong style={{ fontSize: 14 }}>{g.name}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{g.rules}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'points' && (
          <div className="pinpoint-clues">
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Points are awarded on a skill tier: the higher your achievement, the more you earn.
              For example, 2048 pays a full 500 pts only if you reach the 2048 tile — random moves
              pay little. Every score is validated server-side, and each play needs at least 5
              seconds. You earn up to 2,000 points per day. 1,000 points = 1 PEPE via FaucetPay.
              We call points skill credits in the story — the ledger is still points; only
              redemption converts them to PEPE.
            </p>
          </div>
        )}
        <button className="btn btn-ghost btn-block" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}