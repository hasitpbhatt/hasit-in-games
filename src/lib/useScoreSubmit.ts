import { useCallback, useRef, useState } from 'react'
import { api } from './api'
import type { GameId } from './points'
import { useAuth } from '../store/auth'
import { vibrate } from './haptics'

export interface ScoreFeedback {
  kind: 'ok' | 'err'
  text: string
  points?: number
  undoable?: boolean
}

const UNDO_WINDOW_MS = 5000
export const UNDO_WINDOW_SECONDS = Math.round(UNDO_WINDOW_MS / 1000)

export function useScoreSubmit(game: GameId) {
  const startRef = useRef(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const [feedback, setFeedback] = useState<ScoreFeedback | null>(null)
  const lastSubmitRef = useRef<{ score: number; playSeconds: number; timestamp: number } | null>(null)

  const resetTimer = useCallback(() => {
    startRef.current = Date.now()
    setFeedback(null)
  }, [])

  const undo = useCallback(async () => {
    const last = lastSubmitRef.current
    if (!last || Date.now() - last.timestamp > UNDO_WINDOW_MS) return false
    if (undoing) return false
    setUndoing(true)
    try {
      const res = await api.undoScore()
      lastSubmitRef.current = null
      vibrate(20)
      setFeedback(null)
      useAuth.getState().applyEarned(res.balance, res.todayEarned)
      return true
    } catch (err) {
      lastSubmitRef.current = null
      setFeedback({
        kind: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Could not undo the submission — it may already be too late.',
      })
      return false
    } finally {
      setUndoing(false)
    }
  }, [undoing])

  const submit = useCallback(
    async (score: number) => {
      if (submitting) return
      setSubmitting(true)
      setFeedback(null)
      const playSeconds = Math.round((Date.now() - startRef.current) / 1000)
      lastSubmitRef.current = { score, playSeconds, timestamp: Date.now() }
      try {
        const res = await api.submitScore(game, score, playSeconds)
        useAuth.getState().applyEarned(res.balance, res.todayEarned)
        if (res.points > 0) {
          vibrate(30)
          setFeedback({ kind: 'ok', text: `+${res.points.toLocaleString()} pts earned`, points: res.points, undoable: true })
        } else if (res.capped) {
          vibrate([40, 40, 40])
          setFeedback({ kind: 'ok', text: 'Daily cap reached — no points this round. Cap resets tomorrow.' })
        } else {
          setFeedback({ kind: 'ok', text: 'Round too short — play at least 5 seconds to earn points.' })
        }
      } catch (err) {
        lastSubmitRef.current = null
        vibrate([60, 40, 60])
        setFeedback({
          kind: 'err',
          text:
            err instanceof Error
              ? err.message
              : 'Failed to submit score — check your connection and try again',
        })
      } finally {
        setSubmitting(false)
      }
    },
    [game, submitting],
  )

  return { submit, submitting, feedback, resetTimer, undo, undoing }
}
