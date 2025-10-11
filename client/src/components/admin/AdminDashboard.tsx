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

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/challenges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setChallenges(data.data.challenges);
      } else {
        setError('Không thể tải danh sách bài tập');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
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

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      problemStatement: '',
      language: challenge.language,
      difficulty: challenge.difficulty,
      category: challenge.category,
      buggyCode: '',
      correctCode: '',
      points: challenge.points,
      timeLimit: 5,
      memoryLimit: 64,
      testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }]
    });
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
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList>
          <TabsTrigger value="challenges">Quản lý bài tập</TabsTrigger>
          <TabsTrigger value="create">Tạo bài tập</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <Badge variant={challenge.isActive ? "default" : "secondary"}>
                      {challenge.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline">{challenge.language}</Badge>
                    <Badge variant="outline">{challenge.difficulty}</Badge>
                    <Badge variant="outline">{challenge.category}</Badge>
                    <Badge variant="outline">{challenge.points} điểm</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(challenge)}>
                      Chỉnh sửa
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(challenge._id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingChallenge ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Ngôn ngữ</Label>
                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                        <SelectItem value="Java">Java</SelectItem>
                        <SelectItem value="C++">C++</SelectItem>
                        <SelectItem value="C#">C#</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Độ khó</Label>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Dễ</SelectItem>
                        <SelectItem value="Medium">Trung bình</SelectItem>
                        <SelectItem value="Hard">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Danh mục</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Syntax">Syntax</SelectItem>
                        <SelectItem value="Logic">Logic</SelectItem>
                        <SelectItem value="Performance">Performance</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Điểm số</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemStatement">Đề bài</Label>
                  <Textarea
                    id="problemStatement"
                    value={formData.problemStatement}
                    onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buggyCode">Code có lỗi</Label>
                  <Textarea
                    id="buggyCode"
                    value={formData.buggyCode}
                    onChange={(e) => setFormData({ ...formData, buggyCode: e.target.value })}
                    required
                    className="font-mono"
                    rows={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctCode">Code đúng (tùy chọn)</Label>
                  <Textarea
                    id="correctCode"
                    value={formData.correctCode}
                    onChange={(e) => setFormData({ ...formData, correctCode: e.target.value })}
                    className="font-mono"
                    rows={10}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Test Cases</Label>
                    <Button type="button" size="sm" onClick={addTestCase}>
                      Thêm Test Case
                    </Button>
                  </div>
                  
                  {formData.testCases.map((testCase, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label>Input</Label>
                            <Textarea
                              value={testCase.input}
                              onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                              className="font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Expected Output</Label>
                            <Textarea
                              value={testCase.expectedOutput}
                              onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                              className="font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="space-y-2">
                            <Label>Điểm</Label>
                            <Input
                              type="number"
                              min="0"
                              value={testCase.points}
                              onChange={(e) => updateTestCase(index, 'points', parseInt(e.target.value))}
                              className="w-20"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`hidden-${index}`}
                              checked={testCase.isHidden}
                              onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                            />
                            <Label htmlFor={`hidden-${index}`}>Ẩn</Label>
                          </div>
                          {formData.testCases.length > 1 && (
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="destructive"
                              onClick={() => removeTestCase(index)}
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button type="submit">
                    {editingChallenge ? 'Cập nhật' : 'Tạo bài tập'}
                  </Button>
                  {editingChallenge && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Hủy
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tổng bài tập</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{challenges.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bài tập hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {challenges.filter(c => c.isActive).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tổng điểm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {challenges.reduce((sum, c) => sum + c.points, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
