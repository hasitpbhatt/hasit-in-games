import { useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const TRIALS = 5
const WAIT_MIN = 1500
const WAIT_MAX = 4000

type Phase = 'idle' | 'waiting' | 'ready' | 'too-soon' | 'done'

export default function ReactionTime() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [trial, setTrial] = useState(0)
  const [results, setResults] = useState<number[]>([])
  const [average, setAverage] = useState(0)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('reaction')
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const beginTrial = () => {
    setPhase('waiting')
    const delay = WAIT_MIN + Math.random() * (WAIT_MAX - WAIT_MIN)
    timerRef.current = window.setTimeout(() => {
      setPhase('ready')
      startedAtRef.current = performance.now()
    }, delay)
  }

  const start = () => {
    clearTimer()
    setTrial(0)
    setResults([])
    setAverage(0)
    resetTimer()
    beginTrial()
  }

  const handleStageClick = () => {
    if (phase === 'idle' || phase === 'done') {
      start()
      return
    }
    if (phase === 'waiting' || phase === 'too-soon') {
      clearTimer()
      setPhase('too-soon')
      return
    }
    if (phase === 'ready') {
      const ms = performance.now() - startedAtRef.current
      const nextResults = [...results, Math.round(ms)]
      const nextTrial = trial + 1
      setResults(nextResults)
      if (nextTrial >= TRIALS) {
        const avg = Math.round(nextResults.reduce((a, b) => a + b, 0) / nextResults.length)
        setAverage(avg)
        setTrial(nextTrial)
        setPhase('done')
        submit(avg)
      } else {
        setTrial(nextTrial)
        beginTrial()
      }
    }
  }

  const phaseLabel = (): { text: string; cls: string } => {
    switch (phase) {
      case 'idle':
        return { text: 'Tap anywhere to start', cls: 'idle' }
      case 'waiting':
        return { text: 'Wait for green…', cls: 'waiting' }
      case 'ready':
        return { text: 'TAP!', cls: 'ready' }
      case 'too-soon':
        return { text: 'Too soon — tap to try again', cls: 'idle' }
      case 'done':
        return { text: `${average} ms average`, cls: 'idle' }
    }
  }

  const label = phaseLabel()

  return (
    <div className="game-stage">
      <GameHud
        stats={[{ label: 'Trial', value: `${Math.min(trial + (phase === 'done' ? 0 : 1), TRIALS)}/${TRIALS}` }]}
      />

      {results.length > 0 && (
        <div className="reaction-results" aria-label="Reaction results">
          {results.map((r, i) => (
            <span key={i} className="chip">
              {r}ms
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        className={`reaction-stage ${label.cls}`}
        onClick={handleStageClick}
        disabled={submitting}
        aria-label="Reaction test stage"
      >
        {label.text}
      </button>

      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
