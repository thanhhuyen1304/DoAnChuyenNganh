import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Code2, Star, Users } from 'lucide-react';

interface Challenge {
  _id: string;
  title: string;
  description: string;
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
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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

  useEffect(() => {
    fetchChallenges();
  }, [selectedLanguage]);
  // refetch when favoriteIds changes (for filtered views)
  useEffect(() => {
    fetchChallenges();
  }, [favoriteIds]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const base = API_BASE.replace(/\/$/, '');
      const url = selectedLanguage
        ? `${base}/challenges?language=${encodeURIComponent(selectedLanguage)}`
        : `${base}/challenges`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let list = data.data.challenges as Challenge[];
        if (Array.isArray(favoriteIds) && favoriteIds.length > 0) {
          const idSet = new Set(favoriteIds);
          list = list.filter((c) => idSet.has(c._id));
        }
        setChallenges(list);
        setCurrentPage(1); // reset to first page on new data
      } else {
        setError(data.message || 'Failed to fetch challenges');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    const token = localStorage.getItem('token');
    
    // Optimistic update
    const isCurrentlyFavorite = myFavIds.includes(id);
    const newFavIds = isCurrentlyFavorite
      ? myFavIds.filter(favId => favId !== id)
      : [...myFavIds, id];
    
    setMyFavIds(newFavIds);
    // Update localStorage immediately
    localStorage.setItem('favoriteChallenges', JSON.stringify(newFavIds));

    // If user is logged in, sync with server
    if (token) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
          if (data.isFavorite !== undefined) {
            setMyFavIds((prev) => {
              const set = new Set(prev);
              if (data.isFavorite) set.add(id);
              else set.delete(id);
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

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(challenges.length / ITEMS_PER_PAGE));
  const paginated = challenges.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {paginated.map((challenge) => (
        <Card
          key={challenge._id}
          className="!bg-white dark:!bg-gray-900 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
          onClick={() => window.location.href = `/challenge/${challenge._id}`}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{challenge.title}</CardTitle>
                <CardDescription>{challenge.description}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(challenge._id); }}
                    aria-label="Toggle favorite"
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-200">
                      {myFavIds.includes(challenge._id) ? (
                        // Larger filled star with yellow stroke (viền vàng) and subtle shadow
                        <svg className="w-5 h-5 text-yellow-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192L12 .587z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <Star className="w-4 h-4 text-gray-400" />
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
              <Badge variant="outline" className="bg-primary-50/50">
                {challenge.language}
              </Badge>
              <Badge 
                variant="outline" 
                className={`${getCategoryColor(challenge.category)} bg-opacity-50`}
              >
                {challenge.category}
              </Badge>
              <Badge variant="outline" className="bg-green-50/50">
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
        <div className="flex items-center justify-center gap-2 mt-4">
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
                className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
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