import { useCallback, useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { FirstTimeTip } from '../../components/FirstTimeTip'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const GRID = 20
const BASE_TICK = 160
const CELL = 24
const LOGICAL = GRID * CELL

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'

const DIRS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function randomFood(snake: Point[]): Point {
  let p: Point
  do {
    p = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    }
  } while (snake.some((s) => s.x === p.x && s.y === p.y))
  return p
}

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [length, setLength] = useState(0)
  const [level, setLevel] = useState(1)
  const gameRef = useRef<{
    snake: Point[]
    dir: Direction
    food: Point
    dead: boolean
    ticks: number
  } | null>(null)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('snake')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = LOGICAL / GRID
    ctx.clearRect(0, 0, LOGICAL, LOGICAL)

    ctx.fillStyle = 'rgba(129, 140, 248, 0.18)'
    ctx.fillRect(game.food.x * size + size * 0.2, game.food.y * size + size * 0.2, size * 0.6, size * 0.6)

    game.snake.forEach((seg, i) => {
      const t = i / game.snake.length
      const r = 129 + (99 - 129) * t
      const g = 140 + (211 - 140) * t
      const b = 248 + (153 - 248) * t
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.beginPath()
      ctx.roundRect(seg.x * size + 1, seg.y * size + 1, size - 2, size - 2, 4)
      ctx.fill()
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = LOGICAL * dpr
    canvas.height = LOGICAL * dpr
    ctx.scale(dpr, dpr)
    draw()
  }, [draw])

  const start = useCallback(() => {
    const head: Point = { x: 10, y: 10 }
    gameRef.current = {
      snake: [head, { x: 9, y: 10 }, { x: 8, y: 10 }],
      dir: 'right',
      food: randomFood([head]),
      dead: false,
      ticks: 0,
    }
    setRunning(true)
    setOver(false)
    setScore(0)
    setLength(0)
    setLevel(1)
    resetTimer()
    draw()
  }, [draw, resetTimer])

  const tick = useCallback(() => {
    const game = gameRef.current
    if (!game || game.dead) return
    const dirVec = DIRS[game.dir]
    const head = game.snake[0]
    const next: Point = { x: head.x + dirVec.x, y: head.y + dirVec.y }
    const hitWall = next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID
    const hitSelf = game.snake.some((s) => s.x === next.x && s.y === next.y)
    if (hitWall || hitSelf) {
      game.dead = true
      setRunning(false)
      setOver(true)
      setScore(game.ticks)
      submit(game.ticks)
      return
    }
    game.snake.unshift(next)
    if (next.x === game.food.x && next.y === game.food.y) {
      game.ticks += 1
      setScore(game.ticks)
      setLength(game.snake.length)
      setLevel(Math.min(10, Math.floor(game.ticks / 5) + 1))
      game.food = randomFood(game.snake)
    } else {
      game.snake.pop()
    }
    draw()
  }, [draw, submit])

  // Recompute the tick interval on every loop so the speed actually ramps up
  // as the snake grows. A fixed setInterval would freeze the difficulty.
  // rAF + time accumulation keeps the game running at the same real-time pace
  // even if the tab is backgrounded (setTimeout gets throttled).
  useEffect(() => {
    if (!running) return
    let rafId: number
    let last = performance.now()
    let acc = 0
    const frame = (now: number) => {
      const game = gameRef.current
      if (!game || game.dead) return
      acc += now - last
      last = now
      const speed = Math.max(60, BASE_TICK - game.ticks * 2)
      while (acc >= speed) {
        acc -= speed
        tick()
        const g = gameRef.current
        if (!g || g.dead) return
      }
      rafId = window.requestAnimationFrame(frame)
    }
    rafId = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(rafId)
  }, [running, tick])

  const turn = useCallback((dir: Direction) => {
    const game = gameRef.current
    if (!game || !running) return
    const opposite: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    }
    if (game.dir === opposite[dir]) return
    game.dir = dir
  }, [running])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        d: 'right',
        D: 'right',
      }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      turn(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn])

  const startTouch = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    startTouch.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - startTouch.current.x
    const dy = t.clientY - startTouch.current.y
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'right' : 'left')
    else turn(dy > 0 ? 'down' : 'up')
    startTouch.current = null
  }

  return (
    <div className="snake-wrap">
      <GameHud
        stats={[
          { label: 'Score', value: score },
          { label: 'Length', value: length || 3 },
          { label: 'Speed', value: level },
        ]}
        action={
          !running && !over ? (
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

      <canvas
        ref={canvasRef}
        className="snake-canvas"
        width={LOGICAL}
        height={LOGICAL}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label="Snake game board — use arrow keys, WASD, or swipe to steer"
      />

      {running && (
        <div className="snake-controls" aria-label="Direction controls">
          <button className="btn btn-soft up" onClick={() => turn('up')} aria-label="Move up">
            ↑
          </button>
          <button className="btn btn-soft left" onClick={() => turn('left')} aria-label="Move left">
            ←
          </button>
          <button className="btn btn-soft down" onClick={() => turn('down')} aria-label="Move down">
            ↓
          </button>
          <button className="btn btn-soft right" onClick={() => turn('right')} aria-label="Move right">
            →
          </button>
        </div>
      )}

      {over && (
        <p className="status" role="status">
          Game over — {score} food eaten
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
      <FirstTimeTip storageKey="hasit-games-snake-tip">
        Use arrow keys, <strong>WASD</strong>, or swipe to steer. Every 5 food the game speeds up — watch the Speed meter.
      </FirstTimeTip>
    </div>
  )
}
