import type { GameDef } from '../../lib/points'

interface GameCardProps {
  game: GameDef
  index: number
  onPlay: (id: GameDef['id']) => void
}

export function GameCard({ game, index, onPlay }: GameCardProps) {
  return (
    <button
      type="button"
      className="game-card"
      style={{ ['--i' as string]: index }}
      onClick={() => onPlay(game.id)}
      aria-label={`Play ${game.name}`}
    >
      <span className="game-icon" aria-hidden>
        {game.icon}
      </span>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <div className="game-card-foot">
        <span className="game-meta">up to {game.maxPointsPerPlay} pts</span>
        <span className="chip" aria-hidden>
          Play →
        </span>
      </div>
    </button>
  )
}
