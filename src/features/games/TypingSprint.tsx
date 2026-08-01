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
  'bun', 'bus', 'cab', 'cam', 'cap', 'cob', 'cod', 'cog', 'con', 'cop',
  'cot', 'cow', 'cub', 'cut', 'dad', 'den', 'dew', 'dig', 'dim', 'dip',
  'doe', 'dot', 'dry', 'dug', 'dye', 'eat', 'eel', 'elf', 'elk', 'elm',
  'end', 'era', 'eve', 'fan', 'far', 'fat', 'fax', 'fee', 'few', 'fig',
  'fin', 'fir', 'fit', 'fix', 'fly', 'fog', 'fox', 'fry', 'fur', 'gap',
  'gas', 'gem', 'gin', 'gum', 'gun', 'gut', 'gym', 'ham', 'hat', 'hay',
  'hen', 'hid', 'hip', 'hit', 'hoe', 'hog', 'hop', 'hot', 'hue', 'hug',
  'hum', 'hut', 'ill', 'ink', 'inn', 'jam', 'jar', 'jaw', 'jay', 'jet',
  'jig', 'joy', 'jug', 'jut', 'kid', 'kit', 'lab', 'lad', 'lag', 'lap',
  'law', 'lay', 'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low', 'mad',
  'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mop', 'mud', 'mug',
  'nap', 'nod', 'nut', 'oak', 'oat', 'odd', 'ore', 'owe', 'pad', 'pal',
  'pan', 'pat', 'paw', 'pea', 'pet', 'pig', 'pod', 'pop', 'raw', 'ray',
  'rib', 'rid', 'rip', 'rot', 'row', 'rub', 'sad', 'sag', 'sap', 'sat',
  'saw', 'sew', 'shy', 'sin', 'sip', 'sir', 'six', 'ski', 'sob', 'sod',
  'son', 'sow', 'soy', 'spy', 'sum', 'tab', 'tag', 'tan', 'tap', 'tea',
  'ten', 'tie', 'tin', 'tip', 'toe', 'ton', 'top', 'tot', 'tow', 'toy',
  'try', 'tug', 'urn', 'van', 'vet', 'via', 'vow', 'wig', 'win', 'wit',
  'wok', 'wow', 'yet', 'zoo', 'game', 'play', 'earn', 'sing', 'lazy',
]

const MEDIUM_WORDS = [
  'quick', 'brown', 'jumps', 'speed', 'sharp', 'focus', 'level', 'skill',
  'pixel', 'arena', 'combo', 'streak', 'target', 'ready', 'start', 'burst',
  'flare', 'glide', 'surge', 'blaze', 'orbit', 'vector', 'vault', 'water',
  'house', 'music', 'light', 'table', 'chair', 'phone', 'cloud', 'storm',
  'river', 'green', 'white', 'black', 'small', 'large', 'world', 'heart',
  'dream', 'smile', 'laugh', 'dance', 'sing', 'climb', 'floor', 'stone',
  'grass', 'earth', 'space', 'magic', 'power', 'flame', 'shine', 'clear',
  'bring', 'catch', 'drive', 'early', 'every', 'field', 'final', 'first',
  'found', 'frame', 'fresh', 'great', 'group', 'guess', 'happy', 'heavy',
  'human', 'image', 'issue', 'judge', 'later', 'leave', 'major', 'might',
  'money', 'month', 'mouth', 'never', 'night', 'north', 'offer', 'often',
  'other', 'paint', 'paper', 'party', 'peace', 'piece', 'place', 'plain',
  'plant', 'plate', 'press', 'print', 'proud', 'prove', 'quiet', 'quite',
  'radio', 'raise', 'reach', 'right', 'round', 'scene', 'sense', 'serve',
  'seven', 'share', 'short', 'sight', 'since', 'sleep', 'sound', 'south',
  'speak', 'spell', 'spend', 'sport', 'staff', 'stage', 'stand', 'state',
  'steam', 'steel', 'store', 'story', 'study', 'sweet', 'taste', 'teach',
  'theme', 'think', 'third', 'those', 'three', 'throw', 'tight', 'today',
  'total', 'touch', 'tough', 'trade', 'trail', 'train', 'treat', 'trial',
  'trick', 'trust', 'truth', 'under', 'until', 'upper', 'value', 'video',
  'voice', 'watch', 'wheel', 'where', 'which', 'while', 'whole', 'whose',
  'woman', 'worry', 'would', 'write', 'wrong', 'young', 'youth', 'prize',
  'enemy', 'rocket', 'laser', 'quest', 'medal', 'trophy', 'boost', 'armor',
  'board', 'chess', 'arrow', 'match', 'robot', 'ninja', 'cyber', 'pilot',
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
  'perform', 'perhaps', 'plastic', 'precise', 'predict', 'prepare',
  'present', 'preview', 'primary', 'private', 'produce', 'project',
  'promise', 'protect', 'publish', 'purpose', 'pursuit', 'rebuild',
  'refresh', 'regular', 'replace', 'respond', 'restore', 'satisfy',
  'scholar', 'scratch', 'section', 'serious', 'session', 'shelter',
  'shoulder', 'similar', 'sincere', 'society', 'soldier', 'someone',
  'spectrum', 'squeeze', 'stranger', 'student', 'subject', 'succeed',
  'support', 'suppose', 'surprise', 'surround', 'symptom', 'strength',
]

export default function TypingSprint() {
  const [round, setRound] = useState<string[]>(() => generateRound())
  const [doneWords, setDoneWords] = useState<number>(0)
  const [typed, setTyped] = useState('')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [correctChars, setCorrectChars] = useState(0)
  const { submit, submitting, feedback, resetTimer } = useScoreSubmit('typing')
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
      <ScoreBanner feedback={feedback} />
    </div>
  )
}

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)]
}

function generateRound(): string[] {
  const words: string[] = []
  for (let i = 0; i < 30; i++) {
    const roll = Math.random()
    if (roll < 0.4) words.push(pick(EASY_WORDS))
    else if (roll < 0.8) words.push(pick(MEDIUM_WORDS))
    else words.push(pick(HARD_WORDS))
  }
  return words
}
