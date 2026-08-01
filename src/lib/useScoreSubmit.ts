import { useCallback, useRef, useState } from 'react'
import { api } from './api'
import type { GameId } from './points'

export interface ScoreFeedback {
  kind: 'ok' | 'err'
  text: string
  points?: number
}

export function useScoreSubmit(game: GameId) {
  const startRef = useRef(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<ScoreFeedback | null>(null)

  const resetTimer = useCallback(() => {
    startRef.current = Date.now()
    setFeedback(null)
  }, [])

  const submit = useCallback(
    async (score: number) => {
      if (submitting) return
      setSubmitting(true)
      setFeedback(null)
      const playSeconds = Math.round((Date.now() - startRef.current) / 1000)
      try {
        const res = await api.submitScore(game, score, playSeconds)
        if (res.points > 0) {
          setFeedback({ kind: 'ok', text: `+${res.points.toLocaleString()} pts earned`, points: res.points })
        } else if (res.capped) {
          setFeedback({ kind: 'ok', text: 'Daily cap reached — no points this round' })
        } else {
          setFeedback({ kind: 'ok', text: 'Round too short — no points this time' })
        }
      } catch (err) {
        setFeedback({
          kind: 'err',
          text: err instanceof Error ? err.message : 'Failed to submit score',
        })
      } finally {
        setSubmitting(false)
      }
    },
    [game, submitting],
  )

  return { submit, submitting, feedback, resetTimer }
}
