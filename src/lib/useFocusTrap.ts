import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

// Focus management for modals/sheets: focuses the dialog when it opens, traps
// Tab/Shift+Tab inside it, and restores focus to the trigger element on close.
export function useFocusTrap<T extends HTMLElement>(active: boolean): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    el.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement
      if (e.shiftKey) {
        if (current === first || current === el || !el.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else if (current === last || current === el || !el.contains(current)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [active])

  return ref
}
