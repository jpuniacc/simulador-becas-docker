import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../themeStore'

describe('themeStore', () => {
  const storage = new Map<string, string>()
  let mediaMatches = false
  let changeHandler: ((event: MediaQueryListEvent) => void) | null = null

  const localStorageMock = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    }
  }

  beforeEach(() => {
    storage.clear()
    mediaMatches = false
    changeHandler = null
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: mediaMatches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          changeHandler = handler
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })

    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('sin preferencia guardada usa el sistema (oscuro)', () => {
    mediaMatches = true
    const store = useThemeStore()
    store.initializeTheme()

    expect(store.themeMode).toBe('system')
    expect(store.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('sin preferencia guardada usa el sistema (claro)', () => {
    mediaMatches = false
    const store = useThemeStore()
    store.initializeTheme()

    expect(store.themeMode).toBe('system')
    expect(store.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('respeta preferencia manual light aunque el SO esté en oscuro', () => {
    mediaMatches = true
    localStorage.setItem('uniacc-theme', 'light')
    const store = useThemeStore()
    store.initializeTheme()

    expect(store.themeMode).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('toggleTheme cicla system → dark → light → system', () => {
    mediaMatches = true
    const store = useThemeStore()
    store.initializeTheme()
    expect(store.themeMode).toBe('system')
    expect(store.isDark).toBe(true)

    store.toggleTheme()
    expect(store.themeMode).toBe('dark')
    expect(store.isDark).toBe(true)

    store.toggleTheme()
    expect(store.themeMode).toBe('light')
    expect(store.isDark).toBe(false)

    store.toggleTheme()
    expect(store.themeMode).toBe('system')
    expect(store.isDark).toBe(true)
  })

  it('en modo system reacciona a cambios del SO', () => {
    mediaMatches = false
    const store = useThemeStore()
    store.initializeTheme()
    expect(store.isDark).toBe(false)

    expect(changeHandler).toBeTruthy()
    changeHandler?.({ matches: true } as MediaQueryListEvent)

    expect(store.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setThemeMode(system) vuelve a seguir el SO', () => {
    mediaMatches = true
    const store = useThemeStore()
    store.initializeTheme()
    store.setTheme('light')
    expect(store.isDark).toBe(false)

    store.setThemeMode('system')
    expect(store.themeMode).toBe('system')
    expect(store.isDark).toBe(true)
  })
})
