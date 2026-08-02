import { useCallback, useRef, useState } from 'react'
import { api } from './api'
import type { GameId } from './points'
import type { ScoreDetail } from './types'
import { useAuth } from '../store/auth'
import { useProgress } from '../store/progress'
import { claimSoulBonus } from './soulBonus'
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
  // Server-issued play session for this round: the server verifies playSeconds
  // against the session's wall-clock age, so a fabricated play time is rejected.
  const sessionRef = useRef<string | null>(null)
  const sessionPromiseRef = useRef<Promise<string> | null>(null)

  const startSession = useCallback(async () => {
    const res = await api.startSession(game)
    return res.sessionId
  }, [game])

  const resetTimer = useCallback(() => {
    startRef.current = Date.now()
    setFeedback(null)
    sessionRef.current = null
    // Mint the session now (round start). Swallow the rejection so an abandoned
    // round doesn't log an unhandled promise rejection; submit() re-awaits the
    // original promise and surfaces the error there.
    const p = startSession()
    p.catch(() => {})
    sessionPromiseRef.current = p
  }, [startSession])

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
    async (score: number, detail?: ScoreDetail) => {
      if (submitting) return
      setSubmitting(true)
      setFeedback(null)
      try {
        // Anchor this round to a server-issued session. Await the one started
        // at round begin, or mint one on the spot (short/odd rounds).
        let sessionId = sessionRef.current
        if (!sessionId && sessionPromiseRef.current) {
          sessionId = await sessionPromiseRef.current
        }
        if (!sessionId) {
          sessionId = await startSession()
        }
        sessionRef.current = null
        sessionPromiseRef.current = null

        const playSeconds = Math.round((Date.now() - startRef.current) / 1000)
        lastSubmitRef.current = { score, playSeconds, timestamp: Date.now() }
        const res = await api.submitScore(game, score, playSeconds, detail, sessionId)
        useAuth.getState().applyEarned(res.balance, res.todayEarned)
        // Only server-accepted runs advance the narrative progression layer
        // (achievements, titles, chambers, streak) — bot/garbage scores earn 0
        // points and never update bests.
        if (res.points > 0 || res.capped) {
          const before = useProgress.getState().soulPct
          useProgress.getState().recordAccepted(game, score, detail?.highestTile, res.points)
          // Crossing 100% for the first time triggers the one-time completion
          // bonus (idempotent server-side, so double-firing is harmless).
          if (before < 100 && useProgress.getState().soulPct >= 100) {
            void claimSoulBonus()
          }
        }
        if (res.points > 0) {
          vibrate(30)
          setFeedback({ kind: 'ok', text: `+${res.points.toLocaleString()} pts earned`, points: res.points, undoable: true })
        } else if (res.capped) {
          vibrate([40, 40, 40])
          const text =
            res.capReason === 'pot'
              ? 'The shared pot is earned out for today — your run still counts. It refills at midnight UTC.'
              : res.capReason === 'ip'
                ? "Your network's daily cap is reached — no points this round. It resets at midnight UTC."
                : 'Your daily cap is reached — no points this round. It resets at midnight UTC.'
          setFeedback({ kind: 'ok', text })
        } else {
          setFeedback({ kind: 'ok', text: 'No points this round.' })
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
    [game, submitting, startSession],
  )

  return { submit, submitting, feedback, resetTimer, undo, undoing }
}
