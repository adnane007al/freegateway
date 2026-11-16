import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Global keyboard shortcuts.
//
// Ctrl/⌘+K (command palette) and Escape live with the palette itself; this
// component owns the rest: `?` opens the shortcut sheet, and a `g`-prefixed
// sequence jumps between the main sections.
//
// The `g` prefix is disarmed after SEQUENCE_TIMEOUT_MS so a stray `g` typed
// in passing does not swallow the next keystroke. Keystrokes inside a text
// field are ignored entirely — typing "good" in the playground must never
// navigate away from it.

/** How long `g` stays armed waiting for the second key. */
const SEQUENCE_TIMEOUT_MS = 1500

/** Second key of a `g`-sequence → destination. */
export const SEQUENCE_ROUTES: Record<string, string> = {
  m: '/models/chat',
  k: '/keys',
  a: '/analytics',
  p: '/playground',
}

export function KeyboardShortcuts({ onShowHelp }: { onShowHelp: () => void }) {
  const navigate = useNavigate()
  const armedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const disarm = useCallback(() => {
    armedRef.current = false
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      // Leave browser and OS chords alone.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      if (armedRef.current) {
        const route = SEQUENCE_ROUTES[key]
        disarm()
        if (route) {
          e.preventDefault()
          navigate(route)
        }
        return
      }

      if (key === 'g') {
        armedRef.current = true
        timerRef.current = setTimeout(disarm, SEQUENCE_TIMEOUT_MS)
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        onShowHelp()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      disarm()
    }
  }, [navigate, onShowHelp, disarm])

  return null
}
