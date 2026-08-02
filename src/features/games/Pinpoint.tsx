import { useEffect, useRef, useState } from 'react'
import { GameHud } from '../../components/GameHud'
import { ScoreBanner } from './ScoreBanner'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const ROUND_SECONDS = 60
const MAX_REVEALS = 8

interface Category {
  name: string
  clues: string[]
}

const CATEGORIES: Category[] = [
  { name: 'Countries', clues: ['France', 'Brazil', 'Japan', 'Kenya', 'Canada', 'Australia', 'Chile', 'Mongolia'] },
  { name: 'Fruits', clues: ['Apple', 'Banana', 'Cherry', 'Mango', 'Papaya', 'Kiwi', 'Guava', 'Lychee'] },
  { name: 'Animals', clues: ['Dog', 'Cat', 'Elephant', 'Tiger', 'Dolphin', 'Penguin', 'Giraffe', 'Platypus'] },
  { name: 'Planets', clues: ['Venus', 'Mars', 'Jupiter', 'Neptune', 'Saturn', 'Uranus', 'Mercury', 'Earth'] },
  { name: 'Colors', clues: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Teal', 'Magenta'] },
  { name: 'Sports', clues: ['Soccer', 'Tennis', 'Swimming', 'Basketball', 'Cricket', 'Golf', 'Hockey', 'Badminton'] },
  { name: 'Music Genres', clues: ['Jazz', 'Rock', 'Hip-hop', 'Classical', 'Reggae', 'Country', 'Metal', 'Folk'] },
  { name: 'Board Games', clues: ['Chess', 'Monopoly', 'Scrabble', 'Clue', 'Risk', 'Catan', 'Checkers', 'Go'] },
  { name: 'Jobs', clues: ['Doctor', 'Teacher', 'Chef', 'Engineer', 'Pilot', 'Nurse', 'Barber', 'Plumber'] },
  { name: 'Vehicles', clues: ['Car', 'Boat', 'Train', 'Bicycle', 'Helicopter', 'Truck', 'Submarine', 'Tractor'] },
  { name: 'Programming Languages', clues: ['Python', 'Java', 'C++', 'JavaScript', 'Ruby', 'Go', 'Rust', 'Haskell'] },
  { name: 'Food', clues: ['Pizza', 'Taco', 'Sushi', 'Burger', 'Pasta', 'Salad', 'Ramen', 'Paella'] },
  { name: 'Weather', clues: ['Rain', 'Snow', 'Sunny', 'Fog', 'Thunder', 'Hurricane', 'Tornado', 'Drought'] },
  { name: 'Bodies of Water', clues: ['River', 'Lake', 'Ocean', 'Pond', 'Glacier', 'Delta', 'Fjord', 'Estuary'] },
  { name: 'Superheroes', clues: ['Batman', 'Spider-Man', 'Wonder Woman', 'Hulk', 'Flash', 'Aquaman', 'Black Panther', 'Thor'] },
  { name: 'Dances', clues: ['Salsa', 'Ballet', 'Breakdance', 'Tango', 'Waltz', 'Samba', 'Hip-hop', 'Flamenco'] },
  { name: 'Trees', clues: ['Oak', 'Pine', 'Maple', 'Birch', 'Willow', 'Cedar', 'Redwood', 'Baobab'] },
  { name: 'Birds', clues: ['Eagle', 'Owl', 'Robin', 'Parrot', 'Flamingo', 'Peacock', 'Albatross', 'Kiwi'] },
  { name: 'Instruments', clues: ['Piano', 'Guitar', 'Violin', 'Drums', 'Saxophone', 'Flute', 'Trumpet', 'Harp'] },
  { name: 'Capital Cities', clues: ['Paris', 'Tokyo', 'Nairobi', 'Ottawa', 'Lima', 'Oslo', 'Cairo', 'Seoul'] },
  { name: 'Elements', clues: ['Oxygen', 'Gold', 'Helium', 'Uranium', 'Iron', 'Carbon', 'Zinc', 'Mercury'] },
  { name: 'US States', clues: ['Texas', 'Alaska', 'Hawaii', 'Vermont', 'Nevada', 'Idaho', 'Ohio', 'Maine'] },
  { name: 'Rivers', clues: ['Nile', 'Amazon', 'Ganges', 'Danube', 'Volga', 'Thames', 'Rhine', 'Mississippi'] },
  { name: 'Dog Breeds', clues: ['Labrador', 'Beagle', 'Poodle', 'Husky', 'Corgi', 'Dachshund', 'Boxer', 'Collie'] },
  { name: 'Greek Gods', clues: ['Zeus', 'Athena', 'Apollo', 'Hermes', 'Artemis', 'Ares', 'Hades', 'Poseidon'] },
  { name: 'Zodiac Signs', clues: ['Aries', 'Taurus', 'Gemini', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Pisces'] },
  { name: 'Currencies', clues: ['Dollar', 'Euro', 'Yen', 'Pound', 'Rupee', 'Won', 'Real', 'Krone'] },
  { name: 'Painters', clues: ['Picasso', 'Monet', 'Van Gogh', 'Da Vinci', 'Rembrandt', 'Klimt', 'Dali', 'Renoir'] },
  { name: 'Planetary Moons', clues: ['Titan', 'Europa', 'Ganymede', 'Io', 'Triton', 'Phobos', 'Deimos', 'Miranda'] },
  { name: 'Flowers', clues: ['Rose', 'Tulip', 'Daisy', 'Lotus', 'Orchid', 'Lily', 'Sunflower', 'Daffodil'] },
  { name: 'Greek Letters', clues: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Theta', 'Pi'] },
  { name: 'African Countries', clues: ['Kenya', 'Ghana', 'Zambia', 'Niger', 'Mali', 'Chad', 'Benin', 'Rwanda'] },
  { name: 'Spices', clues: ['Cinnamon', 'Turmeric', 'Paprika', 'Cumin', 'Nutmeg', 'Oregano', 'Clove', 'Coriander'] },
  { name: 'Mountains', clues: ['Everest', 'Kilimanjaro', 'Fuji', 'Denali', 'Elbrus', 'K2', 'Mont Blanc', 'Aconcagua'] },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isGuessCorrect(guess: string, cat: Category): boolean {
  const g = guess.trim().toLowerCase()
  if (!g) return false
  if (g === cat.name.toLowerCase()) return true
  const words = cat.name.toLowerCase().split(/\s+/)
  return words.some((w) => w.length > 2 && g === w)
}

export default function Pinpoint() {
  const [queue, setQueue] = useState<Category[]>([])
  const [current, setCurrent] = useState<Category | null>(null)
  const [reveal, setReveal] = useState(1)
  const [guess, setGuess] = useState('')
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const submittedRef = useRef(false)
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('pinpoint')

  const start = () => {
    const q = shuffle(CATEGORIES)
    setQueue(q)
    setCurrent(q[0])
    setReveal(1)
    setGuess('')
    setScore(0)
    setTimeLeft(ROUND_SECONDS)
    setRunning(true)
    setOver(false)
    setMessage(null)
    submittedRef.current = false
    resetTimer()
  }

  useEffect(() => {
    if (!running || over) return
    const id = window.setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => window.clearInterval(id)
  }, [running, over])

  useEffect(() => {
    if (!running || over) return
    if (timeLeft <= 0) setOver(true)
  }, [timeLeft, running, over])

  useEffect(() => {
    if (over && !submittedRef.current) {
      submittedRef.current = true
      submit(score)
    }
  }, [over, score, submit])

  const next = (guessed: boolean) => {
    const idx = queue.indexOf(current!)
    const nxt = queue[idx + 1]
    if (nxt) {
      setCurrent(nxt)
      setReveal(1)
      setGuess('')
      setMessage(null)
      if (guessed) setScore((s) => s + 1)
    } else {
      setOver(true)
      if (guessed) setScore((s) => s + 1)
    }
  }

  const onGuess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!running || over || !current) return
    if (isGuessCorrect(guess, current)) {
      setMessage({ kind: 'ok', text: 'Correct!' })
      next(true)
    } else if (reveal < MAX_REVEALS) {
      setReveal((r) => r + 1)
      setGuess('')
      setMessage({ kind: 'err', text: 'Not quite — one more clue.' })
    } else {
      setMessage({ kind: 'err', text: `It was ${current.name}.` })
      next(false)
    }
  }

  return (
    <div className="game-stage">
      <GameHud
        stats={[
          { label: 'Solved', value: score },
          { label: 'Clues', value: `${reveal}/${MAX_REVEALS}` },
        ]}
        timer={{ value: timeLeft, max: ROUND_SECONDS }}
        action={
          !running && !over ? (
            <button className="btn btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            over && (
              <button className="btn btn-ghost" onClick={start}>
                Play again
              </button>
            )
          )
        }
      />

      {running && current && (
        <div className="pinpoint-clues">
          <p className="pinpoint-label">Clue {reveal}</p>
          <div className="pinpoint-words">
            {current.clues.slice(0, reveal).map((w) => (
              <span key={w} className="chip chip-word">
                {w}
              </span>
            ))}
          </div>
          <form onSubmit={onGuess} className="pinpoint-guess">
            <input
              className="pinpoint-input"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="What's the category?"
              maxLength={40}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={!guess.trim()}>
              Guess
            </button>
          </form>
          {message && (
            <p className={`promo-msg ${message.kind}`} role="status">
              {message.text}
            </p>
          )}
        </div>
      )}

      {over && (
        <p className="status" role="status">
          Round over — you solved {score} {score === 1 ? 'category' : 'categories'}
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
    </div>
  )
}
