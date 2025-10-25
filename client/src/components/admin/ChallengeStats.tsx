import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Database, Globe, Code, TrendingUp, Users, Award } from 'lucide-react';

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

interface ChallengeStatsProps {
  challenges: Challenge[];
}

const ChallengeStats: React.FC<ChallengeStatsProps> = ({ challenges }) => {
  // Tính toán thống kê
  const totalChallenges = challenges.length;
  const activeChallenges = challenges.filter(c => c.isActive).length;
  const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0);
  
  // Phân loại theo nguồn
  const csesChallenges = challenges.filter(c => c.title.includes('CSES:')).length;
  const atcoderChallenges = challenges.filter(c => c.title.includes('AtCoder:')).length;
  const leetcodeChallenges = challenges.filter(c => c.title.includes('LeetCode:')).length;
  const manualChallenges = totalChallenges - csesChallenges - atcoderChallenges - leetcodeChallenges;
  
  // Phân loại theo độ khó
  const easyChallenges = challenges.filter(c => c.difficulty === 'Easy').length;
  const mediumChallenges = challenges.filter(c => c.difficulty === 'Medium').length;
  const hardChallenges = challenges.filter(c => c.difficulty === 'Hard').length;
  
  // Phân loại theo ngôn ngữ
  const languageStats = challenges.reduce((acc, c) => {
    acc[c.language] = (acc[c.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Phân loại theo danh mục
  const categoryStats = challenges.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Bài tập mới nhất (7 ngày qua)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentChallenges = challenges.filter(c => 
    new Date(c.createdAt) > sevenDaysAgo
  ).length;

  return (
    <div className="space-y-6">
      {/* Tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bài tập</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChallenges}</div>
            <p className="text-xs text-muted-foreground">
              {activeChallenges} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng điểm</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Trung bình {totalChallenges > 0 ? Math.round(totalPoints / totalChallenges) : 0} điểm/bài
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài tập mới</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentChallenges}</div>
            <p className="text-xs text-muted-foreground">
              Trong 7 ngày qua
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalChallenges > 0 ? Math.round((activeChallenges / totalChallenges) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {activeChallenges}/{totalChallenges} bài tập
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Phân loại theo nguồn */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Phân loại theo nguồn</CardTitle>
          <CardDescription>
            Thống kê bài tập theo nguồn scrape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{csesChallenges}</div>
              <div className="text-sm text-gray-600">CSES</div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">Thuật toán</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{atcoderChallenges}</div>
              <div className="text-sm text-gray-600">AtCoder</div>
              <Badge variant="outline" className="bg-green-100 text-green-800">Competitive</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{leetcodeChallenges}</div>
              <div className="text-sm text-gray-600">LeetCode</div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800">Phỏng vấn</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{manualChallenges}</div>
              <div className="text-sm text-gray-600">Thủ công</div>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">Tự tạo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phân loại theo độ khó */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Phân loại theo độ khó</CardTitle>
          <CardDescription>
            Thống kê bài tập theo mức độ khó
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{easyChallenges}</div>
              <div className="text-sm text-gray-600">Dễ</div>
              <Badge variant="outline" className="bg-green-100 text-green-800">Easy</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{mediumChallenges}</div>
              <div className="text-sm text-gray-600">Trung bình</div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{hardChallenges}</div>
              <div className="text-sm text-gray-600">Khó</div>
              <Badge variant="outline" className="bg-red-100 text-red-800">Hard</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phân loại theo ngôn ngữ và danh mục */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>💻 Ngôn ngữ lập trình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(languageStats).map(([language, count]) => (
                <div key={language} className="flex justify-between items-center">
                  <span className="text-sm">{language}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏷️ Danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categoryStats).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm">{category}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChallengeStats;
