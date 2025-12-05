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
  AlertTriangle,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ReportedComment {
  _id: string;
  user: { _id: string; username: string; avatar?: string; email: string };
  challenge: { _id: string; title: string; difficulty: string; language: string };
  content: string;
  reportCount: number;
  reports: Array<{
    user: { _id: string; username: string; email: string };
    reason: string;
    reportedAt: string;
  }>;
  likeCount: number;
  dislikeCount: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

const CommentReportManagement: React.FC = () => {
  const [comments, setComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComment, setSelectedComment] = useState<ReportedComment | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  useEffect(() => {
    fetchReportedComments();
  }, [page]);

  const fetchReportedComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/admin/comments/reported?page=${page}&limit=20&sort=reports`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setComments(data.data.comments);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const toggleHideComment = async (commentId: string, isHidden: boolean, reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/comments/${commentId}/hide`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHidden, reason }),
      });

      const data = await response.json();
      if (data.success) {
        fetchReportedComments();
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
        fetchReportedComments();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  const viewReportDetails = (comment: ReportedComment) => {
    setSelectedComment(comment);
    setShowReportDetails(true);
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
            Bình luận bị báo cáo
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Quản lý các bình luận vi phạm được người dùng báo cáo
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Không có bình luận nào bị báo cáo
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment._id} className={comment.isHidden ? 'opacity-60' : ''}>
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
                        <Badge variant="outline" className="text-xs">
                          {comment.challenge.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {comment.reportCount} báo cáo
                    </Badge>
                    {comment.isHidden && (
                      <Badge variant="secondary">Đã ẩn</Badge>
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
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewReportDetails(comment)}
                  >
                    Xem chi tiết báo cáo ({comment.reportCount})
                  </Button>

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

      {/* Report Details Modal */}
      {showReportDetails && selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Chi tiết báo cáo</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReportDetails(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Nội dung bình luận:</h4>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedComment.content}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Danh sách báo cáo ({selectedComment.reports.length}):
                </h4>
                <div className="space-y-3">
                  {selectedComment.reports.map((report, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{report.user.username}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {report.user.email}
                          </p>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatTime(report.reportedAt)}
                        </span>
                      </div>
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-sm">
                          <span className="font-medium">Lý do: </span>
                          {report.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CommentReportManagement;
