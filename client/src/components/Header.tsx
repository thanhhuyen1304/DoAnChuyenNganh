import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  Menu,
  X,
  User,
  ChevronDown,
  Bug,
  Search,
  ClipboardList,
  Settings,
  Swords,
  Trophy,
} from 'lucide-react'
import { useLanguage } from './contexts/LanguageContext'
import { CombinedLeaderboardModal } from './CombinedLeaderboardModal'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  // Props không còn cần thiết cho toggle theme; giữ để tương thích nếu nơi khác có truyền
  darkMode?: boolean
  toggleDarkMode?: () => void
}

const Header: React.FC<HeaderProps> = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const darkMode = resolvedTheme === 'dark'
  const toggleDarkMode = () => setTheme(darkMode ? 'light' : 'dark')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const logout = () => {
    // Clear auth and reload UI
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // redirect to home page
    window.location.href = '/'
  }

  // Load user from localStorage and listen for changes (multi-tab)
  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch (e) {
        setUser(null)
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) setUser(JSON.parse(e.newValue))
        else setUser(null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLanguageChange = (lang: "vi" | "en") => {
    setLanguage(lang)
  }

  return (
    <header
      className={`sticky top-0 w-full z-[10000] transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-md' : 'bg-white dark:bg-gray-900'}`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center relative z-[10001]">
        {/* Logo -> click để về trang chủ */}
        <Link to="/" className="flex items-center group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300 z-0"></div>
            <div className="relative flex items-center bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white p-2 rounded-lg mr-2 shadow-lg group-hover:shadow-xl transition-all duration-300 z-0">
              <Bug size={24} className="group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-2xl font-bold tracking-tight group-hover:opacity-90">
              Bug
              <span className="text-gray-800 dark:text-white">Hunter</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/challenges/allchallengeslist"
            className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            {t("nav.challenges")}
          </Link>
          <Link
            to="/pvp"
            className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              {t("nav.pvp")}
            </div>
          </Link>
          {/* <button
            onClick={() => setShowLeaderboard(true)}
            className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            {t("nav.leaderboard")}
          </button> */}
          <button
            onClick={() => setShowLeaderboard(true)}
            className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Xếp hạng
          </button>
        </nav>

        {/* Right side controls */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Search button */}
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
            <Search size={20} />
          </button>

          {/* Language Switcher */}
          <div className="relative group">
            <button className="flex items-center text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <span>{language.toUpperCase()}</span>
              <ChevronDown
                size={16}
                className="ml-1 group-hover:rotate-180 transition-transform duration-300"
              />
            </button>
            <div className="absolute right-0 mt-2 w-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 z-[10002]">
              <button
                onClick={() => handleLanguageChange('vi')}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${language === 'vi' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                VI
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <span className="w-2 h-2 rounded-full mr-2 bg-red-500"></span>
                EN
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 relative overflow-hidden"
            aria-label="Toggle theme"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-200 to-primary-100 dark:from-primary-900 dark:to-primary-800 opacity-0 hover:opacity-20 transition-opacity duration-200"></div>
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-700" />
            )}
          </button>

          {/* Auth */}
          {user ? (
            <div className="flex items-center space-x-3">
              {/* Notification bell */}
              <NotificationBell />

              {/* User dropdown */}
              <div className="relative group">
                <button className="flex items-center">
                  <div className="relative">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || user?.email || 'User')}&background=7c3aed&color=fff`}
                      alt="User avatar"
                      className="w-9 h-9 rounded-full border-2 border-primary-400 transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  </div>
                  <span className="ml-3 hidden md:inline-block text-sm font-medium text-gray-700 dark:text-white">{user?.username}</span>
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 z-[10002]">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username || user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                    <Link
                          to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ClipboardList size={16} className="mr-2 text-gray-500 dark:text-gray-300" />
                          {user?.role === 'admin' ? 'Quản lý' : 'Kho bài tập'}
                        </Link>
                  </div>
                  <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User size={16} className="mr-2 text-gray-500 dark:text-gray-300" />
                      Hồ sơ
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings size={16} className="mr-2 text-gray-500 dark:text-gray-300" />
                      Cài đặt
                    </Link>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 relative overflow-hidden group">
                <span className="relative z-10">{t("auth.login")}</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                {t("auth.signup")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-3 md:hidden">
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
            <Search size={20} />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-700" />
            )}
          </button>
          <button className="p-1.5" onClick={toggleMenu}>
            {isMenuOpen ? (
              <X size={24} className="text-gray-700 dark:text-gray-200" />
            ) : (
              <Menu size={24} className="text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 px-4 py-4 shadow-lg border-t border-gray-100 dark:border-gray-800 animate-fadeIn z-[10001]">
          <nav className="flex flex-col space-y-4 pb-6">
            <Link
              to="/challenges"
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2 border-b border-gray-100 dark:border-gray-800"
            >
              {t("nav.courses")}
            </Link>
            <Link
              to="/challenges/allchallengeslist"
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2 border-b border-gray-100 dark:border-gray-800"
            >
              {t("nav.challenges")}
            </Link>
            <Link
              to="/pvp"
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2 border-b border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4" />
                {t("nav.pvp")}
              </div>
            </Link>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 w-full"
            >
              <Trophy className="w-4 h-4" />
              {t("nav.leaderboard")}
            </button>
          </nav>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <div className="relative">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLanguageChange('vi')}
                    className={`px-3 py-1.5 text-sm rounded-full flex items-center ${language === 'vi' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'}`}
                  >
                    <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                    VI
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`px-3 py-1.5 text-sm rounded-full flex items-center ${language === 'en' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'}`}
                  >
                    <span className="w-2 h-2 rounded-full mr-2 bg-red-500"></span>
                    EN
                  </button>
                </div>
              </div>
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || user?.email || 'User')}&background=7c3aed&color=fff`}
                  alt="User avatar"
                  className="w-9 h-9 rounded-full border-2 border-primary-400"
                />
                <User
                  size={20}
                  className="ml-2 text-gray-700 dark:text-gray-200"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
                  {t("auth.login")}
                </Link>
                <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white rounded-full shadow-md">
                  {t("auth.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <CombinedLeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </header>
  )
}

export default Header
