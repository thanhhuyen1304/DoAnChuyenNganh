import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Code, Bug, Play, ArrowRight, CheckCircle, Trophy } from 'lucide-react'
import { useLanguage } from './contexts/LanguageContext'
import { CombinedLeaderboardModal } from './CombinedLeaderboardModal'

const Hero: React.FC = () => {
  const { language, t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [animateCode, setAnimateCode] = useState(false)
  const [showBugFixed, setShowBugFixed] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const codeTimer = setTimeout(() => setAnimateCode(true), 800)
    const bugFixTimer = setTimeout(() => setShowBugFixed(true), 2000)
    return () => {
      clearTimeout(codeTimer)
      clearTimeout(bugFixTimer)
    }
  }, [])

  return (
    <section className="min-h-screen flex items-center py-8 md:py-12 overflow-hidden relative">
      {/* Background is handled by BackgroundWrapper - only keep decorative overlays */}
      <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
      <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>

      {/* Main content */}
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center relative z-20">
        {/* Left text */}
        <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
          <div className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="inline-block py-1 px-3 mb-4 text-sm font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
              {language === 'vi' ? 'Nền tảng học debug #1' : '#1 Debugging Learning Platform'}
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              {language === 'vi' ? (
                <>
                  Nâng cao kỹ năng{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] font-bold">
                    Debug Code
                  </span>{' '}
                  của bạn
                </>
              ) : (
                <>
                  Improve your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] font-bold">
                    Code Debugging
                  </span>{' '}
                  skills
                </>
              )}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {language === 'vi'
                ? 'Trở thành chuyên gia phát hiện và sửa lỗi với nền tảng học tương tác BugHunter. Thử thách bản thân với các bài tập thực tế từ đơn giản đến phức tạp.'
                : 'Become an expert at detecting and fixing bugs with the BugHunter interactive learning platform. Challenge yourself with practical exercises from simple to complex.'}
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link
                to="/challenges/allchallengeslist"
                className="px-8 py-4 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <Play size={18} className="mr-2 group-hover:animate-pulse" />
                <span>Bắt đầu ngay</span>
              </Link>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 hover:border-primary-600 dark:hover:border-primary-400 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group flex items-center gap-2"
              >
                <Trophy size={18} className="group-hover:text-yellow-500 transition-colors" />
                <span>{language === 'vi' ? 'Xếp hạng' : 'Leaderboard'}</span>
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex -space-x-3">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 ring-2 ring-primary-400/30" />
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 ring-2 ring-primary-400/30" />
                <img src="https://randomuser.me/api/portraits/men/86.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 ring-2 ring-primary-400/30" />
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-800/50 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400">
                  +99
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {language === 'vi' ? 'Tham gia cùng' : 'Join with'}{' '}
                  <span className="font-bold text-primary-600 dark:text-primary-400">1,240+</span>{' '}
                  {language === 'vi' ? 'người khác đang học' : 'others learning'}
                </p>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    4.9/5 ({language === 'vi' ? 'đánh giá' : 'rating'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right code block */}
        <div className="md:w-1/2 relative z-10 flex items-start -mt-6">
          <div className={`transition-all duration-700 delay-150 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-[0_0_25px_rgba(162,89,255,0.15)] p-8 pl-10 transform rotate-1 border border-gray-100/20 dark:border-gray-700/50 overflow-hidden w-[480px] md:w-[520px] max-w-full mx-auto transition-all hover:scale-[1.02] duration-300">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm shadow-yellow-300/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-300/50"></div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100/60 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md font-medium">
                    debug.js
                  </span>
                  <span className="px-2 py-1 bg-yellow-100/60 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md font-medium">
                    JavaScript
                  </span>
                </div>
              </div>

              {/* Code */}
              <div className="bg-[#0F111A] dark:bg-gray-950 rounded-xl p-5 pl-8 text-sm shadow-inner border border-gray-800 font-mono leading-relaxed overflow-x-auto">
                <div className="flex">
                  <div className="mr-6 text-gray-500/70 select-none text-right">
                    {[1,2,3,4,5,6,7,8,9].map(line => <div key={line}>{line}</div>)}
                  </div>

                  <div className="flex-1 text-gray-100">
                    <div><span className="text-purple-400">function</span> <span className="text-yellow-300">calculateTotal</span><span className="text-gray-400">(</span><span className="text-sky-400">items</span><span className="text-gray-400">) {'{'}</span></div>
                    <div className="pl-6"><span className="text-sky-400">let</span> total = <span className="text-orange-400">0</span>;</div>
                    <div className="pl-6 text-gray-500">// <span className="text-red-400">Bug:</span> forEach doesn’t return a value</div>
                    <div className={`pl-6 ${showBugFixed ? 'line-through text-gray-600' : ''}`}><span className="text-purple-400">return</span> items.<span className="text-yellow-300">forEach</span>(<span className="text-sky-400">item</span> {'=> {'}</div>
                    <div className={`pl-10 ${showBugFixed ? 'line-through text-gray-600' : ''}`}>total += item.price * item.quantity;</div>
                    <div className={`pl-6 ${showBugFixed ? 'line-through text-gray-600' : ''}`}>{'})'};</div>
                    <div className="pl-6 text-gray-500">// Fix: return total after the loop</div>
                    <div className={`pl-6 ${animateCode ? 'bg-green-900/30 rounded-sm' : 'text-gray-500'}`}>
                      {showBugFixed && <span className="text-green-400 mr-1">+</span>}
                      <span className="text-purple-400">{showBugFixed ? '' : '// '}return</span> <span className="text-sky-400">{showBugFixed ? '' : '// '}total</span>;
                    </div>
                    <div>{'}'}</div>
                  </div>
                </div>
              </div>

              {/* Bug status */}
              <div className="mt-5 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {showBugFixed ? (
                    <>
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                      <span className="text-green-400 font-medium">Bug fixed: Return value corrected</span>
                    </>
                  ) : (
                    <>
                      <Bug size={16} className="text-red-500 mr-2" />
                      <span className="text-red-400 font-medium">Bug detected: Function returns undefined</span>
                    </>
                  )}
                </div>
                <span className="text-xs bg-gray-700/40 text-gray-300 px-2 py-1 rounded-md">
                  {language === 'vi' ? 'Cơ bản' : 'Basic'} • 2 {language === 'vi' ? 'phút' : 'min'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <CombinedLeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </section>
  )
}

export default Hero
