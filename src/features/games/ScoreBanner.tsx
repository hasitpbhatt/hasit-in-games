import type { ScoreFeedback } from '../../lib/useScoreSubmit'
import { ParticleBurst } from '../../components/ParticleBurst'

export function ScoreBanner({ feedback }: { feedback: ScoreFeedback | null }) {
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
      </div>
    </>
  )
}
