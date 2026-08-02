import { useState } from 'react'

interface FirstTimeTipProps {
  storageKey: string
  children: React.ReactNode
}

export function FirstTimeTip({ storageKey, children }: FirstTimeTipProps) {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(storageKey)
    } catch {
      return false
    }
  })

  if (!visible) return null

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      /* storage unavailable — ignore */
    }
    setVisible(false)
  }

  return (
    <div className="game-tip" role="status">
      <span aria-hidden>💡</span>
      <span>{children}</span>
      <button type="button" onClick={dismiss} aria-label="Dismiss tip">
        ✕
      </button>
    </div>
  )
}
