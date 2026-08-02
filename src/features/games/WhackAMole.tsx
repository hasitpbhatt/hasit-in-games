import { useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'
import { vibrate } from '../../lib/haptics'

const ROUND_SECONDS = 30
const SPAWN_MIN = 650
const SPAWN_MAX = 1400
const HOLE_COUNT = 9

export default function WhackAMole() {
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [activeHoles, setActiveHoles] = useState<number[]>([])
  const [whacked, setWhacked] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('whack')
  const timers = useRef<number[]>([])
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const whackedRef = useRef<Set<number>>(new Set())

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setRunning(false)
    setActiveHoles([])
    setFinished(true)
    submit(scoreRef.current)
  }

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [running])

  // finish() is called from a plain effect, NOT inside a setState updater, so
  // StrictMode's double-invocation can't double-submit.
  useEffect(() => {
    if (!running || finished) return
    if (timeLeft <= 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft])

  useEffect(() => {
    if (!running) return
    const schedule = () => {
      const id = window.setTimeout(() => {
        setActiveHoles((prev) => {
          const next = [...prev]
          const free = Array.from({ length: HOLE_COUNT }, (_, i) => i).filter((h) => !next.includes(h))
          if (free.length) {
            next.push(free[Math.floor(Math.random() * free.length)])
          }
          return next
        })
        const hideTimer = window.setTimeout(() => {
          setActiveHoles((prev) => prev.slice(1))
        }, 900)
        timers.current.push(hideTimer)
        schedule()
      }, SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN))
      timers.current.push(id)
    }
    schedule()
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
  }, [running])

  const start = () => {
    setTimeLeft(ROUND_SECONDS)
    setActiveHoles([])
    setWhacked([])
    setScore(0)
    scoreRef.current = 0
    finishedRef.current = false
    whackedRef.current = new Set()
    setFinished(false)
    setRunning(true)
    resetTimer()
  }

  const whack = (hole: number) => {
    if (!running) return
    // Guard against double-tap in the same frame: the mole stays mounted until
    // the re-render removes it, so a second click would double-count.
    if (whackedRef.current.has(hole)) return
    whackedRef.current.add(hole)
    setActiveHoles((prev) => prev.filter((h) => h !== hole))
    setWhacked((prev) => [...prev, hole])
    scoreRef.current += 1
    setScore(scoreRef.current)
    vibrate(20)
  }

  return (
    <div className="game-stage">
      <GameHud
        stats={[{ label: 'Whacked', value: score }]}
        timer={{ value: timeLeft, max: ROUND_SECONDS }}
        action={
          !running && !finished ? (
            <button className="btn btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            finished && (
              <button className="btn btn-ghost" onClick={start}>
                Play again
              </button>
            )
          )
        }
      />

      <div className="whack-grid" aria-label="Whack-a-mole board">
        {Array.from({ length: HOLE_COUNT }, (_, i) => (
          <div key={i} className="whack-hole">
            {activeHoles.includes(i) && (
              <button
                type="button"
                className={`whack-mole${whacked.includes(i) ? ' whacked' : ''}`}
                onClick={() => whack(i)}
                aria-label="Whack the mole"
              >
                🦫
              </button>
            )}
          </div>
        ))}
      </div>

      {finished && (
        <p className="status" role="status">
          Round over — {score} moles whacked
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
