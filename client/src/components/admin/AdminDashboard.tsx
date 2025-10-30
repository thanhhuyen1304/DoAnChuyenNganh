import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import AdvancedScraper from './AdvancedScraper';
import TokenDebugger from './TokenDebugger';
import ScraperGuide from './ScraperGuide';
import ChallengeStats from './ChallengeStats';
import DatabaseDebugger from './DatabaseDebugger';
import APITester from './APITester';
import { EditChallengeModal } from './EditChallengeModal';
import { CreateChallenge } from './CreateChallenge';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

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

const AdminDashboard = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newChallengesCount, setNewChallengesCount] = useState(0);
  
  // Form state for creating/editing challenges
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemStatement: '',
    language: '',
    difficulty: '',
    category: '',
    buggyCode: '',
    correctCode: '',
    points: 10,
    timeLimit: 5,
    memoryLimit: 64,
    testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }]
  });
  
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const previousCount = challenges.length;
      
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching challenges...');
      console.log('   Token:', token ? `${token.substring(0, 20)}...` : 'No token');
      console.log('   URL:', `${API_BASE_URL}/challenges/admin/all`);
      
      const response = await fetch(`${API_BASE_URL}/challenges/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('   Response status:', response.status);
      const data = await response.json();
      console.log('   Response data:', data);
      
      if (data.success) {
        setChallenges(data.data.challenges);
        setError(''); // Clear any previous errors
        console.log(`✅ Loaded ${data.data.challenges.length} challenges`);
        
        // Hiển thị thông báo thành công nếu có bài tập mới
        if (showSuccessMessage && data.data.challenges.length > previousCount) {
          const newCount = data.data.challenges.length - previousCount;
          setNewChallengesCount(newCount);
          setSuccess(`🎉 Đã thêm ${newCount} bài tập mới vào danh sách!`);
          
          // Tự động ẩn thông báo sau 5 giây
          setTimeout(() => {
            setSuccess('');
            setNewChallengesCount(0);
          }, 5000);
        }
      } else {
        console.log('❌ API returned error:', data.message);
        setError(`Không thể tải danh sách bài tập: ${data.message}`);
      }
    } catch (err) {
      console.log('❌ Network error:', err);
      setError(`Lỗi kết nối server: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingChallenge 
        ? `${API_BASE_URL}/challenges/${editingChallenge._id}`
        : `${API_BASE_URL}/challenges`;
      
      const method = editingChallenge ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingChallenge ? 'Cập nhật bài tập thành công' : 'Tạo bài tập thành công');
        fetchChallenges();
        resetForm();
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      problemStatement: '',
      language: '',
      difficulty: '',
      category: '',
      buggyCode: '',
      correctCode: '',
      points: 10,
      timeLimit: 5,
      memoryLimit: 64,
      testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }]
    });
    setEditingChallenge(null);
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const handleEdit = (challenge: Challenge) => {
    setSelectedChallengeId(challenge._id);
    setEditModalOpen(true);
  };

  const handleDelete = async (challengeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Xóa bài tập thành công');
        fetchChallenges();
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', expectedOutput: '', isHidden: false, points: 10 }]
    });
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: newTestCases });
  };

  const removeTestCase = (index: number) => {
    if (formData.testCases.length > 1) {
      const newTestCases = formData.testCases.filter((_, i) => i !== index);
      setFormData({ ...formData, testCases: newTestCases });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Quản lý bài tập và hệ thống</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <div className="flex items-center gap-2">
              <span>{success}</span>
              {newChallengesCount > 0 && (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  +{newChallengesCount} mới
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList>
          <TabsTrigger value="challenges">Quản lý bài tập</TabsTrigger>
          <TabsTrigger value="create">Tạo bài tập</TabsTrigger>
          <TabsTrigger value="scraper">Scraper</TabsTrigger>
          <TabsTrigger value="debug">Debug Token</TabsTrigger>
          <TabsTrigger value="database">Database Debug</TabsTrigger>
          <TabsTrigger value="api">API Test</TabsTrigger>
          <TabsTrigger value="guide">Hướng dẫn</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Danh sách bài tập</h3>
              <p className="text-sm text-gray-600">Tổng cộng {challenges.length} bài tập</p>
            </div>
            <Button 
              onClick={() => fetchChallenges()} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              {loading ? 'Đang tải...' : '🔄 Làm mới'}
            </Button>
          </div>
          
          <div className="grid gap-4">
            {challenges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có bài tập nào. Hãy tạo bài tập mới hoặc scrape từ các nguồn online!</p>
              </div>
            ) : (
              challenges.map((challenge) => (
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
                        Tạo lúc: {new Date(challenge.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <Badge variant={challenge.isActive ? "default" : "secondary"}>
                      {challenge.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
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
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(challenge)}>
                      ✏️ Chỉnh sửa
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(challenge._id)}
                    >
                      🗑️ Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <CreateChallenge />
        </TabsContent>

        <TabsContent value="scraper" className="space-y-4">
          <AdvancedScraper onScrapeSuccess={() => fetchChallenges(true)} />
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <TokenDebugger />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseDebugger />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <APITester />
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <ScraperGuide />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <ChallengeStats challenges={challenges} />
        </TabsContent>
      </Tabs>

      <EditChallengeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        challengeId={selectedChallengeId}
        onUpdate={() => {
          fetchChallenges();
          setEditModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminDashboard;
