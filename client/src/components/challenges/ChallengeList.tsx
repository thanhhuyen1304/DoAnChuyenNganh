import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '../../lib/apiBase'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Code2, Star, Users } from 'lucide-react';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Syntax' | 'Logic' | 'Performance' | 'Security';
  points: number;
  isActive: boolean;
  createdAt: string;
  favorites: number;
  totalAttempts: number;
  successfulAttempts: number;
}

interface ChallengeListProps {
  selectedLanguage?: string;
  favoriteIds?: string[];
}

const ChallengeList: React.FC<ChallengeListProps> = ({ selectedLanguage, favoriteIds }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  const [myFavIds, setMyFavIds] = useState<string[]>([]);
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
          setMyFavIds(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setMyFavIds([]);
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
          setMyFavIds(Array.isArray(favoriteIds) ? favoriteIds : []);
          // Sync to localStorage
          localStorage.setItem('favoriteChallenges', JSON.stringify(favoriteIds));
        } else {
          // Fallback to localStorage if API fails
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
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem('favoriteChallenges');
          const parsed = raw ? JSON.parse(raw) : [];
          setMyFavIds(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setMyFavIds([]);
        }
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, []);

  const fetchChallenges = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const API_BASE = getApiBase();
      const base = API_BASE.replace(/\/$/, '');
      
      // Fetch all challenges by using a large limit and looping through pages
      let allChallenges: Challenge[] = [];
      let page = 1;
      const limit = 100; // Fetch 100 items per request
      let hasMore = true;
      
      console.log('[ChallengeList] Fetching challenges with language:', selectedLanguage);
      
      while (hasMore) {
        // Build URL with proper query params
        let url = `${base}/challenges?page=${page}&limit=${limit}`;
        
        // IMPORTANT: Only add language filter if it's not empty
        if (selectedLanguage && selectedLanguage.trim() !== '' && selectedLanguage !== 'All') {
          url += `&language=${encodeURIComponent(selectedLanguage.trim())}`;
          console.log('[ChallengeList] Adding language filter:', selectedLanguage.trim());
        } else {
          console.log('[ChallengeList] No language filter (fetching all languages)');
        }

        console.log('[ChallengeList] Fetching from URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
          const fetchedChallenges = data.data.challenges as Challenge[];
          console.log(`[ChallengeList] Page ${page}: Fetched ${fetchedChallenges.length} challenges`);
          
          if (fetchedChallenges.length > 0) {
            allChallenges = [...allChallenges, ...fetchedChallenges];
            
            // Check if there are more pages
            const pagination = data.data.pagination;
            console.log('[ChallengeList] Pagination:', pagination);
            
            if (pagination && page < pagination.pages) {
              page++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          console.error('[ChallengeList] API returned success=false:', data.message);
          setError(data.message || 'Failed to fetch challenges');
          hasMore = false;
        }
      }

      console.log(`[ChallengeList] Total challenges fetched: ${allChallenges.length}`);

      // Filter by favoriteIds if provided (can be used for favorites or completed challenges)
      if (Array.isArray(favoriteIds) && favoriteIds.length > 0) {
        const idSet = new Set(favoriteIds);
        allChallenges = allChallenges.filter((c) => idSet.has(c._id));
        console.log(`[ChallengeList] After filter: ${allChallenges.length} challenges`);
      }
      
      setChallenges(allChallenges);
      setCurrentPage(1); // reset to first page on new data
    } catch (err: any) {
      console.error('[ChallengeList] Error fetching challenges:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, favoriteIds]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const toggleFavorite = async (id: string) => {
    const token = localStorage.getItem('token');
    
    // Check current state
    const isCurrentlyFavorite = myFavIds.includes(id);
    console.log(`[ToggleFavorite] Challenge ${id} is currently ${isCurrentlyFavorite ? 'favorite' : 'not favorite'}`);
    
    // Optimistic update - update UI immediately
    const newFavIds = isCurrentlyFavorite
      ? myFavIds.filter(favId => favId !== id) // Remove from favorites
      : [...myFavIds, id]; // Add to favorites
    
    // Update state immediately for instant UI feedback
    setMyFavIds(newFavIds);
    // Update localStorage immediately
    localStorage.setItem('favoriteChallenges', JSON.stringify(newFavIds));
    
    console.log(`[ToggleFavorite] Updated favorites:`, newFavIds);

    // If user is logged in, sync with server
    if (token) {
      try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/favorites/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ exerciseId: id }),
        });

        if (!response.ok) {
          // Revert optimistic update on error
          console.error(`[ToggleFavorite] Server error, reverting...`);
          setMyFavIds((prev) => {
            const set = new Set(prev);
            if (isCurrentlyFavorite) set.add(id);
            else set.delete(id);
            const revertedIds = Array.from(set);
            localStorage.setItem('favoriteChallenges', JSON.stringify(revertedIds));
            return revertedIds;
          });
          
          const errorData = await response.json().catch(() => ({}));
          console.error('Error toggling favorite:', errorData);
        } else {
          // Update state with server response to ensure sync
          const data = await response.json();
          console.log(`[ToggleFavorite] Server response:`, data);
          if (data.isFavorite !== undefined) {
            setMyFavIds((prev) => {
              const set = new Set(prev);
              if (data.isFavorite) {
                set.add(id);
                console.log(`[ToggleFavorite] Added ${id} to favorites`);
              } else {
                set.delete(id);
                console.log(`[ToggleFavorite] Removed ${id} from favorites`);
              }
              const arr = Array.from(set);
              localStorage.setItem('favoriteChallenges', JSON.stringify(arr));
              return arr;
            });
          }
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert optimistic update on error
        setMyFavIds((prev) => {
          const set = new Set(prev);
          if (isCurrentlyFavorite) set.add(id);
          else set.delete(id);
          const revertedIds = Array.from(set);
          localStorage.setItem('favoriteChallenges', JSON.stringify(revertedIds));
          return revertedIds;
        });
      }
    } else {
      // If not logged in, just use localStorage
      console.log(`[ToggleFavorite] Not logged in, using localStorage only`);
    }
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  const getCategoryColor = (category: Challenge['category']) => {
    switch (category) {
      case 'Syntax': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Logic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Performance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Security': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Code2 className="w-12 h-12 text-primary-400" />
          <p className="text-lg">
            {language === 'vi'
              ? 'Không tìm thấy bài tập nào.'
              : 'No challenges found.'}
          </p>
        </div>
      </div>
    );
  }

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(challenges.length / ITEMS_PER_PAGE));
  const paginated = challenges.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {paginated.map((challenge) => (
        <Card
            key={challenge._id}
            className="!bg-white dark:!bg-gray-900 transform transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl will-change-transform relative"
            onClick={(e) => {
              // Only navigate if click is not on a button or interactive element
              const target = e.target as HTMLElement;
              if (target.closest('button') || target.closest('[role="button"]')) {
                return;
              }
              window.location.href = `/practice?challengeId=${challenge._id}`;
            }}
          >
          <CardHeader className="p-6">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <CardTitle className="text-xl">
                  {language === 'vi'
                    ? challenge.title
                    : challenge.titleEn || challenge.title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {language === 'vi'
                    ? challenge.description
                    : challenge.descriptionEn || challenge.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 relative">
                  <button
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      toggleFavorite(challenge._id); 
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    aria-label="Toggle favorite"
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative z-50"
                    type="button"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 pointer-events-none">
                      {myFavIds.includes(challenge._id) ? (
                        // Filled star - yellow when favorited
                        <svg 
                          className="w-5 h-5 text-yellow-400 drop-shadow-md transition-all duration-300 animate-in fade-in zoom-in-95" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          xmlns="http://www.w3.org/2000/svg" 
                          aria-hidden="true"
                        >
                          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192L12 .587z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        // Empty star - gray when not favorited
                        <Star className="w-4 h-4 text-gray-400 transition-all duration-300 animate-in fade-in zoom-in-95" />
                      )}
                    </span>
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {challenge.favorites}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {challenge.totalAttempts > 0
                      ? `${Math.round((challenge.successfulAttempts / challenge.totalAttempts) * 100)}%`
                      : '0%'
                    }
                    {challenge.totalAttempts > 0 && (
                      <span className="text-xs ml-1">({challenge.totalAttempts})</span>
                    )}
                  </span>
                </div>
                <Badge 
                  className={getDifficultyColor(challenge.difficulty)}
                  variant="secondary"
                >
                  {challenge.difficulty}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="bg-primary-50/50 text-xs px-2 py-0.5">
                {challenge.language}
              </Badge>
              <Badge 
                variant="outline" 
                className={`${getCategoryColor(challenge.category)} bg-opacity-50 text-xs px-2 py-0.5`}
              >
                {challenge.category}
              </Badge>
              <Badge variant="outline" className="bg-green-50/50 text-xs px-2 py-0.5">
                {challenge.points} {language === 'vi' ? 'điểm' : 'points'}
              </Badge>
            </div>
          </CardHeader>
          
          {/* <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
              {language === 'vi' ? 'Click để giải bài tập' : 'Click to solve this challenge'}
            </p>
          </CardContent> */}
        </Card>
      ))}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 w-full py-4">
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.max(1, p - 1)); }}
            className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1;
            return (
              <button
                key={page}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(page); }}
                className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }}
            className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ChallengeList;