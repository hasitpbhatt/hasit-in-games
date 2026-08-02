import { useCallback, useEffect, useRef, useState } from 'react'
import { GameHud } from '../../components/GameHud'
import { ScoreBanner } from './ScoreBanner'
import { FirstTimeTip } from '../../components/FirstTimeTip'
import { ParticleBurst } from '../../components/ParticleBurst'
import { FrogMascot } from '../../components/FrogMascot'
import { useScoreSubmit } from '../../lib/useScoreSubmit'
import { vibrate } from '../../lib/haptics'

const PADS = 9
const ROUND_SECONDS = 60
const START_LIVES = 3
const BASE_CHARGE_MS = 1400
const MIN_CHARGE_MS = 700
const BAND_START = 20
const BAND_END = 12
const FALL_CHARGE = 40
const STORAGE_KEY = 'hasit-games-toadhop-best'

type Phase = 'idle' | 'charging' | 'landing' | 'over'

export default function ToadHop() {
  const { submit, submitting, feedback, resetTimer, undo, undoing } = useScoreSubmit('toadhop')

  const [phase, setPhase] = useState<Phase>('idle')
  const [pad, setPad] = useState(0)
  const [lit, setLit] = useState<boolean[]>(() => Array(PADS).fill(false))
  const [lives, setLives] = useState(START_LIVES)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [perfects, setPerfects] = useState(0)
  const [charge, setCharge] = useState(0)
  const [inBand, setInBand] = useState(false)
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEY) ?? 0))
  const [isNewBest, setIsNewBest] = useState(false)

  const timeStartRef = useRef(0)
  const chargeRef = useRef(0)
  const rafRef = useRef(0)
  const chargingRef = useRef(false)
  const inBandRef = useRef(false)
  const endedRef = useRef(false)
  const perfectsRef = useRef(0)
  const livesRef = useRef(START_LIVES)

  const elapsedSeconds = () => (Date.now() - timeStartRef.current) / 1000
  const bandWidth = () => {
    const t = Math.min(1, elapsedSeconds() / ROUND_SECONDS)
    return BAND_START - (BAND_START - BAND_END) * t
  }
  const chargeMs = () => {
    const t = Math.min(1, elapsedSeconds() / ROUND_SECONDS)
    return BASE_CHARGE_MS - (BASE_CHARGE_MS - MIN_CHARGE_MS) * t
  }

  const endRound = useCallback(() => {
    if (endedRef.current) return
    endedRef.current = true
    chargingRef.current = false
    cancelAnimationFrame(rafRef.current)
    const score = perfectsRef.current
    const newBest = score > Number(localStorage.getItem(STORAGE_KEY) ?? 0)
    if (newBest) {
      localStorage.setItem(STORAGE_KEY, String(score))
      setBest(score)
    }
    setIsNewBest(newBest)
    setPhase('over')
    submit(score)
  }, [submit])

  const start = useCallback(() => {
    resetTimer()
    timeStartRef.current = Date.now()
    endedRef.current = false
    perfectsRef.current = 0
    livesRef.current = START_LIVES
    setPad(0)
    setLit(Array(PADS).fill(false))
    setLives(START_LIVES)
    setTimeLeft(ROUND_SECONDS)
    setPerfects(0)
    setCharge(0)
    setInBand(false)
    setPhase('idle')
  }, [resetTimer])

  useEffect(() => {
    if (phase === 'over') return
    const id = window.setInterval(() => {
      const left = Math.max(0, ROUND_SECONDS - elapsedSeconds())
      setTimeLeft(left)
      if (left <= 0) endRound()
    }, 500)
    return () => window.clearInterval(id)
  }, [phase, endRound])

  const startCharge = useCallback(() => {
    // The ref guard blocks the double-fire when both the window keydown and
    // the focused element's own handler run for the same Space press — two
    // rAF loops would otherwise double the charge rate.
    if (phase !== 'idle' || chargingRef.current) return
    chargingRef.current = true
    inBandRef.current = false
    chargeRef.current = 0
    setCharge(0)
    setPhase('charging')
    let last = performance.now()
    const tick = (now: number) => {
      if (!chargingRef.current) return
      const dt = Math.min(64, now - last)
      last = now
      chargeRef.current = Math.min(100, chargeRef.current + (dt / chargeMs()) * 100)
      const inBandNow = chargeRef.current >= 100 - bandWidth()
      setCharge(chargeRef.current)
      setInBand(inBandNow)
      if (inBandNow && !inBandRef.current) vibrate(12)
      inBandRef.current = inBandNow
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [phase])

  const release = useCallback(() => {
    if (phase !== 'charging' || !chargingRef.current) return
    chargingRef.current = false
    cancelAnimationFrame(rafRef.current)
    const c = chargeRef.current
    const nextPerfects = c >= 100 - bandWidth() ? perfectsRef.current + 1 : perfectsRef.current
    const nextLives = c < FALL_CHARGE ? livesRef.current - 1 : livesRef.current
    perfectsRef.current = nextPerfects
    livesRef.current = nextLives

    if (c >= 100 - bandWidth()) {
      setPerfects(nextPerfects)
      setLit((prev) => {
        const n = [...prev]
        n[pad] = true
        return n
      })
      vibrate(40)
    } else if (c >= FALL_CHARGE) {
      vibrate(10)
    } else {
      setLives(nextLives)
      vibrate([60, 40, 60])
    }
    setPhase('landing')
    window.setTimeout(() => {
      if (nextLives <= 0) {
        endRound()
        return
      }
      setCharge(0)
      setInBand(false)
      setPad((p) => (p + 1) % PADS)
      setPhase('idle')
    }, 320)
  }, [phase, pad, endRound])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        startCharge()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        release()
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [startCharge, release])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const bw = phase === 'over' ? BAND_START : bandWidth()

  return (
    <div className="game-stage toadhop">
      <GameHud
        stats={[
          { label: 'Perfects', value: perfects.toLocaleString() },
          { label: 'Lives', value: '🐸'.repeat(Math.max(0, lives)) || '—' },
        ]}
        timer={{ value: Math.max(0, Math.round(timeLeft)), max: ROUND_SECONDS }}
        action={
          <button className="btn btn-ghost" onClick={start}>
            New round
          </button>
        }
      />

      <div className="toad-pond">
        <div className="toad-wire" aria-hidden />
        <div className="toad-pads">
          {Array.from({ length: PADS }, (_, i) => (
            <div
              key={i}
              className={`toad-pad${lit[i] ? ' lit' : ''}${i === pad && phase !== 'over' ? ' current' : ''}`}
              aria-hidden
            >
              {i === pad && phase !== 'over' && <FrogMascot className="toad-pad-frog" />}
              {lit[i] && <span className="toad-pad-check">✦</span>}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`toad-charge${phase === 'charging' ? ' is-charging' : ''}${inBand ? ' in-band' : ''}`}
        onPointerDown={(e) => {
          // Capture so the release registers even if the finger drifts off the
          // element — otherwise a stray pointerleave would drop the charge early.
          e.currentTarget.setPointerCapture?.(e.pointerId)
          startCharge()
        }}
        onPointerUp={release}
        onPointerCancel={release}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            if (e.key === ' ') startCharge()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ') {
            e.preventDefault()
            release()
          }
        }}
        aria-label="Hold to charge the leap, release to hop"
      >
        <div className="toad-meter">
          <div className="toad-meter-fill" style={{ width: `${charge}%` }} />
          <div className="toad-band" style={{ width: `${bw}%` }} aria-hidden />
        </div>
        <FrogMascot className={`toad-frog${phase === 'charging' ? ' squash' : ''}`} />
        <p className="toad-hint">
          {phase === 'idle'
            ? 'Hold to charge · release to hop'
            : phase === 'charging'
              ? inBand
                ? 'Perfect zone — release!'
                : 'Charge the leap…'
              : 'Nice hop.'}
        </p>
      </div>

      {submitting && <p className="status">Re-syncing the circuit…</p>}
      <ScoreBanner feedback={feedback} onUndo={undo} undoing={undoing} />
      <FirstTimeTip storageKey="hasit-games-toadhop-tip">
        Hold to charge the frog's legs, release inside the glowing band for a perfect landing.
        Three falls ends the round.
      </FirstTimeTip>

      {phase === 'over' && (
        <>
          {isNewBest && <ParticleBurst />}
          <div className="overlay" role="dialog" aria-modal="true" aria-label="Round over">
            <div className="modal">
              <h2>{isNewBest ? 'New personal best!' : 'The lily circuit goes dark'}</h2>
              <div className="modal-score">{perfects.toLocaleString()} perfects</div>
              <p className="modal-sub">
                {isNewBest
                  ? 'The arcade remembers you — best run yet.'
                  : `Best: ${best.toLocaleString()} perfects.`}
              </p>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={start} autoFocus>
                  Hop again
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
