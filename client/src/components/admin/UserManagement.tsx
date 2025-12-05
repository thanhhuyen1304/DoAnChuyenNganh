import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { 
  Search, 
  Ban, 
  Unlock, 
  Shield, 
  Trash2, 
  Loader2, 
  Users as UsersIcon,
  Filter,
  X,
  Grid3x3,
  List,
  Mail,
  Calendar,
  Award,
  UserCheck,
  UserX
} from 'lucide-react';

import { getApiBase } from '../../lib/apiBase';
const API_BASE_URL = getApiBase();

interface User {
  _id: string;
  email: string;
  username: string;
  role?: string;
  isBanned?: boolean;
  banReason?: string;
  createdAt: string;
  loginMethod?: string;
  experience?: number;
  rank?: string;
  lastLogin?: string;
}

interface Stats {
  total: number;
  active: number;
  banned: number;
  byRole?: {
    admin?: number;
    moderator?: number;
    user?: number;
  };
}

const UserManagement: React.FC = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState<Stats | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError(language === 'vi' ? 'Không tìm thấy token xác thực' : 'No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check your API endpoint.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch users`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
      } else {
        throw new Error(data.message || 'Failed to load users');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`${language === 'vi' ? 'Lỗi kết nối' : 'Connection error'}: ${errorMsg}`);
      setUsers([]);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(language === 'vi' ? 'Cập nhật role thành công' : 'Role updated successfully');
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || (language === 'vi' ? 'Lỗi cập nhật role' : 'Failed to update role'));
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
    }
  };

  // Toggle ban status
  const toggleBan = async (user: User) => {
    if (!confirm(language === 'vi' 
      ? `Bạn có chắc muốn ${user.isBanned ? 'mở khóa' : 'khóa'} người dùng này?`
      : `Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${user._id}/ban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isBanned: !user.isBanned,
          banReason: user.isBanned ? undefined : 'Vi phạm quy định',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message || (language === 'vi' ? 'Cập nhật thành công' : 'Updated successfully'));
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm(language === 'vi' 
      ? 'Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác!'
      : 'Are you sure you want to delete this user? This action cannot be undone!')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(language === 'vi' ? 'Xóa người dùng thành công' : 'User deleted successfully');
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || (language === 'vi' ? 'Lỗi xóa người dùng' : 'Failed to delete user'));
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchQuery === '' || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || (user.role || 'user') === selectedRole;
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && !user.isBanned) ||
      (selectedStatus === 'banned' && user.isBanned);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedRole !== 'all' || selectedStatus !== 'all';

  // Get role color
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'moderator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                {language === 'vi' ? 'Tổng người dùng' : 'Total Users'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                {language === 'vi' ? 'Đang hoạt động' : 'Active'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-600" />
                {language === 'vi' ? 'Bị khóa' : 'Banned'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.banned}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                {language === 'vi' ? 'Quản trị viên' : 'Admins'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.byRole?.admin || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm theo tên hoặc email...' : 'Search by name or email...'}
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

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Vai trò:' : 'Role:'}
              </span>
              <div className="flex gap-1">
                {['all', 'user', 'moderator', 'admin'].map((role) => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(role)}
                    className="h-7 text-xs"
                  >
                    {role === 'all' 
                      ? (language === 'vi' ? 'Tất cả' : 'All')
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'vi' ? 'Trạng thái:' : 'Status:'}
              </span>
              <div className="flex gap-1">
                {['all', 'active', 'banned'].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status as 'all' | 'active' | 'banned')}
                    className="h-7 text-xs"
                  >
                    {status === 'all' 
                      ? (language === 'vi' ? 'Tất cả' : 'All')
                      : status === 'active'
                      ? (language === 'vi' ? 'Hoạt động' : 'Active')
                      : (language === 'vi' ? 'Bị khóa' : 'Banned')}
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
              ? `Hiển thị ${filteredUsers.length} / ${users.length} người dùng`
              : `Showing ${filteredUsers.length} / ${users.length} users`}
          </div>
        </div>
      </div>

      {/* Users Display */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <UsersIcon className="w-12 h-12 text-primary-400" />
            <p className="text-lg">
              {language === 'vi'
                ? 'Không tìm thấy người dùng nào phù hợp với bộ lọc.'
                : 'No users found matching your filters.'}
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
          {filteredUsers.map((user) => (
            <Card
              key={user._id}
              className={`bg-white/95 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 transform transition-all duration-300 hover:shadow-xl ${
                user.isBanned ? 'opacity-60 border-red-500/30' : ''
              }`}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg md:text-xl line-clamp-1">
                        {user.username}
                      </CardTitle>
                      {user.isBanned && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          {language === 'vi' ? 'Bị khóa' : 'Banned'}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm line-clamp-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>

                {/* Tags and Info */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getRoleColor(user.role)} variant="secondary">
                    {(user.role || 'user').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {user.loginMethod || 'local'}
                  </Badge>
                  {user.rank && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {user.rank}
                    </Badge>
                  )}
                  {user.experience !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {user.experience} XP
                    </Badge>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {language === 'vi' ? 'Tạo: ' : 'Created: '}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {user.banReason && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                    {language === 'vi' ? 'Lý do: ' : 'Reason: '}{user.banReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <select
                    value={user.role || 'user'}
                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    size="sm"
                    variant={user.isBanned ? 'default' : 'destructive'}
                    onClick={() => toggleBan(user)}
                    title={user.isBanned ? (language === 'vi' ? 'Mở khóa' : 'Unban') : (language === 'vi' ? 'Khóa' : 'Ban')}
                  >
                    {user.isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteUser(user._id)}
                    title={language === 'vi' ? 'Xóa' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
