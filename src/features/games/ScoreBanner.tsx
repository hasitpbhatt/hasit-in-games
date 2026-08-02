import { useEffect, useState } from 'react'
import type { ScoreFeedback } from '../../lib/useScoreSubmit'
import { UNDO_WINDOW_SECONDS } from '../../lib/useScoreSubmit'
import { ParticleBurst } from '../../components/ParticleBurst'

interface ScoreBannerProps {
  feedback: ScoreFeedback | null
  onUndo?: () => void
  undoing?: boolean
}

export function ScoreBanner({ feedback, onUndo, undoing }: ScoreBannerProps) {
  const [left, setLeft] = useState(0)

  useEffect(() => {
    if (!feedback?.undoable) return
    setLeft(UNDO_WINDOW_SECONDS)
    const id = window.setInterval(() => {
      setLeft((l) => (l > 0 ? l - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [feedback?.undoable, feedback?.text])

  if (!feedback) return null
  return (
    <>
      {feedback.kind === 'ok' && (feedback.points ?? 0) > 0 && <ParticleBurst />}
      <div className={`score-banner ${feedback.kind}`} role="status" aria-live="polite">
        {feedback.kind === 'ok' ? (
          <span aria-hidden>✦</span>
        ) : (
          <span aria-hidden>!</span>
        )}
        {feedback.text}
        {feedback.undoable && onUndo && (
          <button
            type="button"
            className="btn btn-soft undo-btn"
            onClick={onUndo}
            disabled={undoing || left <= 0}
          >
            {undoing ? 'Undoing…' : `Undo (${left}s)`}
          </button>
        )}
      </div>
    </>
  )
}
