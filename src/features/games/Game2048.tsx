import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../../lib/api'

const SIZE = 4
const STORAGE_KEY = 'hasit-games-2048-best'

type Grid = number[][]

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function clone(g: Grid): Grid {
  return g.map((row) => [...row])
}

function addRandomTile(g: Grid): Grid {
  const grid = clone(g)
  const empties: Array<[number, number]> = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empties.push([r, c])
    }
  }
  if (empties.length === 0) return grid
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  grid[r][c] = Math.random() < 0.9 ? 2 : 4
  return grid
}

// Returns { grid, gained, moved } — compress + merge for a direction.
function moveLeft(grid: Grid): { grid: Grid; gained: number; moved: boolean } {
  let gained = 0
  let moved = false
  const out = emptyGrid()
  for (let r = 0; r < SIZE; r++) {
    const row = grid[r].filter((v) => v !== 0)
    const merged: number[] = []
    for (let i = 0; i < row.length; i++) {
      if (i + 1 < row.length && row[i] === row[i + 1]) {
        merged.push(row[i] * 2)
        gained += row[i] * 2
        i++
      } else {
        merged.push(row[i])
      }
    }
    for (let c = 0; c < merged.length; c++) {
      out[r][c] = merged[c]
      if (out[r][c] !== grid[r][c]) moved = true
    }
    if (merged.length !== row.length) moved = true
  }
  return { grid: out, gained, moved }
}

function rotate(g: Grid): Grid {
  const out = emptyGrid()
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      out[c][SIZE - 1 - r] = g[r][c]
    }
  }
  return out
}

function move(grid: Grid, dir: 'left' | 'right' | 'up' | 'down') {
  let g = clone(grid)
  let gained = 0
  let moved = false
  let turns = 0
  if (dir === 'right') {
    turns = 2
  } else if (dir === 'up') {
    turns = 3
  } else if (dir === 'down') {
    turns = 1
  }
  for (let i = 0; i < turns; i++) g = rotate(g)
  const res = moveLeft(g)
  gained = res.gained
  moved = res.moved
  g = res.grid
  for (let i = 0; i < (4 - turns) % 4; i++) g = rotate(g)
  return { grid: g, gained, moved }
}

function canMove(g: Grid): boolean {
  if (g.some((row) => row.some((v) => v === 0))) return true
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c]
      if (c + 1 < SIZE && g[r][c + 1] === v) return true
      if (r + 1 < SIZE && g[r + 1][c] === v) return true
    }
  }
  return false
}

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => addRandomTile(addRandomTile(emptyGrid())))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEY) ?? 0))
  const [over, setOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const playStartRef = useRef(Date.now())

  const submit = useCallback(async (finalScore: number) => {
    if (submitting) return
    setSubmitting(true)
    setResult(null)
    const playSeconds = Math.round((Date.now() - playStartRef.current) / 1000)
    try {
      const res = await api.submitScore('2048', finalScore, playSeconds)
      setResult(res.points > 0 ? `+${res.points} points earned!` : res.capped ? 'No points this round (daily cap reached)' : 'Playtime too short to earn points')
    } catch (err) {
      setResult(err instanceof ApiError ? err.message : 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }, [submitting])

  const start = () => {
    playStartRef.current = Date.now()
    setGrid(addRandomTile(addRandomTile(emptyGrid())))
    setScore(0)
    setOver(false)
    setResult(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (over) return
      const dirMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      }
      const dir = dirMap[e.key]
      if (!dir) return
      e.preventDefault()
      const res = move(grid, dir)
      if (!res.moved) return
      const next = addRandomTile(res.grid)
      setGrid(next)
      setScore((s) => s + res.gained)
      if (!canMove(next)) {
        setOver(true)
        if (score + res.gained > best) {
          localStorage.setItem(STORAGE_KEY, String(score + res.gained))
          setBest(score + res.gained)
        }
        submit(score + res.gained)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grid, over, score, best, submit])

  return (
    <div className="game-2048">
      <div className="game-hud">
        <span>Score: {score.toLocaleString()}</span>
        <span>Best: {best.toLocaleString()}</span>
        <button className="btn btn-ghost" onClick={start}>New game</button>
      </div>
      <div className="tiles" aria-label="2048 board">
        {grid.flatMap((row, r) =>
          row.map((v, c) => (
            <div key={`${r}-${c}`} className={`tile tile-${Math.min(v, 2048)}`}>
              {v || ''}
            </div>
          )),
        )}
      </div>
      {over && <div className="game-over">Game over</div>}
      {submitting && <p className="status">Submitting…</p>}
      {result && <p className="status">{result}</p>}
    </div>
  )
}
