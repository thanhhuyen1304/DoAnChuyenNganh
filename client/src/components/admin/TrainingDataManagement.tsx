import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Upload, Loader2, Tag, Star, MessageSquare, Code2, List } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/use-toast';
import { buildApi } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TrainingData {
  _id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  priority: number;
  usageCount: number;
  rating?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Challenge {
  _id: string;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  category: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

const TrainingDataManagement: React.FC = () => {
  console.log('[TrainingDataManagement] Component rendering...');
  
  const { language } = useLanguage();
  const { toast } = useToast();
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrainingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'training' | 'challenges'>('training');
  
  // Challenges state
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengesPage, setChallengesPage] = useState(1);
  const [challengesTotalPages, setChallengesTotalPages] = useState(1);
  const [challengeSearch, setChallengeSearch] = useState('');
  const [challengeCategoryFilter, setChallengeCategoryFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    tags: '',
    priority: 1,
  });

  const getToken = () => localStorage.getItem('token');

  const fetchTrainingData = async () => {
    try {
      console.log('[TrainingDataManagement] Fetching training data...');
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const apiUrl = buildApi(`/training-data?${params}`);
      console.log('[TrainingDataManagement] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[TrainingDataManagement] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TrainingDataManagement] Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('[TrainingDataManagement] Response data:', data);
      
      if (data.success) {
        setTrainingData(data.data?.trainingData || data.data || []);
        setTotalPages(data.data?.pagination?.pages || 1);
        setError(null);
        console.log('[TrainingDataManagement] Training data loaded:', data.data?.trainingData?.length || 0);
      } else {
        throw new Error(data.message || 'Failed to fetch training data');
      }
    } catch (error) {
      console.error('[TrainingDataManagement] Fetch training data error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (language === 'vi' ? 'Không thể tải training data' : 'Failed to load training data');
      setError(errorMessage);
      
      // Only show toast if language is available
      if (language) {
        toast({
          title: language === 'vi' ? 'Lỗi' : 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      setTrainingData([]);
    } finally {
      setLoading(false);
      console.log('[TrainingDataManagement] Fetch completed, loading:', false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(buildApi('/training-data/categories'), {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    console.log('[TrainingDataManagement] Component mounted, fetching data...');
    console.log('[TrainingDataManagement] Language:', language);
    
    try {
      const apiUrl = buildApi('/training-data');
      console.log('[TrainingDataManagement] API URL:', apiUrl);
      
      if (!apiUrl || apiUrl === '/api/training-data') {
        console.warn('[TrainingDataManagement] API URL might be incorrect:', apiUrl);
      }
      
      fetchTrainingData();
      fetchCategories();
    } catch (error) {
      console.error('[TrainingDataManagement] Error in useEffect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize component';
      setError(errorMessage);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryFilter]);

  const fetchChallenges = async () => {
    try {
      setChallengesLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const params = new URLSearchParams({
        page: challengesPage.toString(),
        limit: '20',
      });
      if (challengeSearch) params.append('search', challengeSearch);
      if (challengeCategoryFilter && challengeCategoryFilter !== 'all') {
        params.append('category', challengeCategoryFilter);
      }

      const apiUrl = buildApi(`/challenges/admin/all?${params}`);
      console.log('[TrainingDataManagement] Fetching challenges, URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('[TrainingDataManagement] Challenges response:', data);

      if (data.success) {
        setChallenges(data.data?.challenges || data.data || []);
        setChallengesTotalPages(data.data?.pagination?.pages || 1);
      } else {
        throw new Error(data.message || 'Failed to fetch challenges');
      }
    } catch (error) {
      console.error('[TrainingDataManagement] Fetch challenges error:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : (language === 'vi' ? 'Không thể tải danh sách bài tập' : 'Failed to load challenges');
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'challenges') {
      fetchChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, challengesPage, challengeSearch, challengeCategoryFilter]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      tags: '',
      priority: 1,
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: TrainingData) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      tags: item.tags.join(', '),
      priority: item.priority,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      const payload = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        tags: tagsArray,
        priority: formData.priority,
      };

      const url = editingItem
        ? buildApi(`/training-data/${editingItem._id}`)
        : buildApi('/training-data');

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: editingItem
            ? (language === 'vi' ? 'Đã cập nhật training data' : 'Training data updated')
            : (language === 'vi' ? 'Đã tạo training data' : 'Training data created'),
        });
        setDialogOpen(false);
        fetchTrainingData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: error.message || (language === 'vi' ? 'Không thể lưu training data' : 'Failed to save training data'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'vi' ? 'Bạn có chắc muốn xóa?' : 'Are you sure you want to delete?')) {
      return;
    }

    try {
      const response = await fetch(buildApi(`/training-data/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Đã xóa training data' : 'Training data deleted',
        });
        fetchTrainingData();
      }
    } catch (error) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể xóa training data' : 'Failed to delete training data',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(buildApi(`/training-data/export?${params}`), {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Đã export training data' : 'Training data exported',
        });
      }
    } catch (error) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể export training data' : 'Failed to export training data',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        throw new Error('Invalid format');
      }

      const response = await fetch(buildApi('/training-data/bulk-import'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainingData: jsonData }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? `Đã import ${data.data.imported} training data` : `Imported ${data.data.imported} training data`,
        });
        fetchTrainingData();
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể import training data' : 'Failed to import training data',
        variant: 'destructive',
      });
    }
  };

  const handleExtractFromChat = async () => {
    try {
      setExtracting(true);
      const response = await fetch(buildApi('/training-data/extract-from-chat'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' 
            ? `Đã extract ${data.data.extracted} training data từ ChatHistory (${data.data.skipped} đã bỏ qua)`
            : `Extracted ${data.data.extracted} training data from ChatHistory (${data.data.skipped} skipped)`,
        });
        fetchTrainingData();
        fetchCategories();
      } else {
        throw new Error(data.message || 'Extract failed');
      }
    } catch (error: any) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: error.message || (language === 'vi' ? 'Không thể extract training data từ ChatHistory' : 'Failed to extract training data from ChatHistory'),
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  console.log('[TrainingDataManagement] Rendering component, loading:', loading, 'data count:', trainingData.length, 'error:', error, 'language:', language);

  // Always render, even if language is not available (use default)
  const displayLanguage = language || 'vi';

  return (
    <div className="space-y-4 pt-15 md:pt-19 overflow-visible">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'training'
              ? 'border-b-2 border-primary-500 text-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {displayLanguage === 'vi' ? 'Training Data' : 'Training Data'}
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'border-b-2 border-primary-500 text-primary-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {displayLanguage === 'vi' ? 'Danh sách bài tập' : 'Challenges'}
        </button>
      </div>

      {activeTab === 'training' && (
        <>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {displayLanguage === 'vi' ? 'Quản lý Training Data' : 'Training Data Management'}
          </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {displayLanguage === 'vi'
              ? 'Quản lý dữ liệu training cho ChatBox AI'
              : 'Manage training data for ChatBox AI'}
          </p>
        </div>
          <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            {language === 'vi' ? 'Export' : 'Export'}
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload size={16} className="mr-2" />
                {language === 'vi' ? 'Import' : 'Import'}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button 
            onClick={handleExtractFromChat} 
            variant="outline" 
            size="sm"
            disabled={extracting}
          >
            {extracting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {language === 'vi' ? 'Đang extract...' : 'Extracting...'}
              </>
            ) : (
              <>
                <MessageSquare size={16} className="mr-2" />
                {language === 'vi' ? 'Extract từ Chat' : 'Extract from Chat'}
              </>
            )}
          </Button>
          <Button onClick={handleCreate} size="sm">
            <Plus size={16} className="mr-2" />
            {language === 'vi' ? 'Thêm mới' : 'Add New'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-3 md:p-4">
            <p className="text-red-600 dark:text-red-400 text-xs md:text-sm">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter || 'all'} onValueChange={(value) => {
          setCategoryFilter(value === 'all' ? '' : value);
          setPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={language === 'vi' ? 'Tất cả danh mục' : 'All categories'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Training Data List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : trainingData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {language === 'vi' ? 'Chưa có training data nào' : 'No training data found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trainingData.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base md:text-lg break-words">
                        {item.question}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        {item.priority > 5 && (
                          <Badge variant="default" className="bg-yellow-500">
                            <Star size={12} className="mr-1" />
                            Priority {item.priority}
                          </Badge>
                        )}
                        {!item.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-2 break-words">
                      {item.answer.substring(0, 180)}...
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag size={12} />
                          {item.tags.join(', ')}
                        </div>
                      )}
                      <span>Used: {item.usageCount}</span>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          {item.rating}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-0 mt-3 md:ml-4 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item._id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {displayLanguage === 'vi' ? 'Trước' : 'Previous'}
              </Button>
              <span className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-md shadow-lg">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {displayLanguage === 'vi' ? 'Sau' : 'Next'}
              </Button>
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? (language === 'vi' ? 'Chỉnh sửa Training Data' : 'Edit Training Data')
                : (language === 'vi' ? 'Thêm Training Data mới' : 'Add New Training Data')}
            </DialogTitle>
            <DialogDescription>
              {language === 'vi'
                ? 'Thêm câu hỏi và câu trả lời để train AI'
                : 'Add questions and answers to train AI'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'vi' ? 'Câu hỏi / Keyword' : 'Question / Keyword'}</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder={language === 'vi' ? 'Nhập câu hỏi...' : 'Enter question...'}
              />
            </div>
            <div>
              <Label>{language === 'vi' ? 'Câu trả lời' : 'Answer'}</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder={language === 'vi' ? 'Nhập câu trả lời...' : 'Enter answer...'}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'vi' ? 'Danh mục' : 'Category'}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="general"
                />
              </div>
              <div>
                <Label>{language === 'vi' ? 'Độ ưu tiên (1-10)' : 'Priority (1-10)'}</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div>
              <Label>{language === 'vi' ? 'Tags (phân cách bằng dấu phẩy)' : 'Tags (comma-separated)'}</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="javascript, debug, error"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button onClick={handleSave}>
              {language === 'vi' ? 'Lưu' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {/* Challenges Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {displayLanguage === 'vi' ? 'Danh sách bài tập' : 'Challenges List'}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {displayLanguage === 'vi'
                  ? 'Danh sách tất cả bài tập trong hệ thống'
                  : 'List of all challenges in the system'}
              </p>
            </div>
          </div>

          {/* Challenges Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder={displayLanguage === 'vi' ? 'Tìm kiếm bài tập...' : 'Search challenges...'}
                  value={challengeSearch}
                  onChange={(e) => {
                    setChallengeSearch(e.target.value);
                    setChallengesPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={challengeCategoryFilter}
              onValueChange={(value) => {
                setChallengeCategoryFilter(value);
                setChallengesPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={displayLanguage === 'vi' ? 'Tất cả danh mục' : 'All categories'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{displayLanguage === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
                <SelectItem value="Syntax">Syntax</SelectItem>
                <SelectItem value="Logic">Logic</SelectItem>
                <SelectItem value="Performance">Performance</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Challenges List */}
          {challengesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : challenges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {displayLanguage === 'vi' ? 'Chưa có bài tập nào' : 'No challenges found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <Card key={challenge._id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base md:text-lg break-words">
                            {challenge.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{challenge.category}</Badge>
                            <Badge variant="outline">{challenge.difficulty}</Badge>
                            <Badge variant="outline">{challenge.language}</Badge>
                            <Badge variant="default" className="bg-green-500">
                              {challenge.points} {displayLanguage === 'vi' ? 'điểm' : 'points'}
                            </Badge>
                            {!challenge.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-2 break-words">
                          {challenge.description.substring(0, 180)}...
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {displayLanguage === 'vi' ? 'Tạo ngày:' : 'Created:'}{' '}
                            {new Date(challenge.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Challenges Pagination */}
          {challengesTotalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChallengesPage((p) => Math.max(1, p - 1))}
                disabled={challengesPage === 1}
              >
                {displayLanguage === 'vi' ? 'Trước' : 'Previous'}
              </Button>
              <span className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-md shadow-lg">
                {challengesPage} / {challengesTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChallengesPage((p) => Math.min(challengesTotalPages, p + 1))}
                disabled={challengesPage === challengesTotalPages}
              >
                {displayLanguage === 'vi' ? 'Sau' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainingDataManagement;

