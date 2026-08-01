import { useEffect, useState } from 'react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const RULES: Record<string, string> = {
  '2048': 'Slide tiles to combine matching numbers. Reach 2048 to win. Every move earns points based on your final score.',
  memory: 'Flip two cards to find matching pairs. Fewer moves means more points. The game ends when all pairs are found.',
  whack: 'Tap moles as they pop up. Faster hits earn more points. Avoid missing — each miss costs time.',
  reaction: 'Wait for the screen to change, then tap as fast as you can. Lower reaction time = more points.',
  snake: 'Guide the snake to eat food and grow longer. Longer snakes score more. Avoid hitting walls or yourself.',
  typing: 'Type the words as fast as you can. More words typed in 30 seconds = more points. Accuracy matters.',
  queens: 'Place 8 queens on the board so no two queens threaten each other. Fewer moves = more points.',
  tango: 'Fill the grid with sun and moon symbols. Each row and column must have exactly 3 of each. Markers show equality or difference.',
  pinpoint: 'Read 8 clues per round and guess the category. More correct categories in 60 seconds = more points.',
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
            {Object.entries(RULES).map(([game, rule]) => (
              <div key={game}>
                <strong style={{ fontSize: 14 }}>{game}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{rule}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'points' && (
          <div className="pinpoint-clues">
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Every game has a max points-per-play cap. Points are calculated server-side from your score and play time.
              You earn up to 2,000 points per day. 10,000 points = 1 TRX via FaucetPay.
            </p>
          </div>
        )}
        <button className="btn btn-ghost btn-block" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}