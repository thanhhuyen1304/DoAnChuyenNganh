import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useToast } from '@/components/hooks/use-toast';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Loader2, TrendingUp, Users, Award, Code, Calendar,
  Activity, Target, Zap
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface StatsData {
  overview: {
    totalUsers: number;
    totalChallenges: number;
    totalSubmissions: number;
    totalAchievements: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  challengesByDifficulty: Array<{ difficulty: string; count: number }>;
  challengesByLanguage: Array<{ language: string; count: number }>;
  submissionsByStatus: Array<{ status: string; count: number }>;
  topUsers: Array<{ username: string; experience: number; rank: string }>;
  achievementStats: Array<{ name: string; earned: number }>;
  activityByDay: Array<{ day: string; submissions: number; users: number }>;
}

const COLORS = {
  primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
};

const AdminStats: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const response = await fetch(`${API_BASE_URL}/admin/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('Stats data received:', data); // Debug log
      
      if (data.success && data.data) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Không có dữ liệu thống kê');
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err); // Debug log
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: err.message || (language === 'vi' ? 'Không thể tải thống kê' : 'Failed to load statistics'),
        variant: 'destructive',
      });
      // Set empty stats to show empty state
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          {language === 'vi' ? 'Không có dữ liệu thống kê' : 'No statistics available'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{language === 'vi' ? 'Thống kê hệ thống' : 'System Statistics'}</h2>
          <p className="text-muted-foreground">
            {language === 'vi' ? 'Tổng quan về hoạt động của hệ thống' : 'Overview of system activity'}
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">{language === 'vi' ? '7 ngày' : '7 days'}</SelectItem>
            <SelectItem value="30days">{language === 'vi' ? '30 ngày' : '30 days'}</SelectItem>
            <SelectItem value="90days">{language === 'vi' ? '90 ngày' : '90 days'}</SelectItem>
            <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All time'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng người dùng' : 'Total Users'}</p>
                <p className="text-3xl font-bold text-blue-600">{stats.overview.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Tổng bài tập' : 'Total Challenges'}</p>
                <p className="text-3xl font-bold text-green-600">{stats.overview.totalChallenges}</p>
              </div>
              <Code className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Lượt nộp bài' : 'Submissions'}</p>
                <p className="text-3xl font-bold text-purple-600">{stats.overview.totalSubmissions}</p>
              </div>
              <Activity className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Thành tích' : 'Achievements'}</p>
                <p className="text-3xl font-bold text-amber-600">{stats.overview.totalAchievements}</p>
              </div>
              <Award className="w-12 h-12 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">
            <TrendingUp className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Tăng trưởng' : 'Growth'}
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Target className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Bài tập' : 'Challenges'}
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Zap className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Submissions' : 'Submissions'}
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Thành tích' : 'Achievements'}
          </TabsTrigger>
        </TabsList>

        {/* User Growth Chart */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Tăng trưởng người dùng' : 'User Growth'}</CardTitle>
              <CardDescription>
                {language === 'vi' ? 'Số lượng người dùng mới theo thời gian' : 'New users over time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.primary[0]} 
                    strokeWidth={2}
                    name={language === 'vi' ? 'Người dùng' : 'Users'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Hoạt động theo ngày' : 'Daily Activity'}</CardTitle>
              <CardDescription>
                {language === 'vi' ? 'Lượt nộp bài và người dùng hoạt động' : 'Submissions and active users'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.activityByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submissions" fill={COLORS.primary[0]} name={language === 'vi' ? 'Submissions' : 'Submissions'} />
                  <Bar dataKey="users" fill={COLORS.success[0]} name={language === 'vi' ? 'Người dùng' : 'Users'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Distribution */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'vi' ? 'Theo độ khó' : 'By Difficulty'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.challengesByDifficulty}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="difficulty"
                    >
                      {stats.challengesByDifficulty.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'vi' ? 'Theo ngôn ngữ' : 'By Language'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.challengesByLanguage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="language" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.success[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Submissions Stats */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Trạng thái submissions' : 'Submission Status'}</CardTitle>
              <CardDescription>
                {language === 'vi' ? 'Phân bố theo trạng thái' : 'Distribution by status'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={stats.submissionsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {stats.submissionsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.purple[index % COLORS.purple.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Stats */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'vi' ? 'Thành tích phổ biến' : 'Popular Achievements'}</CardTitle>
              <CardDescription>
                {language === 'vi' ? 'Top 10 thành tích được đạt nhiều nhất' : 'Top 10 most earned achievements'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.achievementStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="earned" fill={COLORS.warning[0]} name={language === 'vi' ? 'Số người đạt' : 'Earned by'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'vi' ? 'Top người dùng' : 'Top Users'}</CardTitle>
          <CardDescription>
            {language === 'vi' ? 'Người dùng có điểm cao nhất' : 'Users with highest experience'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topUsers.map((user, index) => (
              <div key={user.username} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{user.experience}</p>
                  <p className="text-sm text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;