import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  decay: number
}

const COLORS = ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fbbf24', '#f472b6']
const COUNT = 42

export function ParticleBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // The global reduced-motion CSS can't stop a requestAnimationFrame loop,
    // so gate the whole effect here. Users who prefer reduced motion get
    // nothing rendered rather than an animated burst.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    if (reduced) return

    const dpr = window.devicePixelRatio || 1
    const size = Math.min(window.innerWidth, window.innerHeight)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size * 0.35

    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 6
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
      }
    })

    let frame: number
    const tick = () => {
      ctx.clearRect(0, 0, size, size)
      let alive = false
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.99
        p.life -= p.decay
        if (p.life <= 0) return
        alive = true
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
      if (alive) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="particle-burst"
      aria-hidden
    />
  )
}
