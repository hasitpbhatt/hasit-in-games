import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFocusTrap } from '../lib/useFocusTrap'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  ariaLabel?: string
}

const DRAG_THRESHOLD = 120

export function BottomSheet({ open, onClose, children, ariaLabel = 'Bottom sheet' }: BottomSheetProps) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<number>(0)
  const sheetRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) {
      setOffset(0)
      return
    }
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const onPointerDown = (e: React.PointerEvent) => {
    // Only the sheet frame (grabber / empty space) drags to close; presses
    // inside the scrollable content must scroll, not slide the sheet.
    if ((e.target as HTMLElement).closest('.sheet-content')) return
    setDragging(true)
    dragStart.current = e.clientY
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const delta = e.clientY - dragStart.current
    setOffset(Math.max(0, delta))
  }

  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    if (offset > DRAG_THRESHOLD) {
      onClose()
    } else {
      setOffset(0)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose} role="presentation">
      <div
        ref={sheetRef}
        className={`sheet${dragging ? ' sheet-dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ transform: `translateY(${offset}px)` }}
      >
        <div className="sheet-grabber" aria-hidden />
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="sheet-content">{children}</div>
      </div>
    </div>
  )
}
