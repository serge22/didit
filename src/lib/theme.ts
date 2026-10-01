import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionQueryOptions } from './session'

// Like the date format, the choice lives in the user's Supabase auth `user_metadata.theme`
// so it follows them across devices. It's also mirrored to localStorage under
// THEME_STORAGE_KEY, which the inline script in index.html reads to pick the right
// theme before React loads (no light flash), and which covers the signed-out login page.

export const THEME_STORAGE_KEY = 'didit-theme'

export const THEMES = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
} satisfies Record<string, string>

export type Theme = keyof typeof THEMES

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && value in THEMES
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme(): Theme {
  const { data: session } = useQuery(sessionQueryOptions)
  if (!session) return readStoredTheme()
  const stored = session.user.user_metadata.theme
  return isTheme(stored) ? stored : 'system'
}

/** Keeps the `dark` class on <html> in sync with the user's theme. Mount once, near the app root. */
export function useApplyTheme() {
  const theme = useTheme()

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Storage unavailable (e.g. private mode) — the theme still applies for this visit.
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}
