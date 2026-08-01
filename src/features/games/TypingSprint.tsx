import { useEffect, useMemo, useRef, useState } from 'react'
import { ScoreBanner } from './ScoreBanner'
import { GameHud } from '../../components/GameHud'
import { useScoreSubmit } from '../../lib/useScoreSubmit'

const ROUND_SECONDS = 30
const VISIBLE_WORDS = 6

const EASY_WORDS = [
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can',
  'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him',
  'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who',
  'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'run',
  'sun', 'sea', 'sky', 'red', 'cat', 'dog', 'car', 'box', 'cup', 'egg',
  'eye', 'arm', 'leg', 'ear', 'ice', 'key', 'map', 'net', 'pen', 'pin',
  'pot', 'rag', 'rim', 'rod', 'rug', 'tub', 'wax', 'web', 'zip', 'ace',
  'act', 'add', 'age', 'air', 'ask', 'bad', 'bag', 'bar', 'bat', 'bay',
  'bed', 'bee', 'bet', 'bid', 'big', 'bin', 'bit', 'bow', 'bud', 'bug',
  'bun', 'bus', 'cab', 'cap', 'cow', 'cub', 'cut', 'dad', 'den', 'dig',
  'dim', 'dip', 'dot', 'dry', 'eat', 'end', 'fan', 'far', 'fat', 'fee',
  'few', 'fig', 'fin', 'fit', 'fix', 'fly', 'fog', 'fox', 'fry', 'fur',
  'gas', 'gem', 'gum', 'gun', 'gym', 'ham', 'hat', 'hay', 'hen', 'hid',
  'hip', 'hit', 'hop', 'hot', 'hug', 'hut', 'jam', 'jar', 'jaw', 'jet',
  'joy', 'kid', 'kit', 'lab', 'lad', 'lap', 'law', 'lay', 'lid', 'log',
]

const MEDIUM_WORDS = [
  'quick', 'brown', 'jumps', 'speed', 'sharp', 'focus', 'level', 'skill',
  'pixel', 'arena', 'combo', 'streak', 'target', 'ready', 'start', 'burst',
  'flare', 'glide', 'surge', 'blaze', 'orbit', 'vector', 'vault', 'water',
  'house', 'music', 'light', 'table', 'chair', 'phone', 'cloud', 'storm',
  'river', 'green', 'white', 'black', 'small', 'large', 'world', 'heart',
  'dream', 'smile', 'laugh', 'dance', 'climb', 'floor', 'stone', 'grass',
  'earth', 'space', 'magic', 'power', 'flame', 'shine', 'clear', 'bring',
  'catch', 'drive', 'early', 'every', 'field', 'final', 'first', 'found',
  'frame', 'fresh', 'great', 'group', 'guess', 'happy', 'heavy', 'human',
  'image', 'issue', 'judge', 'later', 'leave', 'major', 'might', 'money',
  'month', 'mouth', 'never', 'night', 'north', 'offer', 'often', 'other',
  'paint', 'paper', 'party', 'peace', 'piece', 'place', 'plain', 'plant',
  'plate', 'press', 'print', 'proud', 'prove', 'quiet', 'quite', 'radio',
  'raise', 'reach', 'right', 'round', 'scene', 'sense', 'serve', 'seven',
  'share', 'short', 'sight', 'since', 'sleep', 'sound', 'south', 'speak',
  'spell', 'spend', 'sport', 'staff', 'stage', 'stand', 'state', 'steam',
  'steel', 'store', 'story', 'study', 'sweet', 'taste', 'teach', 'theme',
  'think', 'third', 'those', 'three', 'throw', 'tight', 'today', 'total',
  'touch', 'tough', 'trade', 'trail', 'train', 'treat',
]

const HARD_WORDS = [
  'keyboard', 'champion', 'equation', 'computer', 'internet', 'complete',
  'question', 'solution', 'together', 'anything', 'everyone', 'freedom',
  'forward', 'history', 'justice', 'journey', 'million', 'morning',
  'natural', 'nothing', 'picture', 'popular', 'problem', 'program',
  'provide', 'quality', 'quickly', 'reality', 'realize', 'receive',
  'remember', 'science', 'several', 'silence', 'special', 'station',
  'success', 'surface', 'teacher', 'thought', 'through', 'tonight',
  'trouble', 'universe', 'victory', 'weather', 'welcome', 'whether',
  'without', 'balance', 'believe', 'benefit', 'careful', 'capture',
  'certain', 'compare', 'connect', 'control', 'courage', 'culture',
  'current', 'curious', 'decimal', 'despite', 'develop', 'diamond',
  'digital', 'discuss', 'distance', 'educate', 'element', 'endless',
  'enhance', 'evening', 'exactly', 'examine', 'example', 'explore',
  'factory', 'feeling', 'forever', 'fortune', 'general', 'genuine',
  'goodbye', 'gradual', 'gravity', 'horizon', 'imagine', 'improve',
  'include', 'inspect', 'instead', 'instant', 'interest', 'kitchen',
  'liberty', 'library', 'logical', 'machine', 'manager', 'maximum',
  'meaning', 'measure', 'mechanic', 'meeting', 'mention', 'message',
  'minimum', 'mystery', 'network', 'nowhere', 'observe', 'obvious',
  'officer', 'opinion', 'organic', 'outline', 'patient', 'perfect',
]

export default function TypingSprint() {
  const [round, setRound] = useState<string[]>(() => generateRound())
  const [doneWords, setDoneWords] = useState<number>(0)
  const [typed, setTyped] = useState('')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [correctChars, setCorrectChars] = useState(0)
  const { submit, submitting, feedback, resetTimer, undo } = useScoreSubmit('typing')
  const inputRef = useRef<HTMLInputElement>(null)
  const countRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(interval)
          finish()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const finish = () => {
    setRunning(false)
    setFinished(true)
    submit(countRef.current)
  }

  const currentWord = round[doneWords]
  const isCurrentCorrect = currentWord ? currentWord.startsWith(typed) : false

  const wpm = useMemo(() => {
    if (doneWords === 0) return 0
    const elapsed = ROUND_SECONDS - timeLeft
    return Math.round((correctChars / 5 / Math.max(1, elapsed)) * 60)
  }, [correctChars, timeLeft, doneWords])

  const handleInput = (value: string) => {
    if (!running || finished) return
    if (value.endsWith(' ')) {
      const word = value.trim()
      if (word === currentWord) {
        countRef.current += currentWord.length
        setCorrectChars(countRef.current)
        setDoneWords((d) => {
          const next = d + 1
          if (next === round.length) {
            const more = generateRound()
            setRound((prev) => [...prev, ...more])
            return d
          }
          return next
        })
        setTyped('')
      } else {
        setTyped(word)
      }
    } else {
      setTyped(value.replace(/\s/g, ''))
    }
  }

  const start = () => {
    setRound(generateRound())
    setDoneWords(0)
    setTyped('')
    setCorrectChars(0)
    countRef.current = 0
    setTimeLeft(ROUND_SECONDS)
    setFinished(false)
    setRunning(true)
    resetTimer()
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const currentWordClass = typed && !isCurrentCorrect ? 'error' : 'current'

  return (
    <div className="typing-stage">
      <GameHud
        stats={[
          { label: 'WPM', value: wpm },
          { label: 'Chars', value: correctChars },
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

      <div className="typing-target" aria-label="Words to type">
        {round.slice(doneWords, doneWords + VISIBLE_WORDS).map((word, i) => {
          const isCurrent = i === 0
          return (
            <span
              key={`${doneWords + i}-${word}`}
              className={`typing-word${!isCurrent ? ' done' : ''}${isCurrent ? ` ${currentWordClass}` : ''}`}
            >
              {word}
            </span>
          )
        })}
      </div>

      <input
        ref={inputRef}
        className="typing-input"
        value={typed}
        onChange={(e) => handleInput(e.target.value)}
        placeholder={running ? 'Type the highlighted word, then space' : 'Start the round to begin typing'}
        disabled={!running || finished}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Typing input"
      />

      {finished && (
        <p className="status" role="status">
          Time! {doneWords} words · {correctChars} chars · {wpm} WPM
        </p>
      )}
      {submitting && <p className="status">Submitting…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} />
    </div>
  )
}

function shuffle(list: string[]): string[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

function generateRound(): string[] {
  const easy = shuffle(EASY_WORDS).slice(0, 12)
  const medium = shuffle(MEDIUM_WORDS).slice(0, 12)
  const hard = shuffle(HARD_WORDS).slice(0, 6)
  return shuffle([...easy, ...medium, ...hard])
}
