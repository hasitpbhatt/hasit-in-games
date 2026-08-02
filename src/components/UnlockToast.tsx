import { useEffect, useState } from 'react'
import { useProgress, type NarrativeNotice } from '../store/progress'

export function UnlockToast() {
  const notice = useProgress((s) => s.notice)
  const clearNotice = useProgress((s) => s.clearNotice)
  const [visible, setVisible] = useState(false)

  const active: NarrativeNotice | null =
    notice && (notice.kind === 'achievement' || notice.kind === 'title') ? notice : null

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    setVisible(true)
    const id = window.setTimeout(() => {
      setVisible(false)
      clearNotice()
    }, 4500)
    return () => window.clearTimeout(id)
  }, [active, clearNotice])

  if (!active || !visible) return null

  return (
    <div className="unlock-toast" role="status" aria-live="polite">
      <span className="unlock-toast-label">{active.label}</span>
      <span>{active.text}</span>
      <button type="button" onClick={() => { setVisible(false); clearNotice() }} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
