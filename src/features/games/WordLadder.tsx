import { useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'
import { LADDER_WORDS, findLadderTarget, isWord, wordDistance } from '../../lib/dictionary'

const ROUND_SECONDS = 90
const DIST_MIN = 4
const DIST_MAX = 6

interface Puzzle {
  start: string
  target: string
}

// A random start word and a reachable target 4–6 one-letter steps away.
function nextPuzzle(): Puzzle {
  for (let tries = 0; tries < 300; tries++) {
    const start = LADDER_WORDS[Math.floor(Math.random() * LADDER_WORDS.length)]
    const target = findLadderTarget(start, DIST_MIN, DIST_MAX)
    if (target) return { start, target }
  }
  return { start: 'lamp', target: 'land' }
}

export default function WordLadder() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => nextPuzzle())
  const [current, setCurrent] = useState(puzzle.start)
  const [chain, setChain] = useState<string[]>([puzzle.start])
  const [typed, setTyped] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('wordladder')

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setRunning(false)
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

  useEffect(() => {
    if (!running || finished) return
    if (timeLeft <= 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft])

  const submitGuess = () => {
    if (!running || finished) return
    const g = typed.trim().toLowerCase()
    if (!g) return
    if (g === current) {
      setMessage({ kind: 'err', text: 'Same word — change exactly one letter.' })
      return
    }
    if (g.length !== 4 || !isWord(g)) {
      setMessage({ kind: 'err', text: 'Not a 4-letter word.' })
      return
    }
    if (wordDistance(g, current) !== 1) {
      setMessage({ kind: 'err', text: 'Change exactly one letter.' })
      return
    }
    scoreRef.current += 1
    setScore(scoreRef.current)
    setTyped('')
    if (g === puzzle.target) {
      setMessage({ kind: 'ok', text: `Ladder solved in ${chain.length + 1} words.` })
      const next = nextPuzzle()
      setPuzzle(next)
      setCurrent(next.start)
      setChain([next.start])
    } else {
      setCurrent(g)
      setChain((c) => [...c, g])
      setMessage({ kind: 'ok', text: 'Good rung.' })
    }
  }

  const skip = () => {
    if (!running || finished) return
    const next = nextPuzzle()
    setPuzzle(next)
    setCurrent(next.start)
    setChain([next.start])
    setTyped('')
    setMessage(null)
  }

  const start = () => {
    const p = nextPuzzle()
    finishedRef.current = false
    scoreRef.current = 0
    setPuzzle(p)
    setCurrent(p.start)
    setChain([p.start])
    setTyped('')
    setMessage(null)
    setScore(0)
    setTimeLeft(ROUND_SECONDS)
    setFinished(false)
    setRunning(true)
    resetTimer()
  }

  return (
    <div className="game-stage">
      <GameHud
        stats={[
          { label: 'Rungs', value: score },
          { label: 'Chain', value: chain.length },
        ]}
        timer={{ value: timeLeft, max: ROUND_SECONDS }}
        action={
          !running && !finished ? (
            <button className="btn btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            running && (
              <button className="btn btn-ghost" onClick={skip}>
                Skip ladder
              </button>
            )
          )
        }
      />

      <div className="ladder-view">
        <div className="ladder-target">
          <span>Target</span>
          <strong>{puzzle.target.toUpperCase()}</strong>
        </div>
        <div className="ladder-chain" aria-label="Ladder chain">
          {chain.slice(-6).map((w, i) => (
            <span key={`${w}-${i}`} className={`ladder-word${i === chain.length - 1 ? ' current' : ''}`}>
              {w.toUpperCase()}
            </span>
          ))}
        </div>
        <form
          className="ladder-form"
          onSubmit={(e) => {
            e.preventDefault()
            submitGuess()
          }}
        >
          <input
            className="ladder-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            placeholder="Next word (4 letters)"
            maxLength={4}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Next ladder word"
          />
          <button type="submit" className="btn btn-primary" disabled={!running || !typed.trim()}>
            Climb
          </button>
        </form>
        {message && (
          <p className={`promo-msg ${message.kind}`} role="status">
            {message.text}
          </p>
        )}
      </div>

      {finished && (
        <p className="status" role="status">
          Time! {score} rungs climbed
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
