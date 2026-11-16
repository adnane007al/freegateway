// @vitest-environment jsdom
//
// The `g`-sequence shortcuts and the `?` shortcut sheet. These are the
// keyboard affordances the shortcut sheet advertises, so the sheet and the
// behaviour have to agree — a sheet listing a shortcut that does nothing is
// worse than no sheet at all.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { KeyboardShortcuts } from './keyboard-shortcuts'

let root: Root
let container: HTMLDivElement

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="path">{location.pathname}</div>
}

function mount(onShowHelp: () => void) {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/']}>
        <KeyboardShortcuts onShowHelp={onShowHelp} />
        <LocationProbe />
      </MemoryRouter>,
    )
  })
}

function press(key: string, target: EventTarget | null = null) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  ;(target ?? window).dispatchEvent(event)
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
  vi.useRealTimers()
})

describe('KeyboardShortcuts', () => {
  it('opens the shortcut sheet on ?', () => {
    const onShowHelp = vi.fn()
    mount(onShowHelp)
    act(() => press('?'))
    expect(onShowHelp).toHaveBeenCalledTimes(1)
  })

  it('navigates on a g-sequence', () => {
    mount(() => {})
    act(() => press('g'))
    act(() => press('m'))
    expect(container.querySelector('[data-testid="path"]')?.textContent).toBe('/models/chat')
  })

  it('navigates to each g-sequence destination', () => {
    const cases: [string, string][] = [
      ['m', '/models/chat'],
      ['k', '/keys'],
      ['a', '/analytics'],
      ['p', '/playground'],
    ]
    for (const [key, expected] of cases) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const localRoot = createRoot(el)
      act(() => {
        localRoot.render(
          <MemoryRouter initialEntries={['/']}>
            <KeyboardShortcuts onShowHelp={() => {}} />
            <LocationProbe />
          </MemoryRouter>,
        )
      })
      act(() => press('g'))
      act(() => press(key))
      expect(el.querySelector('[data-testid="path"]')?.textContent).toBe(expected)
      act(() => localRoot.unmount())
      el.remove()
    }
  })

  it('ignores keystrokes typed into a text field', () => {
    mount(() => {})
    const input = document.createElement('input')
    document.body.appendChild(input)
    act(() => press('g', input))
    act(() => press('m', input))
    expect(container.querySelector('[data-testid="path"]')?.textContent).toBe('/')
    input.remove()
  })

  it('disarms the g prefix after the timeout', () => {
    vi.useFakeTimers()
    mount(() => {})
    act(() => press('g'))
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => press('m'))
    expect(container.querySelector('[data-testid="path"]')?.textContent).toBe('/')
  })

  it('leaves browser chords alone', () => {
    mount(() => {})
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
    })
    expect(container.querySelector('[data-testid="path"]')?.textContent).toBe('/')
  })
})
