import { useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'
import { vibrate } from '../../lib/haptics'

const SIZE = 5
const N = SIZE * SIZE

// Tapping a tile flips it and its orthogonal neighbours.
function neighbors(i: number): number[] {
  const out = [i]
  const r = Math.floor(i / SIZE)
  const c = i % SIZE
  if (r > 0) out.push(i - SIZE)
  if (r < SIZE - 1) out.push(i + SIZE)
  if (c > 0) out.push(i - 1)
  if (c < SIZE - 1) out.push(i + 1)
  return out
}

interface Board {
  lights: boolean[]
  par: number
}

// A random board whose UNIQUE solution is an 8–11 press set. The 5×5 Lights Out
// matrix is non-singular over GF(2), so every board is solvable and the press
// set that made it is the minimum — par = that set's size.
function generateBoard(): Board {
  const presses = new Set<number>()
  const moves = 8 + Math.floor(Math.random() * 4) // 8..11
  while (presses.size < moves) presses.add(Math.floor(Math.random() * N))
  const lights = Array<boolean>(N).fill(false)
  for (const p of presses) {
    for (const n of neighbors(p)) lights[n] = !lights[n]
  }
  return { lights, par: presses.size }
}

export default function Panel() {
  const [board, setBoard] = useState<Board>(() => generateBoard())
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [solved, setSolved] = useState(false)
  const startRef = useRef(0)
  const movesRef = useRef(0)
  const solvedRef = useRef(false)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('panel')

  const finish = (seconds: number) => {
    if (solvedRef.current) return
    solvedRef.current = true
    setRunning(false)
    setSolved(true)
    submit(Math.max(1, seconds))
  }

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  const toggle = (i: number) => {
    if (!running || solved) return
    const next = [...board.lights]
    for (const n of neighbors(i)) next[n] = !next[n]
    setBoard({ ...board, lights: next })
    movesRef.current += 1
    setMoves(movesRef.current)
    if (next.every((l) => !l)) {
      vibrate([40, 40, 60])
      finish(Math.round((Date.now() - startRef.current) / 1000))
    } else {
      vibrate(15)
    }
  }

  const giveUp = () => {
    if (!running || solved) return
    finish(Math.max(1, Math.round((Date.now() - startRef.current) / 1000)))
  }

  const start = () => {
    solvedRef.current = false
    movesRef.current = 0
    setBoard(generateBoard())
    setMoves(0)
    setElapsed(0)
    setSolved(false)
    setRunning(true)
    startRef.current = Date.now()
    resetTimer()
  }

  return (
    <div className="game-stage">
      <GameHud
        stats={[
          { label: 'Moves', value: moves },
          { label: 'Par', value: board.par },
        ]}
        timer={{ value: elapsed, max: 120 }}
        action={
          !running && !solved ? (
            <button className="btn btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            running && (
              <button className="btn btn-ghost" onClick={giveUp}>
                Give up
              </button>
            )
          )
        }
      />

      <div className="panel-grid" aria-label="Lights Out panel">
        {board.lights.map((on, i) => (
          <button
            key={i}
            type="button"
            className={`panel-tile${on ? ' on' : ''}`}
            onClick={() => toggle(i)}
            disabled={!running || solved}
            aria-label={on ? 'Light on' : 'Light off'}
          >
            {on ? '✦' : ''}
          </button>
        ))}
      </div>

      {solved && (
        <p className="status" role="status">
          Panel dark in {moves} moves ({board.par} was par)
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
