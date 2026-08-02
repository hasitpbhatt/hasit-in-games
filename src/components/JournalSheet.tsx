import { useProgress } from '../store/progress'
import {
  ACHIEVEMENTS,
  CHAMBERS,
  CHAPTERS,
  CHAMBER_ORDER,
  TITLES,
  titleById,
} from '../lib/story'
import { GAMES } from '../lib/points'
import type { GameId } from '../lib/points'
import { FrogMascot } from './FrogMascot'
import { SoulMeter } from './SoulMeter'

interface JournalSheetProps {
  onPlay: (game: GameId) => void
}

export function JournalSheet({ onPlay }: JournalSheetProps) {
  const { soulPct, purified, unlocked, titles, streakTier } = useProgress()

  const nextTrial = CHAMBER_ORDER.find((id) => !purified.includes(id))
  const nextChamber = nextTrial ? CHAMBERS[nextTrial] : null
  const nextChapter = nextChamber ? CHAPTERS.find((c) => c.id === nextChamber.chapter) : null
  const nextGame = nextTrial ? GAMES.find((g) => g.id === nextTrial) : null

  const healedIds = new Set(purified)
  const unlockedIds = new Set(unlocked)

  return (
    <div className="journal">
      <div className="sheet-heading">
        <h2>The Last Cabinet</h2>
        <p>
          {purified.length} of {CHAMBER_ORDER.length} cabinets healed · {soulPct}% soul restored
        </p>
      </div>

      <SoulMeter compact />

      {nextTrial && nextChamber && nextChapter ? (
        <div className="journal-card pixel-corner">
          <span className="chamber-tag">
            Chapter {nextChapter.id} · {nextChapter.name}
          </span>
          <h3>
            Next trial: {nextGame?.icon} {nextChamber.chamber}
          </h3>
          <p>{nextChamber.hook}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onPlay(nextTrial)}
          >
            Enter the trial →
          </button>
        </div>
      ) : (
        <div className="journal-card pixel-corner">
          <h3>The arcade breathes again</h3>
          <p>
            You healed every cabinet. The floor hums. — the caretaker
          </p>
        </div>
      )}

      <div className="journal-note">
        <FrogMascot className="journal-frog" />
        <p>
          {soulPct >= 100
            ? 'Full soul. I\u2019m putting the mop down. Thanks, keeper.'
            : streakTier
              ? `The ember burns ${streakTier.name.toLowerCase()} — ${streakTier.line}`
              : 'Purify a cabinet and the glow comes back. That\u2019s the deal.'}
        </p>
      </div>

      <div className="journal-section">
        <h4 className="journal-title">Your titles</h4>
        <div className="journal-chips">
          {TITLES.filter((t) => titles.includes(t.id)).map((t) => (
            <span className="chip chip-title" key={t.id}>
              ★ {t.name}
            </span>
          ))}
          {titles.length === 0 && <span className="journal-muted">Earn titles by healing cabinets.</span>}
        </div>
      </div>

      <div className="journal-section">
        <h4 className="journal-title">Achievements</h4>
        <ul className="journal-achievements">
          {ACHIEVEMENTS.map((a) => {
            const done = unlockedIds.has(a.id)
            return (
              <li key={a.id} className={done ? 'done' : ''}>
                <span className="journal-ach-icon" aria-hidden>
                  {done ? '✦' : '·'}
                </span>
                <span>
                  <strong>{done ? a.name : '\u2026\u2026\u2026'}</strong>
                  <em>{a.flavor}</em>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="journal-section">
        <h4 className="journal-title">The story so far</h4>
        <details className="journal-recap">
          <summary>Recap</summary>
          <p>
            The Nullmoth glitch gnawed the glow out of the cabinets. You are its
            keeper — purify each trial by proving real skill, and the arcade\u2019s
            soul comes back. Points stay points; PEPE stays the coin.
          </p>
          <ul>
            {CHAPTERS.map((c) => {
              const done = healedIds.has(
                CHAMBER_ORDER.find((id) => CHAMBERS[id].chapter === c.id) as GameId,
              )
              return (
                <li key={c.id} className={done ? 'done' : ''}>
                  Chapter {c.id} — {c.name}
                </li>
              )
            })}
          </ul>
        </details>
      </div>

      <div className="journal-section">
        <span className="journal-muted">Title: {titleById(titles[titles.length - 1] ?? '')?.name ?? 'Novice Keeper'}</span>
      </div>
    </div>
  )
}
