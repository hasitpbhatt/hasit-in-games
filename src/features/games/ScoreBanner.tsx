import type { ScoreFeedback } from '../../lib/useScoreSubmit'
import { ParticleBurst } from '../../components/ParticleBurst'

interface ScoreBannerProps {
  feedback: ScoreFeedback | null
  onUndo?: () => void
  undoing?: boolean
}

export function ScoreBanner({ feedback, onUndo, undoing }: ScoreBannerProps) {
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
            className="btn btn-soft"
            style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 10px' }}
            onClick={onUndo}
            disabled={undoing}
          >
            {undoing ? 'Undoing…' : 'Undo'}
          </button>
        )}
      </div>
    </>
  )
}
