import React from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Bug,
  ArrowRight,
  CheckCircle,
  Heart,
} from 'lucide-react'
import { useLanguage } from './contexts/LanguageContext'

const Footer: React.FC = () => {
  const { language } = useLanguage()

  return (
  <footer className="relative overflow-hidden text-black dark:text-white pt-16 pb-12 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">

      {/* Background is handled by BackgroundWrapper - only keep decorative elements */}

      {/* Brand radial accents (primary purple + pink) */}
      <div className="absolute -left-24 -top-12 w-96 h-96 bg-[rgba(162,89,255,0.15)] rounded-full blur-3xl pointer-events-none -z-10" aria-hidden />
      <div className="absolute right-0 -bottom-8 w-80 h-80 bg-[rgba(255,0,122,0.1)] rounded-full blur-3xl pointer-events-none -z-10" aria-hidden />

      {/* Soft decorative texture (very low opacity) to avoid harsh noise */}
      <svg className="absolute inset-0 -z-20 w-full h-full opacity-3 pointer-events-none" aria-hidden preserveAspectRatio="none" viewBox="0 0 800 600">
        <defs>
          <filter id="softNoise" x="0" y="0" width="100%" height="100%">
            <feTurbulence baseFrequency="0.6" numOctaves="1" stitchTiles="stitch" result="turb" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.15" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#softNoise)" fill="#000" />
      </svg>

      {/* Wavy SVG top divider to create a smooth transition from the page above */}
      <div className="absolute inset-x-0 top-0 -translate-y-1/2">
        <svg viewBox="0 0 1440 120" className="w-full h-20 text-gray-900 dark:text-white/10" preserveAspectRatio="none" aria-hidden>
          <path d="M0,48 C120,80 360,120 720,88 C1080,56 1320,16 1440,48 L1440,0 L0,0 Z" fill="currentColor" opacity="0.12" />
          <path d="M0,72 C180,40 420,8 720,40 C1020,72 1260,112 1440,80 L1440,0 L0,0 Z" fill="currentColor" opacity="0.06" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Newsletter + Brand */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start py-10 border-b border-gray-200 dark:border-gray-800">
          <div className="lg:col-span-1">
            {/* Thêm mb-4 (margin-bottom) vào thẻ bao ngoài nếu bạn muốn giữ khoảng cách */}
            <div className="flex items-center mb-4">
              {/* Logo Icon (Lấy từ Header.tsx) */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300 z-0"></div>
                <div className="relative flex items-center bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white p-2 rounded-lg mr-2 shadow-lg group-hover:shadow-xl transition-all duration-300 z-0">
                  <Bug size={24} className="animate-pulse" />
                </div>
              </div>

              {/* Logo Text (Lấy từ Header.tsx) và Subtitle của bạn */}
              <div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-2xl font-bold tracking-tight">
                  Bug
                  <span className="text-gray-800 dark:text-white">Hunter</span>
                </span>
                
                {/* Subtitle của bạn, đã thêm text-color cho dark mode */}
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {language === 'vi' ? 'Học cách săn lỗi và sửa nhanh' : 'Learn to find and fix bugs faster'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              {/* Thêm hover:-translate-y-1, hover:scale-105, và đổi thành transition-all duration-300 */}
              <a 
                href="#" 
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white 
                          hover:bg-primary-600 dark:hover:bg-primary-600 
                          transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <Facebook size={16} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white 
                          hover:bg-primary-600 dark:hover:bg-primary-600 
                          transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <Twitter size={16} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white 
                          hover:bg-primary-600 dark:hover:bg-primary-600 
                          transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <Instagram size={16} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white 
                          hover:bg-primary-600 dark:hover:bg-primary-600 
                          transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <Youtube size={16} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form className="flex flex-col sm:flex-row gap-3 items-center">
              <label htmlFor="footer-email" className="sr-only">{language === 'vi' ? 'Email' : 'Email'}</label>
              <input id="footer-email" type="email" placeholder={language === 'vi' ? 'Nhập email của bạn' : 'Enter your email'} className="w-full sm:flex-1 px-4 py-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-md text-black text-bold dark:text-white font-medium hover:from-primary-700 hover:to-primary-600">
                {language === 'vi' ? 'Đăng ký' : 'Subscribe'}
                <ArrowRight size={16} />
              </button>
            </form>
                <p className="text-xs text-black dark:text-white mt-2 flex items-center"><CheckCircle size={14} className="mr-2 text-primary-400" />{language === 'vi' ? 'Chúng tôi tôn trọng quyền riêng tư của bạn' : 'We respect your privacy'}</p>
          </div>
        </div>

        {/* Links grid */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8">
          <div>
            <h4 className="text-sm font-semibold mb-3">{language === 'vi' ? 'Liên kết' : 'Links'}</h4>
            <ul className="space-y-2 text-gray-400 dark:text-white text-sm">
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Trang chủ' : 'Home'}</a></li>
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Khóa học' : 'Courses'}</a></li>
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Thử thách' : 'Challenges'}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">{language === 'vi' ? 'Hỗ trợ' : 'Support'}</h4>
            <ul className="space-y-2 text-gray-400 dark:text-white text-sm">
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'FAQ' : 'FAQ'}</a></li>
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Hướng dẫn' : 'Tutorials'}</a></li>
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Cộng đồng' : 'Community'}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">{language === 'vi' ? 'Tài nguyên' : 'Resources'}</h4>
            <ul className="space-y-2 text-gray-400 dark:text-white text-sm">
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Tài liệu' : 'Documentation'}</a></li>
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Blog' : 'Blog'}</a></li>
              <li><a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? 'Trợ giúp' : 'Help'}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">{language === 'vi' ? 'Liên hệ' : 'Contact'}</h4>
            <ul className="space-y-2 text-black dark:text-white text-sm">
              <li className="flex items-center"><Mail size={14} className="mr-2 text-primary-400" /> <a href="mailto:contact@bughunter.com" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">contact@bughunter.com</a></li>
              <li className="flex items-center"><Phone size={14} className="mr-2 text-primary-400" /> <a href="tel:+84123456789" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">+84 123 456 789</a></li>
              <li className="flex items-center"><MapPin size={14} className="mr-2 text-primary-400" /> <span className="text-black hover:text-white dark:text-white dark:hover:text-gray-400">{language === 'vi' ? '123 Đường ABC, TP.HCM' : '123 ABC Street, HCM'}</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
  <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-black hover:text-white dark:text-white dark:hover:text-gray-400 text-sm">&copy; {new Date().getFullYear()} BugHunter. {language === 'vi' ? 'Tất cả quyền được bảo lưu.' : 'All rights reserved.'} <span className="inline-flex items-center text-black hover:text-white dark:text-white dark:hover:text-black">{language === 'vi' ? 'Được phát triển với' : 'Made with'} <Heart size={12} className="mx-1 text-red-500" /> {language === 'vi' ? 'tại Việt Nam' : 'in Vietnam'}</span></p>

          <div className="flex items-center gap-4">
            <a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400 text-sm">{language === 'vi' ? 'Điều khoản' : 'Terms'}</a>
            <a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400 text-sm">{language === 'vi' ? 'Bảo mật' : 'Privacy'}</a>
            <a href="#" className="text-black hover:text-white dark:text-white dark:hover:text-gray-400 text-sm">{language === 'vi' ? 'Cookie' : 'Cookies'}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
