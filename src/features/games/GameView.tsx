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

const GAME_INSTRUCTIONS: Record<GameId, string> = {
  '2048': 'Slide tiles to combine matching numbers. Reach 2048 to win.',
  memory: 'Flip two cards to find matching pairs. Fewer moves = more points.',
  whack: 'Tap moles as they pop up. Faster hits earn more points.',
  reaction: 'Wait for the screen to change, then tap as fast as you can.',
  snake: 'Guide the snake to eat food and grow longer. Avoid walls and yourself.',
  typing: 'Type the words as fast as you can. More words in 30 seconds = more points.',
  queens: 'Place 8 queens on the board so no two threaten each other. Fewer moves = more points.',
  tango: 'Fill the grid with sun and moon. Each row and column must have exactly 3 of each.',
  pinpoint: 'Read 8 clues per round and guess the category. More correct = more points.',
}

export function GameView({ game, onBack }: { game: GameId; onBack: () => void }) {
  const Component = GAME_COMPONENTS[game]
  const def = GAMES.find((g) => g.id === game)
  const instruction = GAME_INSTRUCTIONS[game]
  return (
    <div className="game-view">
      <div className="game-view-toolbar">
        <button className="btn btn-ghost back-btn" onClick={onBack}>
          <span aria-hidden>←</span> Back to vault
        </button>
        <h2>
          {def?.icon} {def?.name}
        </h2>
      </div>
      <div className="game-shell">
        {instruction && (
          <p className="queens-hint" style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            {instruction}
          </p>
        )}
        <Component />
      </div>
    </div>
  )
}
