import { useEffect, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'
import { wordsFromRack } from '../../lib/dictionary'

const ROUND_SECONDS = 90
const MIN_YIELD = 30

const VOWELS = 'aeiou'
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz'
// Rough Scrabble-style frequency weights so racks skew to useful letters.
const LETTER_WEIGHTS: Record<string, number> = {
  a: 9, b: 2, c: 3, d: 4, e: 12, f: 2, g: 2, h: 2, i: 8, j: 1, k: 1,
  l: 4, m: 3, n: 6, o: 8, p: 3, q: 1, r: 6, s: 6, t: 9, u: 4, v: 1,
  w: 2, x: 1, y: 2, z: 1,
}

function weightedPick(pool: string, weights: Record<string, number>): string {
  const total = pool.split('').reduce((s, ch) => s + (weights[ch] ?? 1), 0)
  let r = Math.random() * total
  for (const ch of pool) {
    r -= weights[ch] ?? 1
    if (r <= 0) return ch
  }
  return pool[0]
}

function shuffle(list: string[]): string[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 3 vowels + 4 consonants, shuffled.
function makeRack(): string[] {
  const rack: string[] = []
  for (let i = 0; i < 3; i++) rack.push(weightedPick(VOWELS, LETTER_WEIGHTS))
  for (let i = 0; i < 4; i++) rack.push(weightedPick(CONSONANTS, LETTER_WEIGHTS))
  return shuffle(rack)
}

// A rack with a healthy word yield (retry until ≥ MIN_YIELD; keep the best).
function makeRound(): { rack: string[]; words: string[] } {
  let best = { rack: [] as string[], words: [] as string[] }
  for (let tries = 0; tries < 80; tries++) {
    const rack = makeRack()
    const words = wordsFromRack(rack)
    if (words.length > best.words.length) best = { rack, words }
    if (words.length >= MIN_YIELD) return { rack, words }
  }
  return best
}

export default function Anagram() {
  const [round, setRound] = useState<{ rack: string[]; words: string[] }>(() => makeRound())
  const [found, setFound] = useState<string[]>([])
  const [typed, setTyped] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const foundRef = useRef(new Set<string>())
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('anagram')

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setRunning(false)
    setFinished(true)
    submit(scoreRef.current)
  }

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [running])

  useEffect(() => {
    if (!running || finished) return
    if (timeLeft <= 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft])

  const submitGuess = () => {
    if (!running || finished) return
    const g = typed.trim().toLowerCase()
    if (!g) return
    if (foundRef.current.has(g)) {
      setMessage({ kind: 'err', text: 'Already found.' })
      return
    }
    if (g.length < 3) {
      setMessage({ kind: 'err', text: 'Words need 3+ letters.' })
      return
    }
    if (!round.words.includes(g)) {
      setMessage({ kind: 'err', text: 'Not a word in this rack.' })
      return
    }
    foundRef.current.add(g)
    scoreRef.current += 1
    setFound((f) => [...f, g])
    setTyped('')
    setMessage({ kind: 'ok', text: `+1 — ${foundRef.current.size} found` })
  }

  const start = () => {
    const r = makeRound()
    finishedRef.current = false
    foundRef.current = new Set()
    scoreRef.current = 0
    setRound(r)
    setFound([])
    setTyped('')
    setMessage(null)
    setTimeLeft(ROUND_SECONDS)
    setFinished(false)
    setRunning(true)
    resetTimer()
  }

  return (
    <div className="game-stage">
      <GameHud
        stats={[
          { label: 'Found', value: found.length },
          { label: 'In rack', value: round.words.length },
        ]}
        timer={{ value: timeLeft, max: ROUND_SECONDS }}
        action={
          !running && !finished ? (
            <button className="btn btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            finished && (
              <button className="btn btn-ghost" onClick={start}>
                Play again
              </button>
            )
          )
        }
      />

      <div className="anagram-view">
        <div className="anagram-rack" aria-label="Rack letters">
          {round.rack.map((ch, i) => (
            <span key={`${ch}-${i}`} className="anagram-tile">
              {ch.toUpperCase()}
            </span>
          ))}
        </div>
        <form
          className="ladder-form"
          onSubmit={(e) => {
            e.preventDefault()
            submitGuess()
          }}
        >
          <input
            className="ladder-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            placeholder="Type a word from the rack"
            maxLength={7}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Anagram guess"
          />
          <button type="submit" className="btn btn-primary" disabled={!running || !typed.trim()}>
            Add
          </button>
        </form>
        {message && (
          <p className={`promo-msg ${message.kind}`} role="status">
            {message.text}
          </p>
        )}
        {found.length > 0 && (
          <div className="anagram-found" aria-label="Found words">
            {found.map((w) => (
              <span key={w} className="chip chip-word">
                {w.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {finished && (
        <p className="status" role="status">
          Time! {scoreRef.current} words found
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
