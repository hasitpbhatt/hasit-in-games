import type { GameId } from '../../lib/points'
import { GAMES } from '../../lib/points'
import Game2048 from './Game2048'
import MemoryMatch from './MemoryMatch'
import WhackAMole from './WhackAMole'
import ReactionTime from './ReactionTime'
import Snake from './Snake'
import TypingSprint from './TypingSprint'

type GameComponent = () => React.JSX.Element

const GAME_COMPONENTS: Record<GameId, GameComponent> = {
  '2048': Game2048,
  memory: MemoryMatch,
  whack: WhackAMole,
  reaction: ReactionTime,
  snake: Snake,
  typing: TypingSprint,
}

export function GameView({ game, onBack }: { game: GameId; onBack: () => void }) {
  const Component = GAME_COMPONENTS[game]
  const def = GAMES.find((g) => g.id === game)
  return (
    <div className="game-view">
      <div className="game-view-toolbar">
        <button className="btn btn-soft" onClick={onBack}>
          ← Back
        </button>
        <h2>
          {def?.icon} {def?.name}
        </h2>
      </div>
      <div className="game-shell">
        <Component />
      </div>
    </div>
  )
}
