import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Database, RefreshCw, Eye, Trash2 } from 'lucide-react';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

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
  createdBy: {
    username: string;
    email: string;
  };
}

const DatabaseDebugger = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAllChallenges = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setChallenges(data.data.challenges);
        setSuccess(`✅ Tìm thấy ${data.data.challenges.length} bài tập trong database`);
      } else {
        setError(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      setError(`❌ Lỗi kết nối: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveChallenges = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges/admin/all?isActive=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setChallenges(data.data.challenges);
        setSuccess(`✅ Tìm thấy ${data.data.challenges.length} bài tập đang hoạt động`);
      } else {
        setError(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      setError(`❌ Lỗi kết nối: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInactiveChallenges = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges/admin/all?isActive=false`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setChallenges(data.data.challenges);
        setSuccess(`✅ Tìm thấy ${data.data.challenges.length} bài tập không hoạt động`);
      } else {
        setError(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      setError(`❌ Lỗi kết nối: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const clearChallenges = () => {
    setChallenges([]);
    setSuccess('');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 Database Debugger
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Kiểm tra và debug dữ liệu bài tập trong database
        </p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={fetchAllChallenges} 
          disabled={loading}
          className="w-full"
        >
          <Database className="h-4 w-4 mr-2" />
          {loading ? 'Đang tải...' : 'Tất cả bài tập'}
        </Button>

        <Button 
          onClick={fetchActiveChallenges} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          {loading ? 'Đang tải...' : 'Bài tập hoạt động'}
        </Button>

        <Button 
          onClick={fetchInactiveChallenges} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? 'Đang tải...' : 'Bài tập không hoạt động'}
        </Button>
      </div>

      {challenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Kết quả ({challenges.length} bài tập)
            </h3>
            <Button 
              onClick={clearChallenges} 
              variant="outline" 
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa kết quả
            </Button>
          </div>

          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {challenge.title}
                        {challenge.title.includes('CSES:') && <Badge variant="outline" className="bg-blue-100 text-blue-800">CSES</Badge>}
                        {challenge.title.includes('AtCoder:') && <Badge variant="outline" className="bg-green-100 text-green-800">AtCoder</Badge>}
                        {challenge.title.includes('LeetCode:') && <Badge variant="outline" className="bg-orange-100 text-orange-800">LeetCode</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1">{challenge.description}</CardDescription>
                      <div className="text-xs text-gray-500 mt-1">
                        Tạo bởi: {challenge.createdBy?.username || 'Unknown'} - {new Date(challenge.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <Badge variant={challenge.isActive ? "default" : "secondary"}>
                      {challenge.isActive ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50">{challenge.language}</Badge>
                    <Badge variant="outline" className={
                      challenge.difficulty === 'Easy' ? 'bg-green-50 text-green-700' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }>
                      {challenge.difficulty}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50">{challenge.category}</Badge>
                    <Badge variant="outline" className="bg-orange-50">{challenge.points} điểm</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Chưa có dữ liệu. Hãy click nút để tải bài tập từ database.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseDebugger;
