import React, { useState } from 'react'
import { useLanguage } from './contexts/LanguageContext'
import { ArrowRight, Star } from 'lucide-react'

type LanguageCardsProps = {
  onSelectLanguage?: (language: string) => void
}

const LanguageCards: React.FC<LanguageCardsProps> = ({ onSelectLanguage }) => {
  const { language } = useLanguage()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const languages = [
    {
      name: 'JavaScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      exercises: 120,
      color: 'bg-yellow-100/60 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200/50 dark:border-yellow-800/40',
      iconBg: 'bg-yellow-50 dark:bg-yellow-900/50',
      textColor: 'text-yellow-800 dark:text-yellow-300',
      rating: 4.9,
      students: '15K+',
      popular: true,
      difficulty: language === 'vi' ? 'Trung bình' : 'Intermediate',
    },
    {
      name: 'Python',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      exercises: 95,
      color: 'bg-blue-100/60 dark:bg-blue-900/20',
      borderColor: 'border-blue-200/50 dark:border-blue-800/40',
      iconBg: 'bg-blue-50 dark:bg-blue-900/50',
      textColor: 'text-blue-800 dark:text-blue-300',
      rating: 4.8,
      students: '12K+',
      trending: true,
      difficulty: language === 'vi' ? 'Dễ' : 'Easy',
    },
    {
      name: 'Java',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      exercises: 85,
      color: 'bg-orange-100/60 dark:bg-orange-900/20',
      borderColor: 'border-orange-200/50 dark:border-orange-800/40',
      iconBg: 'bg-orange-50 dark:bg-orange-900/50',
      textColor: 'text-orange-800 dark:text-orange-300',
      rating: 4.7,
      students: '10K+',
      difficulty: language === 'vi' ? 'Nâng cao' : 'Advanced',
    },
    {
      name: 'C++',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
      exercises: 75,
      color: 'bg-blue-100/60 dark:bg-blue-900/20',
      borderColor: 'border-blue-200/50 dark:border-blue-800/40',
      iconBg: 'bg-blue-50 dark:bg-blue-900/50',
      textColor: 'text-blue-800 dark:text-blue-300',
      rating: 4.6,
      students: '8K+',
      difficulty: language === 'vi' ? 'Nâng cao' : 'Advanced',
    },
    {
      name: 'C#',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
      exercises: 60,
      color: 'bg-purple-100/60 dark:bg-purple-900/20',
      borderColor: 'border-purple-200/50 dark:border-purple-800/40',
      iconBg: 'bg-purple-50 dark:bg-purple-900/50',
      textColor: 'text-purple-800 dark:text-purple-300',
      rating: 4.5,
      students: '7K+',
      difficulty: language === 'vi' ? 'Trung bình' : 'Intermediate',
    },
  ]

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-white/40 to-transparent dark:from-gray-800/40 dark:to-transparent backdrop-blur-sm">
      {/* Background elements (match TopLearners) */}
      <div className="absolute top-0 left-1/3 w-1/3 h-64 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl z-[-20]"></div>
      <div className="absolute bottom-0 right-1/4 w-1/4 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl z-[-20]"></div>

      {/* Main content (nổi bật hơn mọi layer) */}
      <div className="container mx-auto px-4 relative z-[9999]">
        {/* wrap with leaderboard-style background */}
        <div className="relative bg-white/20 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-16 relative z-[9999]">
          {/* 🔹 Badge */}
          <span className="inline-block mb-5 text-sm font-semibold text-[#A259FF] dark:text-[#C77DFF] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:text-[#FF66C4] transition-all duration-300">
            {language === 'vi' ? 'Đa dạng ngôn ngữ' : 'Multiple Languages'}
          </span>

          {/* ✨ Title - full gradient text, không nền */}
          <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight text-center relative z-[9999]">
            <span className="text-gray-900 dark:text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)] mr-3">
              {language === 'vi' ? 'Ngôn ngữ' : 'Programming'}
            </span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
              {language === 'vi' ? 'lập trình' : 'languages'}
            </span>
          </h2>

          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-lg mt-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-[9999]">
            {language === 'vi'
              ? 'Luyện tập debug với các ngôn ngữ lập trình phổ biến nhất.'
              : 'Practice debugging with the most popular programming languages.'}
          </p>
        </div>

          {/* 💻 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-50">
          {languages.map((lang, index) => (
            <div
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`Language ${lang.name}`}
              className={`relative ${lang.color} border ${lang.borderColor} rounded-2xl p-6 flex flex-col backdrop-blur-md group overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_35px_rgba(162,89,255,0.3)] cursor-default`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card content */}
              <div className="relative z-50">
                {/* Badges */}
                <div className="flex justify-between mb-4">
                  {lang.popular && (
                    <span className="px-2 py-1 text-xs font-semibold text-[#FF007A] bg-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {language === 'vi' ? 'Phổ biến' : 'Popular'}
                    </span>
                  )}
                  {lang.trending && (
                    <span className="px-2 py-1 text-xs font-semibold text-green-500 bg-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {language === 'vi' ? 'Xu hướng' : 'Trending'}
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div
                  className={`w-20 h-20 ${lang.iconBg} rounded-2xl flex items-center justify-center mb-6 p-4 mx-auto transition-transform duration-500 group-hover:scale-110 shadow-lg`}
                >
                  <img src={lang.icon} alt={lang.name} className="w-12 h-12" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
                  {lang.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center justify-center mb-3">
                  <div className="flex items-center mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.floor(lang.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{lang.rating}</span>
                </div>

                {/* Info */}
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <span>
                    {lang.exercises} {language === 'vi' ? 'bài tập' : 'exercises'}
                  </span>
                  <span>
                    {lang.students} {language === 'vi' ? 'học viên' : 'students'}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${lang.iconBg} ${lang.textColor} shadow-md`}
                  >
                    {lang.difficulty}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={language === 'vi' ? `Xem bài tập ${lang.name}` : `View ${lang.name} exercises`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onSelectLanguage) {
                          onSelectLanguage(lang.name)
                        } else {
                          const target = `/challenges?language=${encodeURIComponent(lang.name)}`
                          window.location.href = target
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        hoveredCard === index
                          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                          : 'bg-white/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400'
                      } transition-all duration-300`}
                    >
                      <ArrowRight
                        size={16}
                        className={`transform ${hoveredCard === index ? 'translate-x-0.5' : ''} transition-transform duration-300`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

          {/* CTA */}
          {/* <div className="mt-16 text-center relative z-50">
          <a
            href="#"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(162,89,255,0.5)] transition-all duration-300 group"
          >
            {language === 'vi' ? 'Xem tất cả ngôn ngữ' : 'View all languages'}
            <ArrowRight
              size={18}
              className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
            />
          </a>
        </div> */}
        </div>
      </div>
    </section>
  )
}

export default LanguageCards
