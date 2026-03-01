import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { themes, getThemeById, applyTheme, type Theme, type ThemeColors } from '@/lib/themes'

interface ThemeContextType {
  currentTheme: Theme
  allThemes: Theme[]
  customThemes: Theme[]
  setTheme: (id: string) => void
  saveCustomTheme: (name: string, colors: ThemeColors) => void
  deleteCustomTheme: (id: string) => void
}

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: themes[0],
  allThemes: themes,
  customThemes: [],
  setTheme: () => {},
  saveCustomTheme: () => {},
  deleteCustomTheme: () => {}
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])
  const [customThemes, setCustomThemes] = useState<Theme[]>([])

  useEffect(() => {
    // Load saved theme on mount
    async function loadTheme() {
      const savedId = (await window.api.getSettings('themeId')) as string | undefined
      const savedCustom = (await window.api.getSettings('customThemes')) as Theme[] | undefined

      if (savedCustom) setCustomThemes(savedCustom)

      const allAvailable = [...themes, ...(savedCustom || [])]
      const theme = savedId ? allAvailable.find((t) => t.id === savedId) || themes[0] : themes[0]
      setCurrentTheme(theme)
      applyTheme(theme)
    }
    loadTheme()
  }, [])

  const setTheme = useCallback(
    (id: string) => {
      setCustomThemes((prevCustom) => {
        const allAvailable = [...themes, ...prevCustom]
        const theme = allAvailable.find((t) => t.id === id) || themes[0]
        setCurrentTheme(theme)
        applyTheme(theme)
        window.api.setSettings('themeId', id)
        return prevCustom
      })
    },
    []
  )

  const saveCustomTheme = useCallback(
    (name: string, colors: ThemeColors) => {
      const id = `custom-${Date.now()}`
      const newTheme: Theme = { id, name, colors }
      setCustomThemes((prev) => {
        const updated = [...prev, newTheme]
        window.api.setSettings('customThemes', updated)
        return updated
      })
    },
    []
  )

  const deleteCustomTheme = useCallback(
    (id: string) => {
      setCustomThemes((prev) => {
        const updated = prev.filter((t) => t.id !== id)
        window.api.setSettings('customThemes', updated)
        return updated
      })
      setCurrentTheme((prev) => {
        if (prev.id === id) {
          const fallback = themes[0]
          applyTheme(fallback)
          window.api.setSettings('themeId', fallback.id)
          return fallback
        }
        return prev
      })
    },
    []
  )

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        allThemes: [...themes, ...customThemes],
        customThemes,
        setTheme,
        saveCustomTheme,
        deleteCustomTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
