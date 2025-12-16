import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { User, Trophy, Target, Clock, ArrowRight, Home as HomeIcon, List, Star, Code2, Award, Flag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ChallengeList from '@/components/challenges/ChallengeList';
import { Achievements } from '@/components/practice/Achievements';
import PersonalPage from '@/components/pages/personal';
import Header from '../Header';
import { getApiBase } from '@/lib/apiBase';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [view, setView] = useState<'home' | 'library' | 'achievements' | 'favorites' | 'timeline'>('library');
  const [activityDays, setActivityDays] = useState<Record<string, { logins: number; submissions: number }>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const { language } = useLanguage();

  // Function to get activity intensity (0-100)
  const getActivityIntensity = (logins: number, submissions: number): number => {
    // Login counts as 1 point, submission counts as 3 points
    const totalPoints = logins * 1 + submissions * 3;
    // Max intensity is 100, scale based on max points (e.g., 10+ = max intensity)
    const maxPoints = 10;
    return Math.min(100, (totalPoints / maxPoints) * 100);
  };

  // Function to get color based on intensity (fire theme: yellow -> orange -> red)
  const getActivityColor = (intensity: number, isToday: boolean): string => {
    if (intensity === 0) {
      return isToday 
        ? 'bg-gray-200/30 dark:bg-gray-700/30 ring-1 ring-primary-500' 
        : 'bg-gray-200/30 dark:bg-gray-700/30';
    }
    
    // Fire gradient with glow effects: yellow (low) -> orange (medium) -> red (high)
    if (intensity < 20) {
      return `bg-gradient-to-br from-yellow-300/60 to-yellow-400/50 dark:from-yellow-900/50 dark:to-yellow-800/40 shadow-yellow-400/20 shadow-sm ${isToday ? 'ring-1 ring-yellow-400' : ''}`;
    } else if (intensity < 40) {
      return `bg-gradient-to-br from-yellow-400/70 to-orange-300/60 dark:from-yellow-800/60 dark:to-orange-900/50 shadow-yellow-400/30 shadow-md ${isToday ? 'ring-1 ring-yellow-400' : ''}`;
    } else if (intensity < 60) {
      return `bg-gradient-to-br from-orange-400/80 to-orange-500/70 dark:from-orange-800/70 dark:to-orange-700/60 shadow-orange-400/40 shadow-md ${isToday ? 'ring-1 ring-orange-400' : ''}`;
    } else if (intensity < 80) {
      return `bg-gradient-to-br from-orange-500/90 to-red-400/80 dark:from-orange-700/80 dark:to-red-800/70 shadow-orange-500/50 shadow-lg ${isToday ? 'ring-1 ring-orange-500' : ''}`;
    } else {
      return `bg-gradient-to-br from-red-500/95 to-red-600/90 dark:from-red-600/90 dark:to-red-700/80 shadow-red-500/60 shadow-lg ${isToday ? 'ring-2 ring-red-400' : ''}`;
    }
  };

  // Favorites view helper component
  const FavoritesView: React.FC = () => {
    const [favIds, setFavIds] = useState<string[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(true);

    // Load favorites from server on mount
    useEffect(() => {
      const loadFavorites = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          // If not logged in, try to load from localStorage as fallback
          try {
            const raw = localStorage.getItem('favoriteChallenges');
            const parsed = raw ? JSON.parse(raw) : [];
            setFavIds(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setFavIds([]);
          }
          setLoadingFavorites(false);
          return;
        }

        try {
          const API_BASE = getApiBase();
          const response = await fetch(`${API_BASE}/favorites`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const favoriteIds = await response.json();
            setFavIds(Array.isArray(favoriteIds) ? favoriteIds : []);
            // Sync to localStorage
            localStorage.setItem('favoriteChallenges', JSON.stringify(favoriteIds));
          } else {
            // Fallback to localStorage if API fails
            try {
              const raw = localStorage.getItem('favoriteChallenges');
              const parsed = raw ? JSON.parse(raw) : [];
              setFavIds(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              setFavIds([]);
            }
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
          // Fallback to localStorage
          try {
            const raw = localStorage.getItem('favoriteChallenges');
            const parsed = raw ? JSON.parse(raw) : [];
            setFavIds(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setFavIds([]);
          }
        } finally {
          setLoadingFavorites(false);
        }
      };

      loadFavorites();
    }, []);

    // Listen for favorite changes from ChallengeList component
    useEffect(() => {
      const handleFavoriteChange = () => {
        const raw = localStorage.getItem('favoriteChallenges');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setFavIds(parsed);
          } catch (e) {
            // Ignore parse errors
          }
        }
      };

      // Listen to storage events for cross-component updates
      window.addEventListener('storage', handleFavoriteChange);

      // Listen to custom event for same-window updates
      window.addEventListener('favorites-changed', handleFavoriteChange);

      return () => {
        window.removeEventListener('storage', handleFavoriteChange);
        window.removeEventListener('favorites-changed', handleFavoriteChange);
      };
    }, []);

    if (loadingFavorites) {
      return (
        <div className="p-6 bg-white/60 dark:bg-gray-900/70 rounded-2xl text-center">
          {language === 'vi' ? 'Đang tải bài yêu thích...' : 'Loading favorites...'}
        </div>
      );
    }

    if (favIds.length === 0) {
      return <div className="p-6 bg-white/60 dark:bg-gray-900/70 rounded-2xl">{language === 'vi' ? 'Bạn chưa có bài yêu thích nào.' : 'You have no favorite challenges.'}</div>;
    }

    return (
      <div>
        {favIds.length === 0 ? (
          <div className="p-6 text-center">
            {language === 'vi' ? 'Bạn chưa có bài yêu thích nào.' : 'You have no favorite challenges.'}
          </div>
        ) : (
          <ChallengeList favoriteIds={favIds} />
        )}
      </div>
    );
  };

  const HomeInLibrary: React.FC = () => {
    return (
      <div className="p-6 bg-white/60 dark:bg-gray-900/70 rounded-2xl">
        <h3 className="text-lg font-semibold mb-2">{language === 'vi' ? 'Trang chủ' : 'Home'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{language === 'vi' ? 'Chào mừng bạn đến trang chủ — nội dung được hiển thị trong cột Kho của tôi.' : 'Welcome to the home view — content rendered inside the My Library column.'}</p>
        <div className="mt-4">
          <Button onClick={() => setView('library')} className="mr-2">{language === 'vi' ? 'Xem Library' : 'View Library'}</Button>
          <Button variant="outline" onClick={() => setView('favorites')}>{language === 'vi' ? 'Xem Yêu thích' : 'View Favorites'}</Button>
        </div>
      </div>
    );
  };

  // Update current date and check for date change
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate(now);
    };

    // Update immediately
    updateDate();

    // Update every minute to catch date changes
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  // Function to load completed challenges
  const loadCompletedChallenges = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/users/me/completed-challenges`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Completed challenges response:', data);
          if (data.success && Array.isArray(data.completedChallenges)) {
            setCompletedChallengeIds(data.completedChallenges);
            console.log('Loaded completed challenge IDs:', data.completedChallenges);
          }
        } else {
          console.error('Failed to load completed challenges:', response.status);
        }
      } catch (error) {
        console.error('Error loading completed challenges:', error);
      }
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsVisible(true);

      // Load completed challenges on mount
      loadCompletedChallenges();

      // Load existing activities
      const storedActivities = localStorage.getItem('activityDetails');
      let activities: Record<string, { logins: number; submissions: number }> = storedActivities 
        ? JSON.parse(storedActivities) 
        : {};
      
      // Clean up future dates and keep only past/today dates
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const cleanedActivities: Record<string, { logins: number; submissions: number }> = {};
      
      Object.keys(activities).forEach(dateStr => {
        const date = new Date(dateStr);
        const dateOnly = date.toISOString().split('T')[0];
        // Only keep dates that are today or in the past
        if (dateOnly <= todayStr) {
          cleanedActivities[dateStr] = activities[dateStr];
        }
      });
      
      activities = cleanedActivities;
      
      // Record today's login activity only if first visit today
      const lastLoginDate = localStorage.getItem('lastLoginDate');
      
      // Only increment if this is the first login today
      if (lastLoginDate !== todayStr) {
        // Initialize today if not exists
        if (!activities[todayStr]) {
          activities[todayStr] = { logins: 0, submissions: 0 };
        }
        
        // Increment login count for today
        activities[todayStr].logins += 1;
        localStorage.setItem('lastLoginDate', todayStr);
      }
      
      // Save cleaned activities
      localStorage.setItem('activityDetails', JSON.stringify(activities));
      setActivityDays(activities);
    } else {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  }, []);

  // Update activity days when currentDate changes (only for date detection, not incrementing)
  useEffect(() => {
    // Just reload activities to refresh display, don't increment login
    const storedActivities = localStorage.getItem('activityDetails');
    if (storedActivities) {
      const activities: Record<string, { logins: number; submissions: number }> = JSON.parse(storedActivities);
      setActivityDays(activities);
    }
  }, [currentDate]);

  // Listen for submission events (from anywhere in the app)
  useEffect(() => {
    const handleSubmission = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const storedActivities = localStorage.getItem('activityDetails');
      let activities: Record<string, { logins: number; submissions: number }> = storedActivities 
        ? JSON.parse(storedActivities) 
        : {};
      
      if (!activities[todayStr]) {
        activities[todayStr] = { logins: 0, submissions: 0 };
      }
      
      activities[todayStr].submissions += 1;
      localStorage.setItem('activityDetails', JSON.stringify(activities));
      setActivityDays({ ...activities });
    };

    // Listen to custom event for submissions
    window.addEventListener('challenge-submitted', handleSubmission);
    
    return () => {
      window.removeEventListener('challenge-submitted', handleSubmission);
    };
  }, [loadCompletedChallenges]);

  // Listen for challenge completion events to reload completed challenges
  useEffect(() => {
    const handleChallengeCompleted = () => {
      console.log('Challenge completed event received, reloading completed challenges...');
      loadCompletedChallenges();
    };

    // Listen to custom event for challenge completion
    window.addEventListener('challenge-completed', handleChallengeCompleted);
    // Also listen to challenge-submitted for immediate update
    window.addEventListener('challenge-submitted', handleChallengeCompleted);
    
    return () => {
      window.removeEventListener('challenge-completed', handleChallengeCompleted);
      window.removeEventListener('challenge-submitted', handleChallengeCompleted);
    };
  }, [loadCompletedChallenges]);

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-start py-8 md:py-12 overflow-visible relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">

          {/* Main Content */}
        <div className={`py-6 pt-2 relative z-20 transition-all duration-500 font-sans text-gray-700 dark:text-gray-200 ${isVisible ? 'ml-60' : 'ml-16'}`}>

          {/* My Library / Favorites */}
          <div className="mt-0 relative z-20">
            <div className="w-full">
              {/* Left column - controls (styled like Admin sidebar) */}
              <aside className={`fixed top-0 left-0 h-full z-10 transition-all duration-300 ${isVisible ? 'w-60' : 'w-16'} bg-white dark:bg-gray-900/70 backdrop-blur-sm border-r border-gray-100/20 dark:border-gray-700/50 overflow-y-auto pb-6 pt-2`}>
                {/* Sidebar toggle (matches AdminDashboard) */}
                <button
                  aria-label="Toggle sidebar"
                  onClick={() => setIsVisible(!isVisible)}
                  className="w-full py-6 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-3"
                >
                  <Code2 className="w-6 h-6 text-primary-500" />
                  {isVisible && <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{language === 'vi' ? 'Kho của tôi' : 'My Library'}</div>}
                </button>

                <nav className="p-4 space-y-6 w-full">
                  <div>
                    <button
                      onClick={() => setView('library')}
                      className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                        view === 'library' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                    >
                      <List
                        className={`w-5 h-5 transition-all duration-200 ${view === 'library' ? 'scale-110 text-pink-400 dark:text-pink-200' : 'text-gray-500 dark:text-gray-400'}`}
                      />
                      {isVisible && <span className={`truncate ${view === 'library' ? 'text-pink-400 dark:text-pink-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{language === 'vi' ? 'Thư viện' : 'Library'}</span>}
                    </button>

                    <button
                      onClick={() => setView('achievements')}
                      className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                        view === 'achievements' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                    >
                      <Award
                        className={`w-5 h-5 transition-all duration-200 ${view === 'achievements' ? 'scale-110 text-yellow-400 dark:text-yellow-200' : 'text-gray-500 dark:text-gray-400'}`}
                      />
                      {isVisible && <span className={`truncate ${view === 'achievements' ? 'text-yellow-400 dark:text-yellow-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{language === 'vi' ? 'Thành tựu' : 'Achievements'}</span>}
                    </button>

                    <button
                      onClick={() => setView('timeline')}
                      className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hoverbg-gray-800 transition-all duration-200 ${
                        view === 'timeline' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                    >
                      <Flag
                        className={`w-5 h-5 transition-all duration-200 ${view === 'timeline' ? 'scale-110 text-indigo-500 dark:text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}
                      />
                      {isVisible && <span className={`truncate ${view === 'timeline' ? 'text-indigo-500 dark:text-indigo-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{language === 'vi' ? 'Lộ trình học tập' : 'Learning Path'}</span>}
                    </button>

                    <button
                      onClick={() => setView('favorites')}
                      className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                        view === 'favorites' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 transition-all duration-200 ${view === 'favorites' ? 'scale-110 text-purple-400 dark:text-purple-200' : 'text-gray-500 dark:text-gray-400'}`}
                      />
                      {isVisible && <span className={`truncate ${view === 'favorites' ? 'text-purple-400 dark:text-purple-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{language === 'vi' ? 'Yêu thích của tôi' : 'My Favorites'}</span>}
                    </button>
                  </div>
                </nav>
              </aside>

              {/* Right column - content */}
              <div className="top-16 w-full transition-all duration-500 ease-in-out px-6">
                {/* Calendar - Fixed to right edge */}
                <div className="fixed right-10 top-16 z-30 w-[280px] transition-all duration-700 transform hover:scale-[1.02]">
                  <Card className="!bg-white dark:!bg-gray-900 border border-gray-100/20 dark:border-gray-700/50 shadow-[0_0_25px_rgba(162,89,255,0.15)] hover:shadow-[0_0_35px_rgba(162,89,255,0.2)] transition-all duration-300">
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {language === 'vi' ? 'Chuỗi hoạt động' : 'Activity Streak'}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-yellow-300/50 dark:bg-yellow-900/40" />
                            <span>{language === 'vi' ? 'Ít' : 'Low'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-orange-400/70 dark:bg-orange-800/60" />
                            <span>{language === 'vi' ? 'Trung bình' : 'Medium'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-red-500/90 dark:bg-red-600/80" />
                            <span>{language === 'vi' ? 'Nhiều' : 'High'}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div>
                        {/* Current Month and Year */}
                        <div className="text-xs font-medium text-center mb-2 text-muted-foreground">
                          {currentDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}
                        </div>
                        
                        {/* Day Labels */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                            <div key={day} className="text-[10px] font-medium text-center text-muted-foreground">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            // Get first day of current month
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const firstDayOfMonth = new Date(year, month, 1);
                            
                            // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
                            // Adjust for Vietnamese week starting on Monday (T2)
                            let firstDayOfWeek = firstDayOfMonth.getDay();
                            firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert Sunday (0) to 6, others -1
                            
                            // Calculate how many days to show (always show 35 days = 5 weeks)
                            const totalCells = 35;
                            
                            // Start date for calendar grid (may include previous month's days)
                            const startDate = new Date(year, month, 1);
                            startDate.setDate(startDate.getDate() - firstDayOfWeek);
                            
                            // Get today's date for comparison
                            const today = new Date();
                            const todayYear = today.getFullYear();
                            const todayMonth = today.getMonth();
                            const todayDate = today.getDate();
                            
                            return [...Array(totalCells)].map((_, i) => {
                              const displayDate = new Date(startDate);
                              displayDate.setDate(startDate.getDate() + i);
                              
                              const displayYear = displayDate.getFullYear();
                              const displayMonth = displayDate.getMonth();
                              const displayDay = displayDate.getDate();
                              
                              // Check if this is today
                              const isToday = displayYear === todayYear && 
                                            displayMonth === todayMonth && 
                                            displayDay === todayDate;
                              
                              const dateStr = displayDate.toISOString().split('T')[0];
                              
                              // Check if this date is in the future
                              const isFuture = displayYear > todayYear || 
                                             (displayYear === todayYear && displayMonth > todayMonth) ||
                                             (displayYear === todayYear && displayMonth === todayMonth && displayDay > todayDate);
                              
                              // Only show activity for past dates and today, not future dates
                              const dayActivity = (!isFuture && activityDays[dateStr]) 
                                ? activityDays[dateStr] 
                                : { logins: 0, submissions: 0 };
                              
                              const intensity = getActivityIntensity(dayActivity.logins, dayActivity.submissions);
                              const hasActivity = !isFuture && (dayActivity.logins > 0 || dayActivity.submissions > 0);
                              
                              // Check if day is in current month
                              const isCurrentMonth = displayMonth === month;
                              
                              // Build activity tooltip
                              let tooltipText = displayDate.toLocaleDateString('vi-VN');
                              if (isFuture) {
                                tooltipText += `\n${language === 'vi' ? 'Ngày trong tương lai' : 'Future date'}`;
                              } else if (hasActivity) {
                                tooltipText += `\n${language === 'vi' ? 'Đăng nhập' : 'Logins'}: ${dayActivity.logins}`;
                                tooltipText += `\n${language === 'vi' ? 'Bài tập' : 'Submissions'}: ${dayActivity.submissions}`;
                              }
                          
                              return (
                                <div
                                  key={i}
                                  className={`
                                    relative w-full aspect-square rounded-[2px] cursor-pointer group transition-all
                                    ${isFuture 
                                      ? 'bg-gray-100/20 dark:bg-gray-800/20' 
                                      : getActivityColor(intensity, isToday)}
                                    hover:scale-110 hover:z-10
                                    ${!isCurrentMonth ? 'opacity-40' : ''}
                                    ${isFuture ? 'cursor-not-allowed' : ''}
                                  `}
                                  title={tooltipText}
                                >
                                  <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-medium ${isFuture ? 'text-gray-400 dark:text-gray-600' : 'text-muted-foreground'}`}>
                                    {displayDay}
                                  </span>
                                  {hasActivity && !isFuture && intensity > 50 && (
                                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-primary-500/60"></div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats cards grid */}
                <div className="mb-8 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pr-0 lg:pr-80">
                    {/* Experience Card */}
                    <Card className="!bg-white dark:!bg-gray-900 border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Điểm kinh nghiệm' : 'Experience'}</CardTitle>
                        <User className="h-4 w-4 text-primary-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
                          {user.experience || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rank: {user.rank || 'Newbie'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Challenges Card */}
                    <Card className="!bg-white dark:!bg-gray-900 border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Bài tập đã làm' : 'Challenges'}</CardTitle>
                        <Target className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
                          {completedChallengeIds.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {completedChallengeIds.length === 0
                            ? (language === 'vi' ? 'Chưa có bài tập nào' : 'No challenges yet')
                            : (language === 'vi' ? 'Bài tập đã hoàn thành' : 'Challenges completed')}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Badges Card */}
                    <Card className="!bg-white dark:!bg-gray-900 border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Huy hiệu' : 'Badges'}</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
                          {user.badges?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'vi' ? 'Huy hiệu đã đạt được' : 'Badges earned'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Learning Time Card */}
                    <Card className="!bg-white dark:!bg-gray-900 border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Thời gian học' : 'Learning Time'}</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">0h</div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'vi' ? 'Tổng thời gian luyện tập' : 'Total practice time'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {view === 'home' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">{language === 'vi' ? 'Trang chủ' : 'Home'}</h2>
                    <HomeInLibrary />
                  </div>
                )}
                {view === 'library' && (
                  <div className="w-full pr-0 lg:pr-80">
                    <h2 className="text-xl font-bold mb-4">{language === 'vi' ? 'Bài tập đã hoàn thành' : 'Completed Challenges'}</h2>
                    <div className="w-full">
                      {completedChallengeIds.length === 0 ? (
                        <div className="p-6 bg-white/60 dark:bg-gray-900/70 rounded-2xl text-center">
                          {language === 'vi' ? 'Bạn chưa hoàn thành bài tập nào.' : 'You have not completed any challenges yet.'}
                        </div>
                      ) : (
                        <ChallengeList completedIds={completedChallengeIds} />
                      )}
                    </div>
                  </div>
                )}

                {view === 'achievements' && (
                  <div className="pr-0 lg:pr-80">
                    <h2 className="text-xl font-bold mb-4">{language === 'vi' ? 'Thành tựu' : 'Achievements'}</h2>
                    <Achievements />
                  </div>
                )}

                {view === 'favorites' && (
                  <div className="pr-0 lg:pr-80">
                    <h2 className="text-xl font-bold mb-4">{language === 'vi' ? 'Bài yêu thích' : 'My Favorites'}</h2>
                    <FavoritesView />
                  </div>
                )}

                {view === 'timeline' && (
                  <div className="pr-0 lg:pr-80">
                    <h2 className="text-xl font-bold mb-4">{language === 'vi' ? 'Lộ trình học tập' : 'Learning Path'}</h2>
                    <PersonalPage user={user} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Panel Link */}
          {user.role === 'admin' && (
            <div className={`mt-6 transition-all duration-700 delay-200 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Card className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950 dark:to-rose-950 backdrop-blur-xl border border-orange-200/50 dark:border-orange-800/50 hover:shadow-[0_0_25px_rgba(255,89,89,0.15)] transition-all duration-300 hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600 dark:from-orange-400 dark:to-rose-400">
                    {language === 'vi' ? 'Quản trị viên' : 'Admin Panel'}
                  </CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    {language === 'vi' ? 'Quản lý hệ thống và bài tập' : 'Manage system and challenges'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                    onClick={() => window.location.href = '/admin/dashboard'}
                  >
                    <span>{language === 'vi' ? 'Truy cập Admin Panel' : 'Access Admin Panel'}</span>
                    <ArrowRight size={18} className="ml-2 inline-block group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Background decorations (Profile-like: stronger opacity + larger blur) */}
          <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
