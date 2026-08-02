import { lazy, Suspense } from 'react'
import type { GameId } from '../../lib/points'
import { GAMES } from '../../lib/points'

const GAME_COMPONENTS: Record<GameId, React.LazyExoticComponent<() => React.JSX.Element>> = {
  '2048': lazy(() => import('./Game2048')),
  memory: lazy(() => import('./MemoryMatch')),
  whack: lazy(() => import('./WhackAMole')),
  reaction: lazy(() => import('./ReactionTime')),
  snake: lazy(() => import('./Snake')),
  typing: lazy(() => import('./TypingSprint')),
  queens: lazy(() => import('./Queens')),
  tango: lazy(() => import('./Tango')),
  pinpoint: lazy(() => import('./Pinpoint')),
}

export function GameView({ game, onBack }: { game: GameId; onBack: () => void }) {
  const Component = GAME_COMPONENTS[game]
  const def = GAMES.find((g) => g.id === game)
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
        {def?.rules && (
          <p className="queens-hint" style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            {def.rules}
          </p>
        )}
        <Suspense
          fallback={
            <div className="loading-game">
              <div className="skeleton-ring" aria-hidden />
              <span>Loading {def?.name ?? 'game'}…</span>
            </div>
          }
        >
          <Component />
        </Suspense>
      </div>
    </div>
  )
}
