import type { GameDef, GameId } from '../../lib/points'
import { CHAMBERS } from '../../lib/story'
import { useProgress } from '../../store/progress'

interface GameCardProps {
  game: GameDef
  index: number
  onPlay: (id: GameDef['id']) => void
}

const SCORE_UNIT: Partial<Record<GameId, string>> = {
  reaction: ' ms',
  queens: ' s',
  tango: ' s',
  '2048': ' tile',
}

export function GameCard({ game, index, onPlay }: GameCardProps) {
  const chamber = CHAMBERS[game.id]
  const purified = useProgress((s) => s.purified)
  const healed = purified.includes(game.id)

  const accent = chamber?.accent ?? 'var(--accent-1)'
  const accentSoft = chamber ? `color-mix(in srgb, ${chamber.accent} 16%, transparent)` : 'var(--border)'

  const thresholdText = chamber
    ? chamber.metric === 'tile'
      ? `Heal: reach the ${chamber.threshold} tile`
      : `Heal: ${chamber.direction === 'lower' ? '≤' : '≥'} ${chamber.threshold}${SCORE_UNIT[game.id] ?? ' pts'}`
    : null

  return (
    <button
      type="button"
      className={`game-card${healed ? ' healed' : ''}`}
      style={{ ['--i' as string]: index, ['--chamber' as string]: accent, ['--chamber-soft' as string]: accentSoft }}
      onClick={() => onPlay(game.id)}
      aria-label={`Trial: ${chamber?.chamber ?? game.name}`}
    >
      {chamber && (
        <span className="chapter-badge" aria-hidden>
          Ch. {chamber.chapter}
        </span>
      )}
      <span className="game-icon" aria-hidden>
        {game.icon}
      </span>
      <h3>{chamber?.chamber ?? game.name}</h3>
      <p>{chamber?.hook ?? game.description}</p>
      {thresholdText && <p className="game-card-threshold">{thresholdText}</p>}
      <div className="game-card-foot">
        <span className="cabinet-status" data-status={healed ? 'healed' : 'active'}>
          {healed ? 'Healed ✓' : 'Nullmoth'}
        </span>
        <span className="game-meta">up to {game.maxPointsPerPlay} pts</span>
        <span className="chip" aria-hidden>
          Play →
        </span>
      </div>
    </button>
  )
}
