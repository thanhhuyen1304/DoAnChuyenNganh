import React, { createContext, useContext, useState, useEffect } from 'react'

interface Background {
  id: string
  url: string
  label: string
}

interface BackgroundContextType {
  background: Background
  setBackground: (background: Background) => void
}

export const defaultBackground = {
  id: 'default',
  url: new URL('../images/1.jpg', import.meta.url).href,
  label: 'Mặc định'
}

const BackgroundContext = createContext<BackgroundContextType>({
  background: defaultBackground,
  setBackground: () => {}
})

export const useBackground = () => useContext(BackgroundContext)

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Helper: get current logged-in user's id from localStorage (if any)
    const getCurrentUserId = (): string | null => {
      try {
        const raw = localStorage.getItem('user')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed?.id || parsed?._id || null
      } catch (e) {
        return null
      }
    }

    // Build storage key: per-user if logged in, otherwise global
    const storageKeyFor = (userId: string | null) => userId ? `background-preference:${userId}` : 'background-preference'

    // Get background from localStorage (per-user if logged in) or use default
    const getStoredBackground = () => {
      const key = storageKeyFor(getCurrentUserId())
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultBackground
    }

    const [background, setBackground] = useState<Background>(getStoredBackground())

    // Apply background whenever it changes and persist to the appropriate key
    useEffect(() => {
      const root = document.documentElement
      if (background.id === 'gradient') {
        root.style.removeProperty('background-image')
      } else {
        root.style.setProperty('--background-image', `url(${background.url})`)
      }
      const key = storageKeyFor(getCurrentUserId())
      try {
        localStorage.setItem(key, JSON.stringify(background))
      } catch (e) {
        // ignore storage errors
      }
    }, [background])

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  )
}