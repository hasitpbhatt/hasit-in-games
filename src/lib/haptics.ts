export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Respect OS-level reduced motion: haptics are motion feedback and should
      // not fire for users who asked for less motion.
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
      navigator.vibrate(pattern)
    }
  } catch {
    /* unsupported or blocked — ignore */
  }
}
