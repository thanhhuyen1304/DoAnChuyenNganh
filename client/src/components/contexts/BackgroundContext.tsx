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

    // Helper: get API base URL
    const getApiBase = () => {
      const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const base = raw.replace(/\/+$/g, '')
      if (base.endsWith('/api')) {
        return base
      }
      return `${base}/api`
    }

    // Build storage key: per-user if logged in, otherwise global
    const storageKeyFor = (userId: string | null) => userId ? `background-preference:${userId}` : 'background-preference'

    // Get background from localStorage (per-user if logged in) or use default
    const getStoredBackground = (): Background => {
      try {
        const key = storageKeyFor(getCurrentUserId())
        const stored = localStorage.getItem(key)
        if (!stored) return defaultBackground

        const parsed = JSON.parse(stored)
        // Validate shape to avoid undefined fields
        if (parsed && typeof parsed.id === 'string' && typeof parsed.url === 'string') {
          return {
            id: parsed.id,
            url: parsed.url,
            label: typeof parsed.label === 'string' ? parsed.label : parsed.id,
          }
        }

        return defaultBackground
      } catch (e) {
        console.error('[BackgroundContext] Error parsing stored background, fallback to default:', e)
        return defaultBackground
      }
    }

    const [background, setBackgroundState] = useState<Background>(getStoredBackground())
    const [isLoading, setIsLoading] = useState(true)

    // Load background from backend when user is logged in
    useEffect(() => {
      const loadBackgroundFromBackend = async () => {
        const userId = getCurrentUserId()
        const token = localStorage.getItem('token')
        
        if (!userId || !token) {
          setIsLoading(false)
          return
        }

        try {
          const apiBase = getApiBase()
          const response = await fetch(`${apiBase}/users/me/preferences`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data?.background) {
              const bg = data.data.background
              const newBackground: Background = {
                id: bg.id,
                url: bg.url,
                label: bg.label || bg.id,
              }
              setBackgroundState(newBackground)
              // Also update localStorage
              const key = storageKeyFor(userId)
              localStorage.setItem(key, JSON.stringify(newBackground))
            }
          }
        } catch (error) {
          console.error('[BackgroundContext] Error loading background from backend:', error)
        } finally {
          setIsLoading(false)
        }
      }

      loadBackgroundFromBackend()
    }, [])

    // Wrapper function to sync with backend when setting background
    const setBackground = async (newBackground: Background) => {
      setBackgroundState(newBackground)
      
      const userId = getCurrentUserId()
      const token = localStorage.getItem('token')
      
      // Update localStorage immediately
      const key = storageKeyFor(userId)
      try {
        localStorage.setItem(key, JSON.stringify(newBackground))
      } catch (e) {
        console.error('[BackgroundContext] Error saving to localStorage:', e)
      }

      // Sync with backend if user is logged in
      if (userId && token) {
        try {
          const apiBase = getApiBase()
          const response = await fetch(`${apiBase}/users/me/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              background: newBackground,
            }),
          })
          if (response.ok) {
            console.log('[BackgroundContext] Background synced to backend')
          } else {
            console.warn('[BackgroundContext] Failed to sync background to backend:', response.status)
          }
        } catch (error) {
          console.error('[BackgroundContext] Error syncing background to backend:', error)
        }
      }
    }

    // Apply background whenever it changes
    useEffect(() => {
      if (isLoading) return

      const root = document.documentElement
      if (background.id === 'gradient') {
        root.style.removeProperty('background-image')
      } else {
        root.style.setProperty('--background-image', `url(${background.url})`)
      }
    }, [background, isLoading])

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  )
}