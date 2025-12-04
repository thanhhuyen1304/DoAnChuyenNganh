import React, { useEffect, useState } from 'react'
import { useBackground } from './contexts/BackgroundContext'

export const BackgroundWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { background } = useBackground()
  const [renderKey, setRenderKey] = useState(0)

  // Force re-render when background changes
  useEffect(() => {
    setRenderKey(prev => prev + 1)
  }, [background?.id, background?.url])

  // Safe-guard: background or background.url might be temporarily undefined if
  // localStorage data is malformed or context hasn't hydrated yet.
  const safeUrl = typeof background?.url === 'string' ? background.url : ''
  const hasBackground = background && background.id !== 'gradient' && safeUrl

  // Use a simple hash for long base64 strings
  const urlHash = safeUrl.length > 100 
    ? `${safeUrl.substring(0, 50)}-${safeUrl.length}` 
    : safeUrl

  // Apply background to document body and html to ensure it covers everything
  // This ensures background is applied globally across all pages
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    
    if (!background || background.id === 'gradient' || !safeUrl) {
      html.style.setProperty('background-image', 'none', 'important')
      html.style.setProperty('background-color', 'transparent', 'important')
      body.style.setProperty('background-image', 'none', 'important')
      body.style.setProperty('background-color', 'transparent', 'important')
      // Remove any background classes that might interfere
      body.classList.remove('bg-background', 'bg-white', 'bg-gray-50', 'bg-gray-100')
    } else {
      // Apply background image with high priority to override any page-specific backgrounds
      html.style.setProperty('background-image', `url(${safeUrl})`, 'important')
      html.style.setProperty('background-size', 'cover', 'important')
      html.style.setProperty('background-position', 'center', 'important')
      html.style.setProperty('background-repeat', 'no-repeat', 'important')
      html.style.setProperty('background-attachment', 'fixed', 'important')
      
      body.style.setProperty('background-image', `url(${safeUrl})`, 'important')
      body.style.setProperty('background-size', 'cover', 'important')
      body.style.setProperty('background-position', 'center', 'important')
      body.style.setProperty('background-repeat', 'no-repeat', 'important')
      body.style.setProperty('background-attachment', 'fixed', 'important')
      // Remove any background classes that might interfere
      body.classList.remove('bg-background', 'bg-white', 'bg-gray-50', 'bg-gray-100')
    }
    
    return () => {
      // Cleanup is handled by next effect run
    }
  }, [background?.id, background?.url, safeUrl])

  return (
    <div className="min-h-screen relative">
      {/* Fixed background layer - highest priority, covers entire viewport */}
      {hasBackground && (
        <div
          key={`bg-${background.id}-${renderKey}-${urlHash.substring(0, 50)}`}
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${safeUrl})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            opacity: 0.85, // Slightly more visible
            zIndex: -1 // Ensure it's behind everything
          }}
        />
      )}
      
      {/* Gradient overlay with smooth transition - reduced opacity for better visibility */}
      <div 
        key={`overlay-${background?.id || 'default'}-${renderKey}`}
        className={`fixed inset-0 z-0 transition-all duration-700 ease-in-out pointer-events-none ${
          !hasBackground || background?.id === 'gradient'
            ? 'bg-gradient-to-br from-slate-300 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800'
            : 'bg-gradient-to-br from-white/30 to-white/20 dark:from-gray-900/40 dark:to-gray-800/30'
        }`}
        style={{ zIndex: -1 }}
      />

      {/* Content - all pages render here */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}