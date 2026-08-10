// Store para manejo de tema (light | dark | system)
// Compatible con macOS, Windows, iOS y Android vía prefers-color-scheme
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'uniacc-theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  try {
    return window.matchMedia(MEDIA_QUERY).matches
  } catch {
    return false
  }
}

function parseStoredThemeMode(value: string | null): ThemeMode {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value
  }
  // Sin preferencia → seguir sistema (macOS / Windows / móvil)
  return 'system'
}

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)
  const themeMode = ref<ThemeMode>('system')
  const primaryColor = ref('uniacc-blue')
  const accentColor = ref('uniacc-pink')

  let mediaQueryList: MediaQueryList | null = null
  let mediaListener: ((event: MediaQueryListEvent) => void) | null = null

  const resolveIsDark = (mode: ThemeMode = themeMode.value): boolean => {
    if (mode === 'dark') return true
    if (mode === 'light') return false
    return getSystemPrefersDark()
  }

  const applyDarkClass = (dark: boolean) => {
    isDark.value = dark
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.toggle('dark', dark)
    // Navegadores (iOS Safari, Chrome Android, Edge): controles nativos coherentes
    root.style.colorScheme = dark ? 'dark' : 'light'

    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute('content', dark ? '#0f172a' : '#000000')
    }
  }

  const detachSystemListener = () => {
    if (!mediaQueryList || !mediaListener) {
      mediaQueryList = null
      mediaListener = null
      return
    }

    if (typeof mediaQueryList.removeEventListener === 'function') {
      mediaQueryList.removeEventListener('change', mediaListener)
    } else if (typeof mediaQueryList.removeListener === 'function') {
      // Safari / iOS antiguos
      mediaQueryList.removeListener(mediaListener)
    }

    mediaQueryList = null
    mediaListener = null
  }

  const attachSystemListener = () => {
    detachSystemListener()

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    if (themeMode.value !== 'system') {
      return
    }

    try {
      mediaQueryList = window.matchMedia(MEDIA_QUERY)
    } catch {
      return
    }

    mediaListener = (event: MediaQueryListEvent) => {
      if (themeMode.value === 'system') {
        applyDarkClass(event.matches)
      }
    }

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', mediaListener)
    } else if (typeof mediaQueryList.addListener === 'function') {
      // Safari / iOS antiguos
      mediaQueryList.addListener(mediaListener)
    }
  }

  const persistThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // private mode / storage bloqueado en algunos móviles
    }
    applyDarkClass(resolveIsDark(mode))
    attachSystemListener()
  }

  const initializeTheme = () => {
    let savedTheme: string | null = null
    try {
      savedTheme = localStorage.getItem(STORAGE_KEY)
    } catch {
      savedTheme = null
    }

    const savedPrimary = (() => {
      try {
        return localStorage.getItem('uniacc-primary-color')
      } catch {
        return null
      }
    })()
    const savedAccent = (() => {
      try {
        return localStorage.getItem('uniacc-accent-color')
      } catch {
        return null
      }
    })()

    themeMode.value = parseStoredThemeMode(savedTheme)
    applyDarkClass(resolveIsDark(themeMode.value))
    attachSystemListener()

    if (savedPrimary) {
      primaryColor.value = savedPrimary
    }

    if (savedAccent) {
      accentColor.value = savedAccent
    }
  }

  /**
   * Ciclo: system → dark → light → system
   * Así el usuario puede volver a "seguir el dispositivo" en móvil, Windows y macOS.
   */
  const toggleTheme = () => {
    const order: ThemeMode[] = ['system', 'dark', 'light']
    const currentIndex = order.indexOf(themeMode.value)
    const next = order[(currentIndex + 1) % order.length]
    persistThemeMode(next)
  }

  const setTheme = (theme: 'light' | 'dark') => {
    persistThemeMode(theme)
  }

  const setThemeMode = (mode: ThemeMode) => {
    persistThemeMode(mode)
  }

  const setPrimaryColor = (color: string) => {
    primaryColor.value = color
    try {
      localStorage.setItem('uniacc-primary-color', color)
    } catch {
      /* ignore */
    }
  }

  const setAccentColor = (color: string) => {
    accentColor.value = color
    try {
      localStorage.setItem('uniacc-accent-color', color)
    } catch {
      /* ignore */
    }
  }

  const getAvailableColors = () => [
    { name: 'Azul UNIACC', value: 'uniacc-blue', color: '#0056B3' },
    { name: 'Rosa UNIACC', value: 'uniacc-pink', color: '#FF007F' },
    { name: 'Verde UNIACC', value: 'uniacc-green', color: '#00FF00' },
    { name: 'Naranja UNIACC', value: 'uniacc-orange', color: '#FF6B35' }
  ]

  const applyColors = () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--primary-color', `var(--${primaryColor.value})`)
    root.style.setProperty('--accent-color', `var(--${accentColor.value})`)
  }

  watch([primaryColor, accentColor], () => {
    applyColors()
  }, { immediate: true })

  return {
    isDark,
    themeMode,
    primaryColor,
    accentColor,
    initializeTheme,
    toggleTheme,
    setTheme,
    setThemeMode,
    setPrimaryColor,
    setAccentColor,
    getAvailableColors,
    applyColors,
    resolveIsDark
  }
})
