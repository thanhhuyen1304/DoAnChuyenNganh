import React, { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Key, Palette, Globe, Shield, Trash2, Save, Eye, EyeOff, Image, ArrowLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useBackground } from '../contexts/BackgroundContext'
import Header from '../Header'

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase()

// Background options are defined at the top

const Settings: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [user, setUser] = useState<any | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { background, setBackground } = useBackground()
  const [customImage, setCustomImage] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Predefined background images with translated labels
  const BACKGROUND_OPTIONS = [
    { id: 'default', url: '/logo.jpg', labelKey: 'settings.background.options.default' },
    { id: 'code', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80', labelKey: 'settings.background.options.code' },
    { id: 'geometric', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80', labelKey: 'settings.background.options.geometric' },
    { id: 'custom', url: '', labelKey: 'settings.background.options.custom' },
  ]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('settings.file.tooLarge'))
      // Clear input after error
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert(t('settings.file.invalid'))
      // Clear input after error
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const reader = new FileReader()
    
    reader.onerror = () => {
      alert(t('settings.file.readError'))
      // Clear input after error
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    reader.onloadend = () => {
      const imageUrl = reader.result as string
      if (imageUrl) {
        setCustomImage(imageUrl)
        setBackground({ id: 'custom', url: imageUrl, label: t('settings.background.options.custom') })
      }
      // Clear file input AFTER processing is complete so selecting the same file again will trigger onChange
      // Use setTimeout to ensure state updates are complete
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 100)
    }

    reader.readAsDataURL(file)
  }
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    // Load user data
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        setUser(null)
      }
    }

    // Set custom image if background is custom, otherwise clear it
    if (background.id === 'custom' && background.url) {
      setCustomImage(background.url)
    } else if (background.id !== 'custom') {
      // Clear custom image when switching to non-custom background
      setCustomImage(null)
    }
    
    // Trigger animation
    setIsVisible(true)
  }, [background])

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('settings.password.error.fill'))
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('settings.password.error.length'))
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('settings.password.error.mismatch'))
      return
    }

    setSavingPassword(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      
      const json = await res.json()
      if (json?.success) {
        setPasswordSuccess(t('settings.password.success'))
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordError(json?.message || t('settings.password.error.failed'))
      }
    } catch (e: any) {
      setPasswordError(e?.message || t('settings.password.error.network'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center py-8 md:py-12 overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className={`mb-8 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-100/20 dark:border-gray-700/50 shadow-[0_0_25px_rgba(162,89,255,0.15)] relative`}>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] mb-4 flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/30 hover:bg-white/50 dark:bg-gray-800/50 dark:hover:bg-white/30 transition-all duration-200 group"
                aria-label="Go back"
              >
                <ArrowLeft
                  size={18}
                  className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-600 transition-colors"
                />
              </button>
              <Palette size={24} className="text-primary-500" />
              {t('settings.theme.title')}
            </h2>
            <div className="space-y-6">
              {/* Theme Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.theme.mode')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">☀️</div>
                      <div className="text-sm font-medium">{t('settings.theme.light')}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌙</div>
                      <div className="text-sm font-medium">{t('settings.theme.dark')}</div>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('settings.theme.current')} {resolvedTheme === 'dark' ? t('settings.theme.current.dark') : t('settings.theme.current.light')}
                </p>
              </div>

              {/* Background Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.background.title')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {BACKGROUND_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (option.id === 'custom') {
                          // Always open file picker to choose or replace the custom background
                          // Don't clear input here - let handleFileChange handle it
                          if (fileInputRef.current) {
                            fileInputRef.current.click()
                          }
                        } else {
                          setBackground({ ...option, label: t(option.labelKey) })
                        }
                      }}
                      className={`aspect-[16/9] relative rounded-xl overflow-hidden border-2 transition-all ${
                        background.id === option.id
                          ? 'border-primary-500 ring-2 ring-primary-500/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {option.id === 'custom' && customImage ? (
                        <img 
                          src={customImage} 
                          alt={t(option.labelKey)}
                          className="w-full h-full object-cover"
                        />
                      ) : option.id !== 'custom' ? (
                        <img 
                          src={option.url} 
                          alt={t(option.labelKey)}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs font-medium">
                        {t(option.labelKey)}
                      </div>
                      {option.id === 'custom' && !customImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 hover:bg-gray-900/80 cursor-pointer transition-all duration-300"
                             onClick={(e) => {
                               e.stopPropagation()
                               // Don't clear input here - let handleFileChange handle it
                               if (fileInputRef.current) {
                                 fileInputRef.current.click()
                               }
                             }}>
                          <Image className="w-8 h-8 text-white opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      {option.id === 'custom' && customImage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomImage(null);
                            setBackground({ ...BACKGROUND_OPTIONS[0], label: t(BACKGROUND_OPTIONS[0].labelKey) });
                            // Clear file input value so user can re-select same file
                            try {
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            } catch (e) {}
                          }}
                          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all duration-300 z-10"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                </div>
              </div>
            </div>

          {/* Language Settings */}
          <div className={`mb-8 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-100/20 dark:border-gray-700/50 shadow-[0_0_25px_rgba(162,89,255,0.15)]`}>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] mb-4 flex items-center gap-3">
              <Globe size={24} className="text-primary-500" />
              {t('settings.language.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.language.select')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLanguage('vi')}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      language === 'vi'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span className="font-medium">{t('settings.language.vi')}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      language === 'en'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="font-medium">{t('settings.language.en')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change - Only for local accounts */}
          {user?.loginMethod === 'local' && (
            <div className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-[0_0_25px_rgba(162,89,255,0.15)] border border-gray-100/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.01] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} delay-200`}>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] mb-4 flex items-center gap-3">
                <Key size={24} className="text-primary-500" />
                {t('settings.password.title')}
              </h2>
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                  {passwordSuccess}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.password.current')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder={t('settings.password.current.placeholder')}
                    />
                    <button
                      onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.password.new')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder={t('settings.password.new.placeholder')}
                    />
                    <button
                      onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.password.confirm')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder={t('settings.password.confirm.placeholder')}
                    />
                    <button
                      onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handlePasswordChange}
                  disabled={savingPassword}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-60"
                >
                  <Save size={18} />
                  {savingPassword ? t('settings.password.saving') : t('settings.password.change')}
                </button>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className={`mb-8 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-100/20 dark:border-gray-700/50 shadow-[0_0_25px_rgba(162,89,255,0.15)]`}>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] mb-4 flex items-center gap-3">
              <Shield size={24} className="text-primary-500" />
              {t('settings.account.title')}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.account.loginMethod')}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {user?.loginMethod === 'local' && t('settings.account.loginMethod.local')}
                  {user?.loginMethod === 'google' && t('settings.account.loginMethod.google')}
                  {user?.loginMethod === 'github' && t('settings.account.loginMethod.github')}
                  {user?.loginMethod === 'facebook' && t('settings.account.loginMethod.facebook')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.account.email')}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.account.username')}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{user?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Settings

