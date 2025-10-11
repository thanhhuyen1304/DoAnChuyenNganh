import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Menu, X, Globe, Moon, Sun, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "./contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  // Handle navigation
  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleSignup = () => {
    window.location.href = '/register';
  };

  const handleDashboard = () => {
    if (user?.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const navItems = [
    { labelKey: "nav.courses", href: "#courses" },
    { labelKey: "nav.challenges", href: "#challenges" },
    { labelKey: "nav.leaderboard", href: "#leaderboard" },
    { labelKey: "nav.blog", href: "#blog" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow group-hover:shadow-elegant transition-all duration-300">
              <span className="text-2xl font-bold font-code">🐛</span>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BugHunter
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 relative group"
              >
                {t(item.labelKey)}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-popover">
                <DropdownMenuItem 
                  onClick={() => setLanguage("vi")}
                  className="cursor-pointer"
                >
                  🇻🇳 Tiếng Việt
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage("en")}
                  className="cursor-pointer"
                >
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.username}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-popover">
                    <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => window.location.href = '/admin/dashboard'} className="cursor-pointer">
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleLogin}>
                    {t("auth.login")}
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    onClick={handleSignup}
                  >
                    {t("auth.signup")}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(item.labelKey)}
                </a>
              ))}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {language === "vi" ? "EN" : "VI"}
                </Button>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleDashboard}>
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    {user.role === 'admin' && (
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin/dashboard'}>
                        Admin Panel
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleLogin}>
                      {t("auth.login")}
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-gradient-primary"
                      onClick={handleSignup}
                    >
                      {t("auth.signup")}
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
