import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '../../lib/apiBase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  Filter,
  X,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { EditChallengeModal } from './EditChallengeModal';

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

interface ChallengeManagementProps {
  className?: string;
  onRefresh?: () => void;
}

const ChallengeManagement: React.FC<ChallengeManagementProps> = ({ className = '', onRefresh }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { language } = useLanguage();
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  // Fetch all challenges
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const API_BASE = getApiBase();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/challenges/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setChallenges(data.data.challenges || []);
      } else {
        setError(data.message || 'Failed to fetch challenges');
      }
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Handle edit
  const handleEdit = (challenge: Challenge) => {
    setSelectedChallengeId(challenge._id);
    setEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (challengeId: string) => {
    if (!confirm(language === 'vi'
      ? 'Bạn có chắc chắn muốn xóa bài tập này?'
      : 'Are you sure you want to delete this challenge?')) {
      return;
    }

    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(language === 'vi' 
          ? 'Xóa bài tập thành công'
          : 'Challenge deleted successfully');
        fetchChallenges();
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (challengeId: string, currentStatus: boolean) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(language === 'vi' 
          ? `Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} bài tập`
          : `Challenge ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchChallenges();
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
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
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
    
    // Status filter
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && challenge.isActive) ||
      (selectedStatus === 'inactive' && !challenge.isActive);
    
    return matchesSearch && matchesDifficulty && matchesLanguage && matchesCategory && matchesStatus;
  });

  // Get unique values for filters
  const availableLanguages = Array.from(new Set(challenges.map(c => c.language))).sort();
  const availableCategories = Array.from(new Set(challenges.map(c => c.category))).sort();

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

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('all');
    setSelectedLanguage('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedDifficulty !== 'all' || 
    selectedLanguage !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all';

  if (loading) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>❌ {error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>✨ {success}</AlertDescription>
        </Alert>
      )}

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

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Danh mục:' : 'Category:'}
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-7 px-2 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Trạng thái:' : 'Status:'}
              </span>
              <div className="flex gap-1">
                {['all', 'active', 'inactive'].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status as 'all' | 'active' | 'inactive')}
                    className="h-7 text-xs"
                  >
                    {status === 'all' ? (language === 'vi' ? 'Tất cả' : 'All') :
                     status === 'active' ? (language === 'vi' ? 'Hoạt động' : 'Active') :
                     (language === 'vi' ? 'Tạm dừng' : 'Inactive')}
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
          {filteredChallenges.map((challenge) => (
            <Card
              key={challenge._id}
              className={`bg-white/95 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 transform transition-all duration-300 hover:shadow-xl ${
                !challenge.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg md:text-xl line-clamp-2">
                      {language === 'vi'
                        ? challenge.title
                        : challenge.titleEn || challenge.title}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2 mt-1">
                      {language === 'vi'
                        ? challenge.description
                        : challenge.descriptionEn || challenge.description}
                    </CardDescription>
                  </div>
                  
                  <Badge variant={challenge.isActive ? 'default' : 'secondary'}>
                    {challenge.isActive 
                      ? (language === 'vi' ? 'Hoạt động' : 'Active')
                      : (language === 'vi' ? 'Tạm dừng' : 'Inactive')}
                  </Badge>
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
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(challenge)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {language === 'vi' ? 'Sửa' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveStatus(challenge._id, challenge.isActive)}
                  >
                    {challenge.isActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(challenge._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditChallengeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        challengeId={selectedChallengeId}
        onUpdate={() => {
          fetchChallenges();
          if (onRefresh) onRefresh();
          setEditModalOpen(false);
        }}
      />
    </div>
  );
};

export default ChallengeManagement;