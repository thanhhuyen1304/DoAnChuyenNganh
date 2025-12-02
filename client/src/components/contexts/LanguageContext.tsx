import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header
    "nav.home": "Trang chủ",
    "nav.courses": "Khóa học",
    "nav.challenges": "Thử thách",
    "nav.leaderboard": "Bảng xếp hạng",
    "nav.blog": "Blog",
    "nav.pvp": "Thi Đấu",
    "auth.login": "Đăng nhập",
    "auth.signup": "Đăng ký",
    
    // Hero
    "hero.badge": "🚀 Nền tảng học Debug Code",
    "hero.title1": "Nâng cao kỹ năng",
    "hero.title2": "Debug Code",
    "hero.title3": "của bạn",
    "hero.description": "Trở thành chuyên gia debug với hàng trăm thử thách thực tế, video hướng dẫn chi tiết và hệ thống theo dõi tiến độ thông minh.",
    "hero.cta": "Bắt đầu ngay",
    "hero.demo": "Xem demo",
    "hero.stat1": "Bài tập",
    "hero.stat2": "Học viên",
    "hero.stat3": "Ngôn ngữ",
    
    // Features
    "features.title": "Tính năng nổi bật",
    "features.subtitle": "Mọi thứ bạn cần để trở thành chuyên gia debug code",
    "features.challenge.title": "Code Challenge",
    "features.challenge.desc": "Thử thách debug với các level khó từ cơ bản đến nâng cao. Rèn luyện kỹ năng qua các tình huống thực tế.",
    "features.learning.title": "Interactive Learning",
    "features.learning.desc": "Học qua video hướng dẫn chi tiết và bài tập thực hành tương tác. Nắm vững từng kỹ thuật debug.",
    "features.tracking.title": "Progress Tracking",
    "features.tracking.desc": "Theo dõi tiến độ học tập với dashboard thông minh. Nhận huy hiệu và xếp hạng dựa trên thành tích.",
    
    // Languages
    "languages.title": "Ngôn ngữ được hỗ trợ",
    "languages.subtitle": "Luyện tập debug với các ngôn ngữ lập trình phổ biến nhất",
    "languages.exercises": "bài tập",
    
    // Register
    "register.title": "Đăng ký tài khoản BugHunter",
    "register.subtitle": "Bắt đầu hành trình chinh phục bug!",
    "register.username": "Tên người dùng",
    "register.username.placeholder": "Nhập tên người dùng",
    "register.email": "Email",
    "register.email.placeholder": "Nhập email của bạn",
    "register.password": "Mật khẩu",
    "register.password.placeholder": "Nhập mật khẩu (tối thiểu 6 ký tự)",
    "register.button": "Tạo tài khoản",
    "register.button.loading": "Đang tạo tài khoản...",
    "register.text": "Đã có tài khoản?",
    "register.link": "Đăng nhập",
    "register.confirmPassword": "Xác nhận mật khẩu",
    "register.confirmPassword.placeholder": "Nhập lại mật khẩu",
    "register.password.mismatch": "Mật khẩu không khớp",
    "register.success": "Đăng ký thành công!",
    // Login (register page and login page keys)
    "login.emailOrUsername": "Email hoặc tên đăng nhập",
    "login.emailOrUsername.placeholder": "Nhập email hoặc tên đăng nhập của bạn",
    "login.title": "Đăng nhập",
    "login.subtitle": "Đăng nhập để tiếp tục",
    // "login.email": "Email",
    // "login.email.placeholder": "Nhập email của bạn",
    "login.password": "Mật khẩu",
    "login.password.placeholder": "Nhập mật khẩu của bạn",
    "login.button": "Đăng nhập",
    "login.button.loading": "Đang đăng nhập...",
    "login.error": "Đăng nhập thất bại",
    "login.register.text": "Chưa có tài khoản?",
    "login.register.link": "Đăng ký ngay",
    
    // Leaderboard
    "leaderboard.title": "Top Learners",
    "leaderboard.subtitle": "Những học viên xuất sắc nhất tháng này",
    "leaderboard.heading": "Bảng xếp hạng",
    "leaderboard.points": "điểm",
    
    // Testimonials
    "testimonials.title": "Học viên nói gì",
    "testimonials.subtitle": "Hàng nghìn học viên đã cải thiện kỹ năng debug của họ",
    
    // Footer
    "footer.description": "Nền tảng học debug code hàng đầu Việt Nam. Nâng cao kỹ năng lập trình của bạn với các thử thách thực tế.",
    "footer.product": "Sản phẩm",
    "footer.company": "Công ty",
    "footer.legal": "Pháp lý",
    "footer.about": "Về chúng tôi",
    "footer.careers": "Tuyển dụng",
    "footer.contact": "Liên hệ",
    "footer.pricing": "Giá cả",
    "footer.terms": "Điều khoản sử dụng",
    "footer.privacy": "Chính sách bảo mật",
    "footer.cookies": "Cookie Policy",
    
    // Settings
    "settings.badge": "Tùy chỉnh trải nghiệm của bạn",
    "settings.title": "Cài đặt",
    "settings.subtitle": "Quản lý cài đặt tài khoản và tùy chọn của bạn",
    "settings.theme.title": "Giao diện",
    "settings.theme.mode": "Chế độ hiển thị",
    "settings.theme.light": "Sáng",
    "settings.theme.dark": "Tối",
    "settings.theme.system": "Hệ thống",
    "settings.theme.current": "Chế độ hiện tại:",
    "settings.theme.current.light": "Sáng",
    "settings.theme.current.dark": "Tối",
    "settings.background.title": "Ảnh nền",
    "settings.background.select": "Chọn hình nền có sẵn hoặc tải lên ảnh của bạn",
    "settings.background.upload": "Tải ảnh từ máy",
    "settings.background.remove": "Xóa ảnh tùy chỉnh",
    "settings.background.options.default": "Mặc định",
    "settings.background.options.code": "Code",
    "settings.background.options.geometric": "Geometric",
    "settings.background.options.gradient": "Gradient",
    "settings.background.options.custom": "Tùy chỉnh",
    "settings.background.options.upload": "Tải ảnh lên",
    "settings.language.title": "Ngôn ngữ",
    "settings.language.select": "Chọn ngôn ngữ",
    "settings.language.vi": "Tiếng Việt",
    "settings.language.en": "English",
    "settings.password.title": "Đổi mật khẩu",
    "settings.password.current": "Mật khẩu hiện tại",
    "settings.password.current.placeholder": "Nhập mật khẩu hiện tại",
    "settings.password.new": "Mật khẩu mới",
    "settings.password.new.placeholder": "Nhập mật khẩu mới (tối thiểu 6 ký tự)",
    "settings.password.confirm": "Xác nhận mật khẩu mới",
    "settings.password.confirm.placeholder": "Nhập lại mật khẩu mới",
    "settings.password.change": "Đổi mật khẩu",
    "settings.password.saving": "Đang lưu...",
    "settings.password.error.fill": "Vui lòng điền đầy đủ thông tin",
    "settings.password.error.length": "Mật khẩu mới phải có ít nhất 6 ký tự",
    "settings.password.error.mismatch": "Mật khẩu xác nhận không khớp",
    "settings.password.error.failed": "Đổi mật khẩu thất bại",
    "settings.password.error.network": "Lỗi mạng",
    "settings.password.success": "Đổi mật khẩu thành công",
    "settings.account.title": "Thông tin tài khoản",
    "settings.account.loginMethod": "Phương thức đăng nhập:",
    "settings.account.loginMethod.local": "📧 Email & Password",
    "settings.account.loginMethod.google": "🔵 Google",
    "settings.account.loginMethod.github": "⚫ GitHub",
    "settings.account.loginMethod.facebook": "🔵 Facebook",
    "settings.account.email": "Email:",
    "settings.account.username": "Tên người dùng:",
    "settings.file.tooLarge": "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB",
    "settings.file.invalid": "Vui lòng chọn file hình ảnh",
    "settings.file.readError": "Không thể đọc file. Vui lòng thử lại",
    
    // Notifications
    "notifications.title": "Thông báo",
    "notifications.markAllRead": "Đánh dấu tất cả đã đọc",
    "notifications.noNotifications": "Không có thông báo nào",
    "notifications.new": "Mới",
    "notifications.justNow": "Vừa xong",
    "notifications.completed": "Hoàn thành bài tập",
    "notifications.completedMsg": "Bạn đã hoàn thành bài tập \"Debug Function\"",
    "notifications.rankUp": "Bạn lên hạng",
    "notifications.rankUpMsg": "Xin chúc mừng, bạn đã lên hạng Silver",
    "notifications.viewAll": "Xem tất cả thông báo",
    
    // Chat
    "chat.title": "BugHunter AI",
    "chat.subtitle": "Trợ lý thông minh",
    "chat.welcome": "Xin chào! 👋 Tôi là trợ lý AI của BugHunter. Tôi sẵn sàng giúp bạn học debug, trả lời các câu hỏi, và hỗ trợ bạn trên hành trình lập trình. Có gì tôi có thể giúp bạn không?",
    "chat.placeholder": "Nhập câu hỏi của bạn...",
    "chat.typing": "AI đang suy nghĩ...",
    "chat.clear": "Xóa cuộc trò chuyện",
  },
  en: {
    // Header
    "nav.home": "Home",
    "nav.courses": "Courses",
    "nav.challenges": "Challenges",
    "nav.leaderboard": "Leaderboard",
    "nav.blog": "Blog",
    "nav.pvp": "PvP Battle",
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    
    // Hero
    "hero.badge": "🚀 Code Debugging Platform",
    "hero.title1": "Master Your",
    "hero.title2": "Code Debugging",
    "hero.title3": "Skills",
    "hero.description": "Become a debugging expert with hundreds of real-world challenges, detailed video tutorials, and intelligent progress tracking system.",
    "hero.cta": "Get Started",
    "hero.demo": "Watch Demo",
    "hero.stat1": "Exercises",
    "hero.stat2": "Learners",
    "hero.stat3": "Languages",
    
    // Features
    "features.title": "Key Features",
    "features.subtitle": "Everything you need to become a debugging expert",
    "features.challenge.title": "Code Challenge",
    "features.challenge.desc": "Debug challenges with difficulty levels from basic to advanced. Practice skills through real-world scenarios.",
    "features.learning.title": "Interactive Learning",
    "features.learning.desc": "Learn through detailed video tutorials and interactive exercises. Master every debugging technique.",
    "features.tracking.title": "Progress Tracking",
    "features.tracking.desc": "Track learning progress with intelligent dashboard. Earn badges and rankings based on achievements.",
    
    // Languages
    "languages.title": "Supported Languages",
    "languages.subtitle": "Practice debugging with the most popular programming languages",
    "languages.exercises": "exercises",
    
    // Register
    "register.title": "Create BugHunter Account",
    "register.subtitle": "Start your bug-hunting journey!",
    "register.username": "Username",
    "register.username.placeholder": "Enter username",
    "register.email": "Email",
    "register.email.placeholder": "Enter your email",
    "register.password": "Password",
    "register.password.placeholder": "Enter password (min 6 characters)",
    "register.button": "Create Account",
    "register.button.loading": "Creating account...",
    "register.login.text": "Already have an account?",
  "register.login.link": "Login",
  // Login (register page and login page keys)
  "login.title": "Login",
  "login.subtitle": "Sign in to continue",
  // support email or username input (matches Vietnamese keys)
  "login.emailOrUsername": "Email or username",
  "login.emailOrUsername.placeholder": "Enter your email or username",
  // legacy keys (some components may use these)
  "login.email": "Email",
  "login.email.placeholder": "Enter your email",
  "login.password": "Password",
  "login.password.placeholder": "Enter your password",
  "login.button": "Login",
  "login.button.loading": "Signing in...",
  "login.error": "Login failed",
  "login.register.text": "Don't have an account?",
  "login.register.link": "Register",
    
    // Leaderboard
    "leaderboard.title": "Top Learners",
    "leaderboard.subtitle": "This month's top performers",
    "leaderboard.heading": "Leaderboard",
    "leaderboard.points": "points",
    
    // Testimonials
    "testimonials.title": "What Learners Say",
    "testimonials.subtitle": "Thousands of learners have improved their debugging skills",
    
    // Footer
    "footer.description": "Vietnam's leading code debugging learning platform. Enhance your programming skills with real-world challenges.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.about": "About Us",
    "footer.careers": "Careers",
    "footer.contact": "Contact",
    "footer.pricing": "Pricing",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.cookies": "Cookie Policy",
    
    // Settings
    "settings.badge": "Customize your experience",
    "settings.title": "Settings",
    "settings.subtitle": "Manage your account settings and preferences",
    "settings.theme.title": "Appearance",
    "settings.theme.mode": "Display mode",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.theme.current": "Current mode:",
    "settings.theme.current.light": "Light",
    "settings.theme.current.dark": "Dark",
    "settings.background.title": "Background",
    "settings.background.select": "Choose from preset backgrounds or upload your own image",
    "settings.background.upload": "Upload image from device",
    "settings.background.remove": "Remove custom image",
    "settings.background.options.default": "Default",
    "settings.background.options.code": "Code",
    "settings.background.options.geometric": "Geometric",
    "settings.background.options.gradient": "Gradient",
    "settings.background.options.custom": "Custom",
    "settings.background.options.upload": "Upload image",
    "settings.language.title": "Language",
    "settings.language.select": "Select language",
    "settings.language.vi": "Vietnamese",
    "settings.language.en": "English",
    "settings.password.title": "Change Password",
    "settings.password.current": "Current password",
    "settings.password.current.placeholder": "Enter current password",
    "settings.password.new": "New password",
    "settings.password.new.placeholder": "Enter new password (minimum 6 characters)",
    "settings.password.confirm": "Confirm new password",
    "settings.password.confirm.placeholder": "Re-enter new password",
    "settings.password.change": "Change password",
    "settings.password.saving": "Saving...",
    "settings.password.error.fill": "Please fill in all fields",
    "settings.password.error.length": "New password must be at least 6 characters",
    "settings.password.error.mismatch": "Password confirmation does not match",
    "settings.password.error.failed": "Failed to change password",
    "settings.password.error.network": "Network error",
    "settings.password.success": "Password changed successfully",
    "settings.account.title": "Account Information",
    "settings.account.loginMethod": "Login method:",
    "settings.account.loginMethod.local": "📧 Email & Password",
    "settings.account.loginMethod.google": "🔵 Google",
    "settings.account.loginMethod.github": "⚫ GitHub",
    "settings.account.loginMethod.facebook": "🔵 Facebook",
    "settings.account.email": "Email:",
    "settings.account.username": "Username:",
    "settings.file.tooLarge": "File is too large. Please select a file smaller than 5MB",
    "settings.file.invalid": "Please select an image file",
    "settings.file.readError": "Unable to read file. Please try again",
    
    // Notifications
    "notifications.title": "Notifications",
    "notifications.markAllRead": "Mark all as read",
    "notifications.noNotifications": "No notifications",
    "notifications.new": "New",
    "notifications.justNow": "Just now",
    "notifications.completed": "Challenge Completed",
    "notifications.completedMsg": "You completed \"Debug Function\" challenge",
    "notifications.rankUp": "Rank Up",
    "notifications.rankUpMsg": "Congratulations, you reached Silver rank",
    "notifications.viewAll": "View all notifications",
    
    // Chat
    "chat.title": "BugHunter AI",
    "chat.subtitle": "Smart Assistant",
    "chat.welcome": "Hello! 👋 I'm BugHunter's AI assistant. I'm ready to help you learn debugging, answer questions, and support you on your programming journey. How can I help you?",
    "chat.placeholder": "Type your question...",
    "chat.typing": "AI is thinking...",
    "chat.clear": "Clear conversation",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "vi";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
