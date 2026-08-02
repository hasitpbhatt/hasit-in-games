import { lazy, Suspense, useState } from 'react'
import type { GameId } from '../../lib/points'
import { GAMES } from '../../lib/points'
import { CHAMBERS } from '../../lib/story'
import { FrogMascot } from '../../components/FrogMascot'
import { useProgress } from '../../store/progress'

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
  toadhop: lazy(() => import('./ToadHop')),
}

export function GameView({ game, onBack }: { game: GameId; onBack: () => void }) {
  const Component = GAME_COMPONENTS[game]
  const def = GAMES.find((g) => g.id === game)
  const chamber = CHAMBERS[game]
  const briefed = useProgress((s) => s.briefed(game))
  const markBriefed = useProgress((s) => s.markBriefed)
  const [briefingDismissed, setBriefingDismissed] = useState(false)

  const showBriefing = chamber && !briefed && !briefingDismissed

  return (
    <div className="game-view">
      <div className="game-view-toolbar">
        <button className="btn btn-ghost back-btn" onClick={onBack}>
          <span aria-hidden>←</span> The Trials
        </button>
        <h2>
          {def?.icon} {def?.name}
        </h2>
      </div>

      {chamber && (
        <div className="chapter-title" style={{ ['--chamber' as string]: chamber.accent }}>
          <span className="chamber-tag">
            Chamber {chamber.chapter} · {chamber.chamber}
          </span>
          <p>{chamber.hook}</p>
        </div>
      )}

      {showBriefing && (
        <div className="game-tip briefing-tip" role="status">
          <FrogMascot className="briefing-frog" />
          <span>{chamber.briefing}</span>
          <button
            type="button"
            onClick={() => {
              setBriefingDismissed(true)
              markBriefed(game)
            }}
            aria-label="Dismiss briefing"
          >
            ✕
          </button>
        </div>
      )}

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
              <span>Loading the {chamber?.chamber ?? def?.name ?? 'game'} cabinet…</span>
            </div>
          }
        >
          <Component />
        </Suspense>
      </div>
    </div>
  )
}
