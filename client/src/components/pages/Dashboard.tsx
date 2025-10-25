import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { User, Trophy, Target, Clock } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  }, []);

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Chào mừng trở lại, {user.username}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role === 'admin' ? 'Admin' : 'User'}
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* User Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm kinh nghiệm</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.experience || 0}</div>
              <p className="text-xs text-muted-foreground">
                Rank: {user.rank || 'Newbie'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Huy hiệu</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.badges?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Huy hiệu đã đạt được
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bài tập đã làm</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Chưa có bài tập nào
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thời gian học</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0h</div>
              <p className="text-xs text-muted-foreground">
                Tổng thời gian luyện tập
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bắt đầu luyện tập</CardTitle>
              <CardDescription>
                Chọn bài tập phù hợp với trình độ của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" onClick={() => window.location.href = '/challenges'}>
                  Xem danh sách bài tập
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>• Bài tập từ dễ đến khó</p>
                  <p>• Hỗ trợ nhiều ngôn ngữ lập trình</p>
                  <p>• Phản hồi ngay lập tức</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Quản lý hồ sơ và cài đặt tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Ngôn ngữ yêu thích:</strong> {user.favoriteLanguages?.join(', ') || 'Chưa chọn'}</p>
                </div>
                <Button variant="outline" className="w-full">
                  Chỉnh sửa hồ sơ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Panel Link */}
        {user.role === 'admin' && (
          <Card className="mt-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200">Admin Panel</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                Quản lý hệ thống và bài tập
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => window.location.href = '/admin/dashboard'}
              >
                Truy cập Admin Panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
