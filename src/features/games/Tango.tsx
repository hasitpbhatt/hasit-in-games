import { useEffect, useMemo, useRef, useState } from 'react'
import { GameHud } from '../../components/GameHud'
import { ScoreBanner } from './ScoreBanner'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const SIZE = 6
const SUN = 1
const MOON = 2
const EMPTY = 0
const GLYPHS = ['', '☀️', '🌙']

interface Constraint {
  r: number
  c: number
  dir: 'h' | 'v'
  type: 'same' | 'diff'
}

interface TangoPuzzle {
  givens: Set<number>
  constraints: Constraint[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function validRows(): number[][] {
  const out: number[][] = []
  for (let mask = 0; mask < 1 << SIZE; mask++) {
    const row = Array.from({ length: SIZE }, (_, c) => ((mask >> c) & 1 ? SUN : MOON))
    if (row.filter((x) => x === SUN).length !== SIZE / 2) continue
    let triple = false
    for (let i = 2; i < SIZE; i++) {
      if (row[i] === row[i - 1] && row[i] === row[i - 2]) triple = true
    }
    if (!triple) out.push(row)
  }
  return out
}

const ROW_POOL = validRows()

function generateSolution(): number[][] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const rows: number[][] = []
    const cols: number[][] = Array.from({ length: SIZE }, () => [])
    const bt = (r: number): boolean => {
      if (r === SIZE) return true
      for (const row of shuffle(ROW_POOL)) {
        let ok = true
        for (let c = 0; c < SIZE && ok; c++) {
          const v = row[c]
          const col = cols[c]
          if (col.length >= 2 && col[col.length - 1] === v && col[col.length - 2] === v) ok = false
          if (col.filter((x) => x === v).length >= 3) ok = false
        }
        if (!ok) continue
        rows.push(row)
        for (let c = 0; c < SIZE; c++) cols[c].push(row[c])
        if (bt(r + 1)) return true
        rows.pop()
        for (let c = 0; c < SIZE; c++) cols[c].pop()
      }
      return false
    }
    if (bt(0)) return rows
  }
  return Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => ((r + c) % 2 ? MOON : SUN)))
}

function buildPuzzle(grid: number[][]): TangoPuzzle {
  const givens = new Set(shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i)).slice(0, 14))
  const constraints: Constraint[] = []
  const pick = (cells: [number, number][], dir: 'h' | 'v', n: number) => {
    for (const [r, c] of shuffle(cells).slice(0, n)) {
      const dr = dir === 'v' ? 1 : 0
      const dc = dir === 'h' ? 1 : 0
      constraints.push({ r, c, dir, type: grid[r][c] === grid[r + dr][c + dc] ? 'same' : 'diff' })
    }
  }
  pick(
    Array.from({ length: SIZE * (SIZE - 1) }, (_, i) => [Math.floor(i / (SIZE - 1)), i % (SIZE - 1)] as [number, number]),
    'h',
    3,
  )
  pick(
    Array.from({ length: (SIZE - 1) * SIZE }, (_, i) => [Math.floor(i / SIZE), i % SIZE] as [number, number]),
    'v',
    3,
  )
  return { givens, constraints }
}

function countSun(arr: number[]): number {
  return arr.filter((x) => x === SUN).length
}

function hasTriple(arr: number[]): boolean {
  for (let i = 2; i < arr.length; i++) {
    if (arr[i] === arr[i - 1] && arr[i] === arr[i - 2]) return true
  }
  return false
}

function isValid(values: number[], constraints: Constraint[]): boolean {
  for (let r = 0; r < SIZE; r++) {
    const row = values.slice(r * SIZE, r * SIZE + SIZE)
    if (row.some((x) => x === EMPTY) || countSun(row) !== 3 || hasTriple(row)) return false
  }
  for (let c = 0; c < SIZE; c++) {
    const col = Array.from({ length: SIZE }, (_, r) => values[r * SIZE + c])
    if (countSun(col) !== 3 || hasTriple(col)) return false
  }
  for (const cn of constraints) {
    const a = values[cn.r * SIZE + cn.c]
    const b = values[cn.dir === 'h' ? cn.r * SIZE + cn.c + 1 : (cn.r + 1) * SIZE + cn.c]
    if (cn.type === 'same' && a !== b) return false
    if (cn.type === 'diff' && a === b) return false
  }
  return true
}

export default function Tango() {
  const [puzzle, setPuzzle] = useState<TangoPuzzle | null>(null)
  const [values, setValues] = useState<number[]>([])
  const [started, setStarted] = useState(false)
  const [over, setOver] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(0)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('tango')

  const start = () => {
    const sol = generateSolution()
    const pz = buildPuzzle(sol)
    const vals = Array.from({ length: SIZE * SIZE }, (_, i) => (pz.givens.has(i) ? sol[Math.floor(i / SIZE)][i % SIZE] : EMPTY))
    setPuzzle(pz)
    setValues(vals)
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

  const filled = useMemo(() => values.every((v) => v !== EMPTY), [values])

  useEffect(() => {
    if (!started || over || !puzzle) return
    if (filled && isValid(values, puzzle.constraints)) {
      setOver(true)
      submit(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)))
    }
  }, [filled, values, started, over, puzzle, submit])

  const cycle = (idx: number) => {
    if (!started || over || !puzzle || puzzle.givens.has(idx)) return
    setValues((prev) => {
      const next = [...prev]
      next[idx] = next[idx] === EMPTY ? SUN : next[idx] === SUN ? MOON : EMPTY
      return next
    })
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="game-stage tango-wrap">
      <GameHud
        stats={[
          { label: 'Filled', value: `${values.filter((v) => v !== EMPTY).length}/${SIZE * SIZE}` },
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

      {puzzle && (
        <div className="tango-grid" role="grid" aria-label="Tango board">
          {values.map((v, i) => {
            const given = puzzle.givens.has(i)
            return (
              <button
                type="button"
                key={i}
                role="gridcell"
                className={`tango-cell${given ? ' given' : ''}${v === SUN ? ' sun' : v === MOON ? ' moon' : ''}`}
                onClick={() => cycle(i)}
                disabled={given || over}
                aria-label={`Cell ${i + 1}${v ? `, ${GLYPHS[v]}` : ', empty'}`}
                aria-pressed={v !== EMPTY}
              >
                {GLYPHS[v]}
              </button>
            )
          })}
          {puzzle.constraints.map((cn, i) => {
            const left = cn.dir === 'h' ? (cn.c + 0.5) * (100 / SIZE) : (cn.c + 0.5) * (100 / SIZE)
            const top = cn.dir === 'v' ? (cn.r + 0.5) * (100 / SIZE) : (cn.r + 0.5) * (100 / SIZE)
            return (
              <span
                key={i}
                className="tango-marker"
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-label={cn.type === 'same' ? 'must be the same' : 'must differ'}
              >
                {cn.type === 'same' ? '=' : '≠'}
              </span>
            )
          })}
        </div>
      )}

      {started && !over && (
        <p className="queens-hint">Equal suns & moons per row and column, no three in a row. Tap cells to cycle.</p>
      )}
      {filled && started && !over && (
        <p className="queens-hint warn">Check the rules — something isn't balanced yet.</p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
