import { useProgress } from '../store/progress'
import { CHAMBER_ORDER, soulStatus } from '../lib/story'
import { FrogMascot } from './FrogMascot'

export function SoulMeter({ compact }: { compact?: boolean }) {
  const soulPct = useProgress((s) => s.soulPct)
  const purified = useProgress((s) => s.purified)
  const label = `Arcade soul ${soulPct}%`

  return (
    <section className="soul-meter" aria-label={label}>
      <span className="soul-meter-label">
        Arcade soul <strong>{soulPct}%</strong>
      </span>
      <div
        className="soul-meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={soulPct}
        style={{ ['--soul' as string]: `${soulPct}%` }}
      >
        <div className="soul-meter-fill" aria-hidden />
        <div className="soul-meter-ticks" aria-hidden />
        <FrogMascot className="soul-meter-mascot" />
      </div>
      {!compact && (
        <span className="soul-meter-copy">
          {purified.length} of {CHAMBER_ORDER.length} cabinets healed · {soulStatus(soulPct)}
        </span>
      )}
    </section>
  )
}
