import React, { useEffect, useState } from 'react'
import { useBackground } from './contexts/BackgroundContext'

export const BackgroundWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { background } = useBackground()
  const [renderKey, setRenderKey] = useState(0)

  // Force re-render when background changes
  useEffect(() => {
    setRenderKey(prev => prev + 1)
  }, [background.id, background.url])

  // Create a unique key that includes both id and a hash of url to force re-render
  // Use a simple hash for long base64 strings
  const urlHash = background.url.length > 100 
    ? `${background.url.substring(0, 50)}-${background.url.length}` 
    : background.url

  // Apply background to document body and html to ensure it covers everything
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    
    if (background.id === 'gradient') {
      html.style.setProperty('background-image', 'none', 'important')
      html.style.setProperty('background-color', 'transparent', 'important')
      body.style.setProperty('background-image', 'none', 'important')
      body.style.setProperty('background-color', 'transparent', 'important')
      body.classList.remove('bg-background')
    } else {
      html.style.setProperty('background-image', `url(${background.url})`, 'important')
      html.style.setProperty('background-size', 'cover', 'important')
      html.style.setProperty('background-position', 'center', 'important')
      html.style.setProperty('background-repeat', 'no-repeat', 'important')
      html.style.setProperty('background-attachment', 'fixed', 'important')
      
      body.style.setProperty('background-image', `url(${background.url})`, 'important')
      body.style.setProperty('background-size', 'cover', 'important')
      body.style.setProperty('background-position', 'center', 'important')
      body.style.setProperty('background-repeat', 'no-repeat', 'important')
      body.style.setProperty('background-attachment', 'fixed', 'important')
      body.classList.remove('bg-background')
    }
    
    return () => {
      html.style.removeProperty('background-image')
      html.style.removeProperty('background-color')
      html.style.removeProperty('background-size')
      html.style.removeProperty('background-position')
      html.style.removeProperty('background-repeat')
      html.style.removeProperty('background-attachment')
      
      body.style.removeProperty('background-image')
      body.style.removeProperty('background-color')
      body.style.removeProperty('background-size')
      body.style.removeProperty('background-position')
      body.style.removeProperty('background-repeat')
      body.style.removeProperty('background-attachment')
    }
  }, [background.id, background.url])

  return (
    <div className="min-h-screen relative">
      {/* Fixed background with smooth transition */}
      {background.id !== 'gradient' && (
        <div
          key={`bg-${background.id}-${renderKey}-${urlHash.substring(0, 50)}`}
          className="fixed inset-0 z-0 bg-cover bg-center opacity-80 dark:opacity-60 transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${background.url})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        />
      )}
      
      {/* Gradient overlay with smooth transition - reduced opacity for better visibility */}
      <div 
        key={`overlay-${background.id}-${renderKey}`}
        className={`fixed inset-0 z-0 transition-all duration-700 ease-in-out ${
          background.id === 'gradient' 
            ? 'bg-gradient-to-br from-slate-300 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800'
            : 'bg-gradient-to-br from-white/30 to-white/20 dark:from-gray-900/40 dark:to-gray-800/30'
        }`} 
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}