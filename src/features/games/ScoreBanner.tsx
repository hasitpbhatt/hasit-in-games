import type { ScoreFeedback } from '../../lib/useScoreSubmit'

export function ScoreBanner({ feedback }: { feedback: ScoreFeedback | null }) {
  if (!feedback) return null
  return (
    <div className={`score-banner ${feedback.kind}`} role="status" aria-live="polite">
      {feedback.kind === 'ok' ? (
        <span aria-hidden>✦</span>
      ) : (
        <span aria-hidden>!</span>
      )}
      {feedback.text}
    </div>
  )
}
