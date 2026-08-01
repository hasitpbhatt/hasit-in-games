import { useEffect, useMemo, useRef, useState } from 'react'
import { GameHud } from '../../components/GameHud'
import { ScoreBanner } from './ScoreBanner'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const N = 8
const COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#22d3ee', '#a3e635']

interface QueensBoard {
  colors: number[][]
  solution: number[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQueensSolution(): number[] {
  const solve = (): number[] | null => {
    const perm: number[] = []
    const used = new Set<number>()
    const backtrack = (row: number): boolean => {
      if (row === N) return true
      for (const c of shuffle(Array.from({ length: N }, (_, i) => i).filter((i) => !used.has(i)))) {
        let safe = true
        for (let r = 0; r < row; r++) {
          if (Math.abs(row - r) === Math.abs(c - perm[r])) {
            safe = false
            break
          }
        }
        if (!safe) continue
        perm.push(c)
        used.add(c)
        if (backtrack(row + 1)) return true
        perm.pop()
        used.delete(c)
      }
      return false
    }
    return backtrack(0) ? perm : null
  }
  for (let attempt = 0; attempt < 50; attempt++) {
    const sol = solve()
    if (sol) return sol
  }
  return Array.from({ length: N }, (_, i) => i)
}

function generateBoard(): QueensBoard {
  const perm = generateQueensSolution()
  const colors: number[][] = Array.from({ length: N }, () => Array(N).fill(0))
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let best = 0
      let bestDist = Infinity
      for (const q of shuffle(Array.from({ length: N }, (_, i) => i))) {
        const dist = Math.abs(r - q) + Math.abs(c - perm[q])
        if (dist < bestDist) {
          bestDist = dist
          best = q
        }
      }
      colors[r][c] = best
    }
  }
  return { colors, solution: perm }
}

function cellKey(r: number, c: number) {
  return `${r}-${c}`
}

export default function Queens() {
  const [board, setBoard] = useState<QueensBoard | null>(null)
  const [queens, setQueens] = useState<Set<string>>(new Set())
  const [started, setStarted] = useState(false)
  const [over, setOver] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(0)
  const { submit, submitting, feedback, resetTimer } = useScoreSubmit('queens')

  const start = () => {
    setBoard(generateBoard())
    setQueens(new Set())
    setStarted(true)
    setOver(false)
    setElapsed(0)
    startTimeRef.current = Date.now()
    resetTimer()
  }

  useEffect(() => {
    if (!started || over) return
    const id = window.setInterval(() => setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [started, over])

  const conflicts = useMemo(() => {
    const set = new Set<string>()
    if (!board) return set
    const list = [...queens].map((k) => k.split('-').map(Number))
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [r1, c1] = list[i]
        const [r2, c2] = list[j]
        if (r1 === r2 || c1 === c2 || board.colors[r1][c1] === board.colors[r2][c2] || (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1)) {
          set.add(cellKey(r1, c1))
          set.add(cellKey(r2, c2))
        }
      }
    }
    return set
  }, [queens, board])

  useEffect(() => {
    if (!board || !started || over) return
    if (queens.size === N && conflicts.size === 0) {
      setOver(true)
      submit(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)))
    }
  }, [queens, conflicts, started, over, board, submit])

  const toggle = (r: number, c: number) => {
    if (!started || over || !board) return
    setQueens((prev) => {
      const next = new Set(prev)
      const key = cellKey(r, c)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="game-stage queens-wrap">
      <GameHud
        stats={[
          { label: 'Queens', value: `${queens.size}/${N}` },
          { label: 'Time', value: `${mins}:${secs.toString().padStart(2, '0')}` },
        ]}
        action={
          !started ? (
            <button className="btn btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            over && (
              <button className="btn btn-ghost" onClick={start}>
                Play again
              </button>
            )
          )
        }
      />

      {board && (
        <div className="queens-grid" role="grid" aria-label="Queens board">
          {board.colors.map((row, r) =>
            row.map((color, c) => {
              const key = cellKey(r, c)
              const hasQueen = queens.has(key)
              const inConflict = hasQueen && conflicts.has(key)
              return (
                <button
                  type="button"
                  key={key}
                  role="gridcell"
                  className={`queens-cell${hasQueen ? ' has-queen' : ''}${inConflict ? ' conflict' : ''}`}
                  style={{ background: COLORS[color] }}
                  onClick={() => toggle(r, c)}
                  aria-label={`Row ${r + 1} column ${c + 1}${hasQueen ? ', queen placed' : ''}`}
                  aria-pressed={hasQueen}
                >
                  {hasQueen ? '♛' : ''}
                </button>
              )
            }),
          )}
        </div>
      )}

      {started && !over && (
        <p className="queens-hint">Place one queen in every row, column and color. Queens must not touch.</p>
      )}
      {conflicts.size > 0 && started && !over && (
        <p className="queens-hint warn">Conflicting queens highlighted — fix them to win.</p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} />
    </div>
  )
}
