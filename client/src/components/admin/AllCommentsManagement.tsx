import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Trash2,
  User,
  Calendar,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Comment {
  _id: string;
  user: { _id: string; username: string; avatar?: string; email: string };
  challenge: { _id: string; title: string; difficulty: string; language: string };
  content: string;
  reportCount: number;
  likeCount: number;
  dislikeCount: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Challenge {
  _id: string;
  title: string;
  difficulty: string;
  language: string;
}

const AllCommentsManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchComments();
  }, [page, selectedChallengeId, sortBy]);

  useEffect(() => {
    // Fetch challenges list once on mount
    fetchChallengesList();
  }, []);

  const fetchChallengesList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/admin/comments?page=1&limit=1`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success && data.data.challenges) {
        setChallenges(data.data.challenges);
      }
    } catch (err) {
      console.error('Error fetching challenges list:', err);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: sortBy,
      });
      
      if (selectedChallengeId) {
        params.append('challengeId', selectedChallengeId);
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/comments?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setComments(data.data.comments);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
        // Don't overwrite challenges list when filtering
        if (data.data.challenges && data.data.challenges.length > 0 && !selectedChallengeId) {
          setChallenges(data.data.challenges);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const toggleHideComment = async (commentId: string, isHidden: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/comments/${commentId}/hide`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHidden }),
      });

      const data = await response.json();
      if (data.success) {
        fetchComments();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchComments();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleChallengeFilter = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setPage(1);
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tất cả bình luận
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Quản lý toàn bộ bình luận từ người dùng - Tổng: {total} bình luận
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter size={18} />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Challenge Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Lọc theo bài tập
              </label>
              <select
                value={selectedChallengeId}
                onChange={(e) => handleChallengeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả bài tập</option>
                {challenges.map((challenge) => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.title} ({challenge.difficulty} - {challenge.language})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Sắp xếp theo
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="reports">Nhiều báo cáo nhất</option>
                <option value="likes">Nhiều like nhất</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="grid gap-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Không có bình luận nào
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment._id} className={comment.isHidden ? 'opacity-60 border-orange-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {comment.user.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={20} className="text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {comment.user.username}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {comment.user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {comment.challenge.title}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            comment.challenge.difficulty === 'Easy' 
                              ? 'border-green-500 text-green-500' 
                              : comment.challenge.difficulty === 'Medium'
                              ? 'border-yellow-500 text-yellow-500'
                              : 'border-red-500 text-red-500'
                          }`}
                        >
                          {comment.challenge.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {comment.challenge.language}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {comment.reportCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {comment.reportCount} báo cáo
                      </Badge>
                    )}
                    {comment.isHidden && (
                      <Badge variant="secondary" className="text-xs">Đã ẩn</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    👍 {comment.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    👎 {comment.dislikeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatTime(comment.createdAt)}
                  </span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-gray-500">(đã chỉnh sửa)</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant={comment.isHidden ? 'default' : 'secondary'}
                    onClick={() => toggleHideComment(comment._id, !comment.isHidden)}
                    className="flex items-center gap-1"
                  >
                    {comment.isHidden ? (
                      <>
                        <Eye size={14} />
                        Hiện
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        Ẩn
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteComment(comment._id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
};

export default AllCommentsManagement;
