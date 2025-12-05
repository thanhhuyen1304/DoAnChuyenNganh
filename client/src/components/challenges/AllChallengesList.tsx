import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '../../lib/apiBase';
import { buildApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Code2, 
  Star, 
  Users, 
  Search, 
  Grid3x3, 
  List,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Syntax' | 'Logic' | 'Performance' | 'Security';
  tags?: string[];
  points: number;
  isActive: boolean;
  createdAt: string;
  favorites: number;
  totalAttempts: number;
  successfulAttempts: number;
}

interface AllChallengesListProps {
  className?: string;
}

const AllChallengesList: React.FC<AllChallengesListProps> = ({ className = '' }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
  
  // Completed challenges
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  
  // Favorites
  const [myFavIds, setMyFavIds] = useState<string[]>([]);

  // Load completed challenges
  const loadCompletedChallenges = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingCompleted(false);
      return;
    }

    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/users/me/completed-challenges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.completedChallenges)) {
          setCompletedChallengeIds(new Set(data.completedChallenges));
        }
      }
    } catch (error) {
      console.error('Error loading completed challenges:', error);
    } finally {
      setLoadingCompleted(false);
    }
  }, []);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      try {
        const raw = localStorage.getItem('favoriteChallenges');
        const parsed = raw ? JSON.parse(raw) : [];
        setMyFavIds(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setMyFavIds([]);
      }
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
        setMyFavIds(Array.isArray(favoriteIds) ? favoriteIds : []);
        localStorage.setItem('favoriteChallenges', JSON.stringify(favoriteIds));
      } else {
        try {
          const raw = localStorage.getItem('favoriteChallenges');
          const parsed = raw ? JSON.parse(raw) : [];
          setMyFavIds(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setMyFavIds([]);
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      try {
        const raw = localStorage.getItem('favoriteChallenges');
        const parsed = raw ? JSON.parse(raw) : [];
        setMyFavIds(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setMyFavIds([]);
      }
    }
  }, []);

  // Fetch all challenges
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const API_BASE = getApiBase();
      const base = API_BASE.replace(/\/$/, '');
      
      let allChallenges: Challenge[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const url = `${base}/challenges?page=${page}&limit=${limit}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
          const fetchedChallenges = data.data.challenges as Challenge[];
          
          if (fetchedChallenges.length > 0) {
            allChallenges = [...allChallenges, ...fetchedChallenges];
            
            const pagination = data.data.pagination;
            if (pagination && page < pagination.pages) {
              page++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          setError(data.message || 'Failed to fetch challenges');
          hasMore = false;
        }
      }
      
      setChallenges(allChallenges);
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
    loadCompletedChallenges();
    loadFavorites();
  }, [fetchChallenges, loadCompletedChallenges, loadFavorites]);

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const isCurrentlyFavorite = myFavIds.includes(id);
    const newFavIds = isCurrentlyFavorite
      ? myFavIds.filter(favId => favId !== id)
      : [...myFavIds, id];
    
    setMyFavIds(newFavIds);
    localStorage.setItem('favoriteChallenges', JSON.stringify(newFavIds));
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const API_BASE = getApiBase();
        await fetch(`${API_BASE}/favorites/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ exerciseId: id }),
        });
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert on error
        setMyFavIds(isCurrentlyFavorite ? [...myFavIds, id] : myFavIds.filter(favId => favId !== id));
      }
    }
  };

  // Filter challenges
  const filteredChallenges = challenges.filter((challenge) => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (challenge.titleEn && challenge.titleEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (challenge.descriptionEn && challenge.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (challenge.tags && challenge.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Difficulty filter
    const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty;
    
    // Language filter
    const matchesLanguage = selectedLanguage === 'all' || challenge.language === selectedLanguage;
    
    // Status filter
    const isCompleted = completedChallengeIds.has(challenge._id);
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'completed' && isCompleted) ||
      (selectedStatus === 'incomplete' && !isCompleted);
    
    return matchesSearch && matchesDifficulty && matchesLanguage && matchesStatus;
  });

  // Get unique languages from challenges
  const availableLanguages = Array.from(new Set(challenges.map(c => c.language))).sort();

  // Get difficulty color
  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  // Get category color
  const getCategoryColor = (category: Challenge['category']) => {
    switch (category) {
      case 'Syntax': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Logic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Performance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Security': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  // Handle challenge click
  const handleChallengeClick = (challengeId: string) => {
    navigate(`/practice?challengeId=${challengeId}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('all');
    setSelectedLanguage('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedDifficulty !== 'all' || 
    selectedLanguage !== 'all' || selectedStatus !== 'all';

  if (loading || loadingCompleted) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Bar */}
      <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm bài tập...' : 'Search challenges...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'vi' ? 'Lọc:' : 'Filters:'}
              </span>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Độ khó:' : 'Difficulty:'}
              </span>
              <div className="flex gap-1">
                {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <Button
                    key={diff}
                    variant={selectedDifficulty === diff ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty(diff)}
                    className="h-7 text-xs"
                  >
                    {diff === 'all' ? (language === 'vi' ? 'Tất cả' : 'All') : diff}
                  </Button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Ngôn ngữ:' : 'Language:'}
              </span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="h-7 px-2 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Trạng thái:' : 'Status:'}
              </span>
              <div className="flex gap-1">
                {['all', 'completed', 'incomplete'].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status as 'all' | 'completed' | 'incomplete')}
                    className="h-7 text-xs"
                  >
                    {status === 'all' ? (language === 'vi' ? 'Tất cả' : 'All') :
                     status === 'completed' ? (language === 'vi' ? 'Đã làm' : 'Completed') :
                     (language === 'vi' ? 'Chưa làm' : 'Incomplete')}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 p-0"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                {language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'vi' 
              ? `Hiển thị ${filteredChallenges.length} / ${challenges.length} bài tập`
              : `Showing ${filteredChallenges.length} / ${challenges.length} challenges`}
          </div>
        </div>
      </div>

      {/* Challenges Display */}
      {filteredChallenges.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <Code2 className="w-12 h-12 text-primary-400" />
            <p className="text-lg">
              {language === 'vi'
                ? 'Không tìm thấy bài tập nào phù hợp với bộ lọc.'
                : 'No challenges found matching your filters.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredChallenges.map((challenge) => {
            const isCompleted = completedChallengeIds.has(challenge._id);
            const isFavorite = myFavIds.includes(challenge._id);
            
            return (
              <Card
                key={challenge._id}
                className={`bg-white/95 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 transform transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl will-change-transform relative ${
                  isCompleted ? 'ring-2 ring-green-500/20' : ''
                }`}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[role="button"]')) {
                    return;
                  }
                  handleChallengeClick(challenge._id);
                }}
              >
                <CardHeader className="p-4 md:p-6">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                        <CardTitle className="text-lg md:text-xl line-clamp-2">
                          {language === 'vi'
                            ? challenge.title
                            : challenge.titleEn || challenge.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm line-clamp-2 mt-1">
                        {language === 'vi'
                          ? challenge.description
                          : challenge.descriptionEn || challenge.description}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(challenge._id);
                        }}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Toggle favorite"
                      >
                        {isFavorite ? (
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <Star className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tags and Info */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge 
                      className={getDifficultyColor(challenge.difficulty)}
                      variant="secondary"
                    >
                      {challenge.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {challenge.language}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getCategoryColor(challenge.category)} bg-opacity-50 text-xs`}
                    >
                      {challenge.category}
                    </Badge>
                    {challenge.tags && challenge.tags.length > 0 && (
                      challenge.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    )}
                    <Badge variant="outline" className="text-xs">
                      {challenge.points} {language === 'vi' ? 'điểm' : 'points'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {challenge.totalAttempts > 0
                          ? `${Math.round((challenge.successfulAttempts / challenge.totalAttempts) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{challenge.favorites}</span>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'vi' ? 'Đã hoàn thành' : 'Completed'}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllChallengesList;

