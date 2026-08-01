import { useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

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
  const { submit, submitting, feedback, resetTimer } = useScoreSubmit('whack')
  const timers = useRef<number[]>([])
  const scoreRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(interval)
          finish()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

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
    setFinished(false)
    setRunning(true)
    resetTimer()
  }

  const finish = () => {
    setRunning(false)
    setActiveHoles([])
    setFinished(true)
    submit(scoreRef.current)
  }

  const whack = (hole: number) => {
    if (!running) return
    setActiveHoles((prev) => prev.filter((h) => h !== hole))
    setWhacked((prev) => [...prev, hole])
    scoreRef.current += 1
    setScore(scoreRef.current)
  }

  return (
    <div className="game-2048">
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
      <ScoreBanner feedback={feedback} />
    </div>
  )
}
