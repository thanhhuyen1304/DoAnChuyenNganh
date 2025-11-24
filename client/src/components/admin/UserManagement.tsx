import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { Search, Ban, Unlock, Shield, Trash2, Loader2 } from 'lucide-react';
// import Header from '@/components/Header';

import { getApiBase } from '../../lib/apiBase'
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
}

const UserManagement: React.FC = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [banFilter, setBanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  // Fetch users when filters change (reset to page 1)
  useEffect(() => {
    setPage(1);
  }, [roleFilter, banFilter, search]);

  // Fetch users when page or filters change
  useEffect(() => {
    fetchUsers();
    if (page === 1) {
      fetchStats();
    }
  }, [page, roleFilter, banFilter, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError(language === 'vi' ? 'Token không tồn tại' : 'No token found');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        // Show 5 users per page
        limit: '5',
      });
      if (search?.trim()) params.append('search', search.trim());
      if (roleFilter) params.append('role', roleFilter);
      if (banFilter) params.append('isBanned', banFilter);

      console.log(`Fetching users with params: ${params.toString()}`);

      const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || `HTTP ${response.status}: Failed to fetch users`);
        setUsers([]);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setTotalPages(data.data.pagination?.pages || 1);
        setError('');
      } else {
        setError(data.message || 'Failed to load users');
        setUsers([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection error: ${errorMsg}`);
      setUsers([]);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch stats: HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

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
        setSuccess('Cập nhật role thành công');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Lỗi cập nhật role');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const toggleBan = async (user: User) => {
    if (!confirm(language === 'vi' 
      ? `Bạn có chắc muốn ${user.isBanned ? 'unban' : 'ban'} user này?`
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
        setSuccess(data.message);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Lỗi ban/unban user');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(language === 'vi' 
      ? 'Bạn có chắc muốn xóa user này?'
      : 'Are you sure you want to delete this user?')) {
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
        setSuccess('Xóa user thành công');
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Lỗi xóa user');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center py-8 md:py-12 overflow-hidden relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">
        {/* Background decorations */}
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="space-y-6">
            {/* <div className="mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF] mb-2 flex items-center gap-3">
                <Shield size={24} className="text-primary-500" />
                {language === 'vi' ? 'Quản lý người dùng' : 'User Management'}
              </h2>
            </div> */}

            {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Tổng users' : 'Total Users'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Active' : 'Active'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Banned' : 'Banned'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.banned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Admins' : 'Admins'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.byRole?.admin || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">{language === 'vi' ? 'Tất cả roles' : 'All Roles'}</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={banFilter}
              onChange={(e) => {
                setBanFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">{language === 'vi' ? 'Tất cả' : 'All'}</option>
              <option value="false">{language === 'vi' ? 'Active' : 'Active'}</option>
              <option value="true">{language === 'vi' ? 'Banned' : 'Banned'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      {users.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'vi' ? 'Không tìm thấy user nào' : 'No users found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'vi' 
                ? `Hiển thị ${users.length} user(s) - Trang ${page}/${totalPages}`
                : `Showing ${users.length} user(s) - Page ${page}/${totalPages}`}
            </div>
          )}
          {users.map((user) => (
          <Card key={user._id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{user.username}</h3>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role || 'user'}
                    </Badge>
                    {user.isBanned && (
                      <Badge variant="destructive">
                        {language === 'vi' ? 'Banned' : 'Banned'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{user.loginMethod || 'local'}</Badge>
                    {user.rank && <Badge variant="outline">{user.rank}</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={user.role || 'user'}
                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    size="sm"
                    variant={user.isBanned ? 'default' : 'destructive'}
                    onClick={() => toggleBan(user)}
                  >
                    {user.isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteUser(user._id)}
                  >
                    <Trash2 className="w-4 h-4" />
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {language === 'vi' ? 'Trước' : 'Previous'}
          </Button>
          <span className="px-4 py-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {language === 'vi' ? 'Sau' : 'Next'}
          </Button>
        </div>
      )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagement;

