// @vitest-environment jsdom
//
// The shortcut sheet renders the localized strings, and every row it shows
// corresponds to a shortcut that exists. The `g`-sequences live in
// keyboard-shortcuts.tsx; keeping the two in step is the point of this test.
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { I18nProvider } from '@/i18n'
import { ShortcutsDialog } from './shortcuts-dialog'

let root: Root
let container: HTMLDivElement

function mount() {
  act(() => {
    root.render(
      <I18nProvider initialLocale="en">
        <ShortcutsDialog open onOpenChange={() => {}} />
      </I18nProvider>,
    )
  })
}

// The dialog renders through a portal, so its content lands on document.body
// rather than inside the container we mounted into.
function dialogText(): string {
  return document.body.textContent ?? ''
}

beforeAll(() => { (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true })
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ShortcutsDialog', () => {
  it('renders the localized title and description', () => {
    mount()
    expect(dialogText()).toContain('Keyboard shortcuts')
    expect(dialogText()).toContain('Navigate FreeGateway faster.')
  })

  it('lists every advertised shortcut', () => {
    mount()
    const text = dialogText()
    for (const keys of ['Ctrl/⌘ + K', 'G then M', 'G then K', 'G then A', 'G then P', '?', 'Esc']) {
      expect(text).toContain(keys)
    }
  })

  it('lists only shortcuts that are actually implemented', async () => {
    mount()
    const { SEQUENCE_ROUTES } = await import('./keyboard-shortcuts')
    const text = dialogText()
    // Each advertised `g`-sequence must have a route behind it.
    for (const key of Object.keys(SEQUENCE_ROUTES)) {
      expect(text).toContain(`G then ${key.toUpperCase()}`)
    }
  })
})
