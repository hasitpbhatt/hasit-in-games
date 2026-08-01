import type { GameId } from '../../lib/points'
import { GAMES } from '../../lib/points'
import Game2048 from './Game2048'
import MemoryMatch from './MemoryMatch'
import WhackAMole from './WhackAMole'
import ReactionTime from './ReactionTime'
import Snake from './Snake'
import TypingSprint from './TypingSprint'
import Queens from './Queens'
import Tango from './Tango'
import Pinpoint from './Pinpoint'

type GameComponent = () => React.JSX.Element

const GAME_COMPONENTS: Record<GameId, GameComponent> = {
  '2048': Game2048,
  memory: MemoryMatch,
  whack: WhackAMole,
  reaction: ReactionTime,
  snake: Snake,
  typing: TypingSprint,
  queens: Queens,
  tango: Tango,
  pinpoint: Pinpoint,
}

export function GameView({ game, onBack }: { game: GameId; onBack: () => void }) {
  const Component = GAME_COMPONENTS[game]
  const def = GAMES.find((g) => g.id === game)
  return (
    <div className="game-view">
      <div className="game-view-toolbar">
        <button className="btn btn-primary back-btn" onClick={onBack}>
          <span aria-hidden>←</span> Back to vault
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
