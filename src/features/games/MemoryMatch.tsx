import { useEffect, useMemo, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const EMOJIS = ['🍒', '🍇', '🍋', '🍉', '⭐', '🌙', '🎯', '⚡']
const PAIRS = EMOJIS.length

interface Card {
  id: number
  emoji: string
  flipped: boolean
  matched: boolean
  error: boolean
}

function buildDeck(): Card[] {
  const deck: Card[] = []
  EMOJIS.forEach((emoji, i) => {
    deck.push({ id: i * 2, emoji, flipped: false, matched: false, error: false })
    deck.push({ id: i * 2 + 1, emoji, flipped: false, matched: false, error: false })
  })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export default function MemoryMatch() {
  const [deck, setDeck] = useState<Card[]>(buildDeck)
  const [picks, setPicks] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [done, setDone] = useState(false)
  const { submit, submitting, feedback, resetTimer } = useScoreSubmit('memory')

  const locked = picks.length >= 2

  useEffect(() => {
    if (picks.length !== 2) return
    const [a, b] = picks
    const cardA = deck[a]
    const cardB = deck[b]
    const isMatch = cardA.emoji === cardB.emoji
    const timer = window.setTimeout(() => {
      setDeck((prev) =>
        prev.map((card) =>
          card.id === cardA.id || card.id === cardB.id
            ? { ...card, flipped: isMatch, matched: isMatch, error: !isMatch }
            : card,
        ),
      )
      setPicks([])
      if (isMatch) {
        const newMatches = matches + 1
        setMatches(newMatches)
        if (newMatches === PAIRS) {
          setDone(true)
          const score = Math.max(0, 1200 - (moves - PAIRS) * 50)
          submit(score)
        }
      }
    }, 450)
    return () => window.clearTimeout(timer)
  }, [picks, deck, matches, moves, submit])

  const score = useMemo(() => Math.max(0, 1200 - (moves - PAIRS) * 50), [moves])

  const flip = (index: number) => {
    if (locked || done) return
    const card = deck[index]
    if (card.flipped || card.matched) return
    setMoves((m) => m + 1)
    setDeck((prev) => prev.map((c, i) => (i === index ? { ...c, flipped: true, error: false } : c)))
    setPicks((prev) => (prev.length < 2 ? [...prev, index] : prev))
  }

  const restart = () => {
    setDeck(buildDeck())
    setPicks([])
    setMoves(0)
    setMatches(0)
    setDone(false)
    resetTimer()
  }

  return (
    <div className="game-stage">
      <GameHud
        stats={[
          { label: 'Matches', value: `${matches}/${PAIRS}` },
          { label: 'Moves', value: moves },
        ]}
        action={
          <button className="btn btn-ghost" onClick={restart}>
            Restart
          </button>
        }
      />

      <div className="memory-grid" aria-label="Memory match board">
        {deck.map((card, i) => (
          <button
            key={card.id}
            type="button"
            className={`memory-card${card.flipped || card.matched ? ' flipped' : ''}${card.matched ? ' matched' : ''}${card.error ? ' flip-error' : ''}`}
            onClick={() => flip(i)}
            disabled={locked || done || card.flipped || card.matched}
            aria-label={card.flipped || card.matched ? card.emoji : 'Hidden card'}
          >
            <div className="memory-inner">
              <div className="memory-face memory-back" aria-hidden />
              <div className="memory-face memory-front">{card.emoji}</div>
            </div>
          </button>
        ))}
      </div>

      {done && (
        <p className="status" role="status">
          All matched in {moves} moves — {score.toLocaleString()} pts
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} />
    </div>
  )
}
