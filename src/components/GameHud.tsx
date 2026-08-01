import type { ReactNode } from 'react'

export interface HudStat {
  label: string
  value: ReactNode
}

interface GameHudProps {
  stats: HudStat[]
  timer?: { value: number; max: number }
  action?: ReactNode
}

export function GameHud({ stats, timer, action }: GameHudProps) {
  return (
    <div className="game-hud">
      <div className="hud-stats">
        {stats.map((s) => (
          <div className="hud-stat" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      {timer && (
        <div className="hud-timer" aria-label={`${Math.round((timer.value / timer.max) * 100)}% remaining`}>
          <div className="hud-timer-bar">
            <span style={{ width: `${Math.max(0, Math.min(100, (timer.value / timer.max) * 100))}%` }} />
          </div>
          <span className="chip">{timer.value}s</span>
        </div>
      )}

      {action}
    </div>
  )
}
