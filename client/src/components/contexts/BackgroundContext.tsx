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

const defaultBackground = {
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
  // Get background from localStorage or use default
  const getStoredBackground = () => {
    const stored = localStorage.getItem('background-preference')
    return stored ? JSON.parse(stored) : defaultBackground
  }

  const [background, setBackground] = useState<Background>(getStoredBackground())

  // Apply background whenever it changes
  useEffect(() => {
    const root = document.documentElement
    if (background.id === 'gradient') {
      root.style.removeProperty('background-image')
    } else {
      root.style.setProperty('--background-image', `url(${background.url})`)
    }
    localStorage.setItem('background-preference', JSON.stringify(background))
  }, [background])

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  )
}