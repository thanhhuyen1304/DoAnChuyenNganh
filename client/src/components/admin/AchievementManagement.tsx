import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useToast } from '@/components/hooks/use-toast';
import {
  Loader2, Plus, Trash2, Award, Edit, Eye, Search, Filter,
  ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle,
  TrendingUp, Users, Activity
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  type: 'challenge' | 'streak' | 'points' | 'special';
  condition: { type: string; value: number };
  points: number;
  badge: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdBy?: { username: string; email: string };
  updatedBy?: { username: string; email: string };
  usersEarnedCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AchievementStats {
  summary: {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
  };
  byType: Record<string, number>;
  topEarned: Achievement[];
}

const AchievementManagement: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  
  // Pagination & Filters
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    icon: string;
    image: string;
    type: 'challenge' | 'streak' | 'points' | 'special';
    conditionType: string;
    conditionValue: number;
    points: number;
    badge: string;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    icon: '🏆',
    image: '',
    type: 'challenge',
    conditionType: 'complete_challenges',
    conditionValue: 1,
    points: 10,
    badge: '',
    isActive: true,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAchievements();
    fetchStats();
  }, [pagination.page, pagination.limit, searchTerm, typeFilter, statusFilter, sortBy, sortOrder]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);
      
      const response = await fetch(`${API_BASE_URL}/achievements?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setAchievements(data.data.achievements);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: err.message || (language === 'vi' ? 'Không thể tải danh sách thành tích' : 'Failed to load achievements'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements/stats/overview`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = language === 'vi' ? 'Tên thành tích là bắt buộc' : 'Achievement name is required';
    }
    if (!formData.description.trim()) {
      errors.description = language === 'vi' ? 'Mô tả là bắt buộc' : 'Description is required';
    }
    if (!formData.badge.trim()) {
      errors.badge = language === 'vi' ? 'Tên badge là bắt buộc' : 'Badge name is required';
    }
    if (formData.conditionValue <= 0) {
      errors.conditionValue = language === 'vi' ? 'Giá trị điều kiện phải lớn hơn 0' : 'Condition value must be greater than 0';
    }
    if (formData.points < 0) {
      errors.points = language === 'vi' ? 'Điểm không được âm' : 'Points cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createAchievement = async () => {
    if (!validateForm()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare payload with proper type casting and validation
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon || '🏆',
        image: formData.image?.trim() || undefined,
        type: formData.type,
        condition: {
          type: formData.conditionType.trim(),
          value: Number(formData.conditionValue),
        },
        points: Number(formData.points),
        badge: formData.badge.trim(),
        isActive: formData.isActive,
      };

      console.log('Creating achievement with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/achievements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      console.log('Create achievement response:', data);
      
      if (response.ok && data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Tạo thành tích thành công' : 'Achievement created successfully',
        });
        fetchAchievements();
        fetchStats();
        setShowCreateModal(false);
        resetForm();
      } else {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Error creating achievement:', err);
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: err.message || (language === 'vi' ? 'Không thể tạo thành tích' : 'Failed to create achievement'),
        variant: 'destructive',
      });
    }
  };

  const updateAchievement = async () => {
    if (!selectedAchievement || !validateForm()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements/${selectedAchievement._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          image: formData.image,
          type: formData.type,
          condition: {
            type: formData.conditionType,
            value: formData.conditionValue,
          },
          points: formData.points,
          badge: formData.badge,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Cập nhật thành tích thành công' : 'Achievement updated successfully',
        });
        fetchAchievements();
        fetchStats();
        setShowEditModal(false);
        setSelectedAchievement(null);
        resetForm();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: err.message || (language === 'vi' ? 'Không thể cập nhật thành tích' : 'Failed to update achievement'),
        variant: 'destructive',
      });
    }
  };

  const deleteAchievement = async (hard = false) => {
    if (!selectedAchievement) return;
    
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/achievements/${selectedAchievement._id}${hard ? '?hard=true' : ''}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: hard 
            ? (language === 'vi' ? 'Xóa vĩnh viễn thành tích thành công' : 'Achievement permanently deleted')
            : (language === 'vi' ? 'Xóa thành tích thành công' : 'Achievement deleted successfully'),
        });
        fetchAchievements();
        fetchStats();
        setShowDeleteModal(false);
        setSelectedAchievement(null);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: err.message || (language === 'vi' ? 'Không thể xóa thành tích' : 'Failed to delete achievement'),
        variant: 'destructive',
      });
    }
  };

  const restoreAchievement = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: language === 'vi' ? 'Thành công' : 'Success',
          description: language === 'vi' ? 'Khôi phục thành tích thành công' : 'Achievement restored successfully',
        });
        fetchAchievements();
        fetchStats();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: err.message || (language === 'vi' ? 'Không thể khôi phục thành tích' : 'Failed to restore achievement'),
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      image: '',
      type: 'challenge',
      conditionType: 'complete_challenges',
      conditionValue: 1,
      points: 10,
      badge: '',
      isActive: true,
    });
    setFormErrors({});
  };

  const openEditModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      image: achievement.image || '',
      type: achievement.type,
      conditionType: achievement.condition.type,
      conditionValue: achievement.condition.value,
      points: achievement.points,
      badge: achievement.badge,
      isActive: achievement.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDeleteModal(true);
  };

  const openDetailModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailModal(true);
  };

  if (loading && achievements.length === 0) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng số' : 'Total'}</p>
                  <p className="text-2xl font-bold">{stats.summary.total}</p>
                </div>
                <Award className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Đang hoạt động' : 'Active'}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.summary.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Không hoạt động' : 'Inactive'}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.summary.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Đã xóa' : 'Deleted'}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.summary.deleted}</p>
                </div>
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">{language === 'vi' ? 'Quản lý thành tích' : 'Achievement Management'}</CardTitle>
              <CardDescription>{language === 'vi' ? 'Quản lý tất cả thành tích trong hệ thống' : 'Manage all achievements in the system'}</CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Tạo mới' : 'Create New'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Loại' : 'Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả loại' : 'All Types'}</SelectItem>
                <SelectItem value="challenge">{language === 'vi' ? 'Thử thách' : 'Challenge'}</SelectItem>
                <SelectItem value="streak">{language === 'vi' ? 'Chuỗi' : 'Streak'}</SelectItem>
                <SelectItem value="points">{language === 'vi' ? 'Điểm' : 'Points'}</SelectItem>
                <SelectItem value="special">{language === 'vi' ? 'Đặc biệt' : 'Special'}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Trạng thái' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
                <SelectItem value="true">{language === 'vi' ? 'Hoạt động' : 'Active'}</SelectItem>
                <SelectItem value="false">{language === 'vi' ? 'Không hoạt động' : 'Inactive'}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Sắp xếp' : 'Sort by'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{language === 'vi' ? 'Ngày tạo' : 'Created Date'}</SelectItem>
                <SelectItem value="name">{language === 'vi' ? 'Tên' : 'Name'}</SelectItem>
                <SelectItem value="points">{language === 'vi' ? 'Điểm' : 'Points'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{language === 'vi' ? 'Icon' : 'Icon'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Tên' : 'Name'}</TableHead>
                  <TableHead>{language === 'vi' ? 'Loại' : 'Type'}</TableHead>
                  <TableHead className="text-center">{language === 'vi' ? 'Điểm' : 'Points'}</TableHead>
                  <TableHead className="text-center">{language === 'vi' ? 'Người đạt' : 'Earned By'}</TableHead>
                  <TableHead className="text-center">{language === 'vi' ? 'Trạng thái' : 'Status'}</TableHead>
                  <TableHead className="text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {language === 'vi' ? 'Không có thành tích nào' : 'No achievements found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  achievements.map((achievement) => (
                    <TableRow key={achievement._id} className={achievement.isDeleted ? 'opacity-50' : ''}>
                      <TableCell>
                        <span className="text-2xl">{achievement.icon}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {achievement.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{achievement.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{achievement.points}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{achievement.usersEarnedCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {achievement.isDeleted ? (
                          <Badge variant="destructive">{language === 'vi' ? 'Đã xóa' : 'Deleted'}</Badge>
                        ) : achievement.isActive ? (
                          <Badge variant="default">{language === 'vi' ? 'Hoạt động' : 'Active'}</Badge>
                        ) : (
                          <Badge variant="secondary">{language === 'vi' ? 'Không hoạt động' : 'Inactive'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDetailModal(achievement)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!achievement.isDeleted && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditModal(achievement)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDeleteModal(achievement)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {achievement.isDeleted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => restoreAchievement(achievement._id)}
                            >
                              <RotateCcw className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Trang' : 'Page'} {pagination.page} {language === 'vi' ? 'của' : 'of'} {pagination.totalPages} 
                {' '}({pagination.total} {language === 'vi' ? 'thành tích' : 'achievements'})
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedAchievement(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {showEditModal
                ? (language === 'vi' ? 'Chỉnh sửa thành tích' : 'Edit Achievement')
                : (language === 'vi' ? 'Tạo thành tích mới' : 'Create New Achievement')}
            </DialogTitle>
            <DialogDescription>
              {language === 'vi'
                ? 'Điền đầy đủ thông tin để tạo hoặc cập nhật thành tích'
                : 'Fill in the details to create or update an achievement'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{language === 'vi' ? 'Tên thành tích' : 'Achievement Name'} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'vi' ? 'VD: Người mới bắt đầu' : 'e.g., Beginner'}
                />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="badge">{language === 'vi' ? 'Tên Badge' : 'Badge Name'} *</Label>
                <Input
                  id="badge"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder={language === 'vi' ? 'VD: beginner_badge' : 'e.g., beginner_badge'}
                />
                {formErrors.badge && <p className="text-sm text-destructive">{formErrors.badge}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{language === 'vi' ? 'Mô tả' : 'Description'} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'vi' ? 'Mô tả chi tiết về thành tích' : 'Detailed description of the achievement'}
                rows={3}
              />
              {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">{language === 'vi' ? 'Icon (Emoji)' : 'Icon (Emoji)'}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🏆"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">{language === 'vi' ? 'Loại' : 'Type'} *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="challenge">{language === 'vi' ? 'Thử thách' : 'Challenge'}</SelectItem>
                    <SelectItem value="streak">{language === 'vi' ? 'Chuỗi' : 'Streak'}</SelectItem>
                    <SelectItem value="points">{language === 'vi' ? 'Điểm' : 'Points'}</SelectItem>
                    <SelectItem value="special">{language === 'vi' ? 'Đặc biệt' : 'Special'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">{language === 'vi' ? 'URL Hình ảnh (tuỳ chọn)' : 'Image URL (optional)'}</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">{language === 'vi' ? 'Điểm thưởng' : 'Points'} *</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                />
                {formErrors.points && <p className="text-sm text-destructive">{formErrors.points}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conditionType">{language === 'vi' ? 'Loại điều kiện' : 'Condition Type'} *</Label>
                <Input
                  id="conditionType"
                  value={formData.conditionType}
                  onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                  placeholder="complete_challenges"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conditionValue">{language === 'vi' ? 'Giá trị điều kiện' : 'Condition Value'} *</Label>
                <Input
                  id="conditionValue"
                  type="number"
                  min="1"
                  value={formData.conditionValue}
                  onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 1 })}
                />
                {formErrors.conditionValue && <p className="text-sm text-destructive">{formErrors.conditionValue}</p>}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">{language === 'vi' ? 'Kích hoạt ngay' : 'Activate immediately'}</Label>
            </div>
          </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedAchievement(null);
              resetForm();
            }}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button onClick={showEditModal ? updateAchievement : createAchievement}>
              {showEditModal 
                ? (language === 'vi' ? 'Cập nhật' : 'Update')
                : (language === 'vi' ? 'Tạo mới' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'vi' ? 'Chi tiết thành tích' : 'Achievement Details'}</DialogTitle>
          </DialogHeader>
          
          {selectedAchievement && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="text-6xl">{selectedAchievement.icon}</span>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedAchievement.name}</h3>
                  <p className="text-muted-foreground mt-2">{selectedAchievement.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Loại' : 'Type'}</Label>
                  <p className="font-medium">{selectedAchievement.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Badge' : 'Badge'}</Label>
                  <p className="font-medium">{selectedAchievement.badge}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Điểm' : 'Points'}</Label>
                  <p className="font-medium">{selectedAchievement.points}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Trạng thái' : 'Status'}</Label>
                  <p className="font-medium">
                    {selectedAchievement.isActive 
                      ? (language === 'vi' ? 'Hoạt động' : 'Active')
                      : (language === 'vi' ? 'Không hoạt động' : 'Inactive')}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">{language === 'vi' ? 'Điều kiện' : 'Condition'}</Label>
                <p className="font-medium">
                  {selectedAchievement.condition.type}: {selectedAchievement.condition.value}
                </p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">{language === 'vi' ? 'Số người đạt được' : 'Users Earned'}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">{selectedAchievement.usersEarnedCount || 0}</span>
                </div>
              </div>
              
              {selectedAchievement.createdBy && (
                <div>
                  <Label className="text-muted-foreground">{language === 'vi' ? 'Người tạo' : 'Created By'}</Label>
                  <p className="font-medium">{selectedAchievement.createdBy.username}</p>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>{language === 'vi' ? 'Ngày tạo' : 'Created'}: {new Date(selectedAchievement.createdAt).toLocaleString()}</p>
                <p>{language === 'vi' ? 'Cập nhật' : 'Updated'}: {new Date(selectedAchievement.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'vi' ? 'Xác nhận xóa' : 'Confirm Deletion'}</DialogTitle>
            <DialogDescription>
              {language === 'vi' 
                ? 'Bạn có chắc chắn muốn xóa thành tích này? Thành tích sẽ bị ẩn nhưng dữ liệu vẫn được giữ lại.' 
                : 'Are you sure you want to delete this achievement? It will be hidden but data will be preserved.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAchievement && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <span className="text-3xl">{selectedAchievement.icon}</span>
                <div>
                  <p className="font-semibold">{selectedAchievement.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAchievement.badge}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => deleteAchievement(false)}>
              {language === 'vi' ? 'Xóa (Soft Delete)' : 'Delete (Soft)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AchievementManagement;
