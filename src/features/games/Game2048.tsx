import { useCallback, useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const SIZE = 4
const STORAGE_KEY = 'hasit-games-2048-best'

type Grid = number[][]
type Dir = 'left' | 'right' | 'up' | 'down'

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

function move(grid: Grid, dir: Dir) {
  let g = clone(grid)
  let turns = 0
  if (dir === 'right') turns = 2
  else if (dir === 'up') turns = 3
  else if (dir === 'down') turns = 1
  for (let i = 0; i < turns; i++) g = rotate(g)
  const res = moveLeft(g)
  g = res.grid
  for (let i = 0; i < (4 - turns) % 4; i++) g = rotate(g)
  return { grid: g, gained: res.gained, moved: res.moved }
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
  const [bumps, setBumps] = useState<boolean[]>([])
  const { submit, submitting, feedback, resetTimer, undo } = useScoreSubmit('2048')
  const prevGridRef = useRef<Grid>(grid)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const updateBest = (value: number) => {
    if (value > Number(localStorage.getItem(STORAGE_KEY) ?? 0)) {
      localStorage.setItem(STORAGE_KEY, String(value))
      setBest(value)
    }
  }

  const handleMove = useCallback(
    (dir: Dir) => {
      if (over) return
      const res = move(grid, dir)
      if (!res.moved) return
      const next = addRandomTile(res.grid)
      prevGridRef.current = grid
      setGrid(next)
      const flat = next.flat()
      setBumps(flat.map((v, i) => v > 0 && v !== prevGridRef.current.flat()[i]))
      const newScore = score + res.gained
      setScore(newScore)
      updateBest(newScore)
      if (!canMove(next)) {
        setOver(true)
        submit(newScore)
      }
    },
    [grid, over, score, submit],
  )

  const start = () => {
    prevGridRef.current = emptyGrid()
    setGrid(addRandomTile(addRandomTile(emptyGrid())))
    setScore(0)
    setOver(false)
    setBumps([])
    resetTimer()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dirMap: Record<string, Dir> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      }
      const dir = dirMap[e.key]
      if (!dir) return
      e.preventDefault()
      handleMove(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
    touchStart.current = null
  }

  return (
    <div
      className="game-stage"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="2048 board — use arrow keys or swipe to play"
    >
      <GameHud
        stats={[
          { label: 'Score', value: score.toLocaleString() },
          { label: 'Best', value: best.toLocaleString() },
        ]}
        action={
          <button className="btn btn-ghost" onClick={start}>
            New game
          </button>
        }
      />

      <div className="tiles">
        {grid.flatMap((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className={`tile tile-${Math.min(v, 2048)}${bumps[r * SIZE + c] ? ' tile-bump' : ''}`}
            >
              {v || ''}
            </div>
          )),
        )}
      </div>

      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} />

      {over && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Game over">
          <div className="modal">
            <h2>Game over</h2>
            <div className="modal-score">{score.toLocaleString()}</div>
            <p className="modal-sub">Best score: {best.toLocaleString()}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={start} autoFocus>
                Play again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
