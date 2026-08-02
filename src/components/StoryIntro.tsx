import { useEffect, useRef, useState } from 'react'
import { FrogMascot } from './FrogMascot'

interface Beat {
  title: string
  sub: string
  croak: string
}

const BEATS: Beat[] = [
  {
    title: 'SkillArcade',
    sub: 'the last arcade on earth',
    croak: 'Heard a keeper walk in. Thought you were a moth.',
  },
  {
    title: 'The Glitch',
    sub: 'Every cabinet holds a game. The Nullmoth drains them one by one.',
    croak: 'Turns skill into static. Don\u2019t let it.',
  },
  {
    title: 'The Deal',
    sub: 'You clean a cabinet by playing it. Skill earns you credits to cash out as PEPE.',
    croak: 'Mop\u2019s optional. Skill isn\u2019t.',
  },
  {
    title: 'Welcome',
    sub: 'Play. Earn. Redeem.',
    croak: 'Welcome, keeper. First cabinet\u2019s free — they always are.',
  },
]

interface StoryIntroProps {
  onDone: () => void
}

export function StoryIntro({ onDone }: StoryIntroProps) {
  const [beat, setBeat] = useState(0)
  const firstRef = useRef<HTMLButtonElement>(null)
  const isLast = beat === BEATS.length - 1

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isLast) onDone()
        else setBeat((b) => b + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone, isLast])

  const b = BEATS[beat]

  return (
    <div className="overlay intro-overlay" role="presentation">
      <div className="modal intro-modal" role="dialog" aria-modal="true" aria-label="The arcade wakes">
        <button className="btn btn-ghost intro-skip" onClick={onDone}>
          Enter the arcade →
        </button>

        <div className="intro-scene" aria-live="polite">
          <h1 className="intro-sign">{b.title}</h1>
          <p className="intro-sub">{b.sub}</p>
        </div>

        <div className="intro-speech">
          <FrogMascot className="intro-frog" />
          <p>{b.croak}</p>
        </div>

        <div className="intro-dots" aria-hidden>
          {BEATS.map((_, i) => (
            <span key={i} className={i === beat ? 'on' : ''} />
          ))}
        </div>

        <div className="modal-actions">
          <button
            ref={firstRef}
            className="btn btn-primary btn-block"
            onClick={() => (isLast ? onDone() : setBeat((x) => x + 1))}
          >
            {isLast ? 'Enter the arcade →' : 'Next →'}
          </button>
          {!isLast && (
            <button className="btn btn-ghost btn-block" onClick={onDone}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
