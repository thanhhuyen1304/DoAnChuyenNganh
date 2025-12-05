import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Flag, 
  Trash2, 
  Edit2, 
  X, 
  AlertTriangle,
  User,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { buildApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
    email: string;
  };
  content: string;
  reportCount: number;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  challengeId: string;
}

// Format time helper
const formatTime = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Không xác định';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  if (diffMs < 0) {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function CommentSection({ challengeId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [dislikedComments, setDislikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setCurrentUserId(userData._id || userData.id);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (challengeId) {
      loadComments();
    }
  }, [challengeId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApi(`/comments/challenge/${challengeId}`));
      const result = await response.json();
      
      if (result.success) {
        setComments(result.data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(buildApi('/comments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId,
          content: commentText.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCommentText('');
        await loadComments(); // Reload comments
      } else {
        alert(result.message || 'Không thể gửi bình luận');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Lỗi khi gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(buildApi(`/comments/${commentId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editText.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setEditingId(null);
        setEditText('');
        await loadComments();
      } else {
        alert(result.message || 'Không thể chỉnh sửa bình luận');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Lỗi khi chỉnh sửa bình luận');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(buildApi(`/comments/${commentId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        await loadComments();
      } else {
        alert(result.message || 'Không thể xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Lỗi khi xóa bình luận');
    }
  };

  const handleReportComment = async () => {
    if (!reportReason.trim()) {
      alert('Vui lòng nhập lý do tố cáo');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để tố cáo');
      return;
    }

    if (!reportingCommentId) return;

    try {
      setReportSubmitting(true);
      const response = await fetch(buildApi(`/comments/${reportingCommentId}/report`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: reportReason.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message || 'Đã gửi báo cáo. Cảm ơn bạn!');
        setReportModalOpen(false);
        setReportingCommentId(null);
        setReportReason('');
        await loadComments();
      } else {
        alert(result.message || 'Không thể gửi báo cáo');
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('Lỗi khi gửi báo cáo');
    } finally {
      setReportSubmitting(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const openReportModal = (commentId: string) => {
    setReportingCommentId(commentId);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportingCommentId(null);
    setReportReason('');
  };

  const handleLike = async (commentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để thích bình luận');
      return;
    }

    try {
      const response = await fetch(buildApi(`/comments/${commentId}/like`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        if (result.data.isLiked) {
          setLikedComments(prev => new Set(prev).add(commentId));
          setDislikedComments(prev => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
          });
        } else {
          setLikedComments(prev => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
          });
        }
        await loadComments();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislike = async (commentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để không thích bình luận');
      return;
    }

    try {
      const response = await fetch(buildApi(`/comments/${commentId}/dislike`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        if (result.data.isDisliked) {
          setDislikedComments(prev => new Set(prev).add(commentId));
          setLikedComments(prev => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
          });
        } else {
          setDislikedComments(prev => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
          });
        }
        await loadComments();
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle size={20} />
          Bình luận ({comments.length})
        </h3>
        
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Chia sẻ suy nghĩ của bạn về bài tập này..."
            className="w-full h-24 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            maxLength={5000}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {commentText.length} / 5000 ký tự
            </span>
            <Button 
              type="submit" 
              disabled={submitting || !commentText.trim()}
              size="sm"
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi bình luận
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Chưa có bình luận nào</p>
            <p className="text-sm text-muted-foreground mt-1">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.user.avatar ? (
                    <img 
                      src={comment.user.avatar} 
                      alt={comment.user.username}
                      className="w-10 h-10 rounded-full border-2 border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-semibold text-foreground">{comment.user.username}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTime(comment.createdAt)}
                      </span>
                      {comment.updatedAt !== comment.createdAt && (
                        <span className="text-xs text-muted-foreground ml-1">(đã chỉnh sửa)</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {currentUserId === comment.user._id && (
                        <>
                          <button
                            onClick={() => startEditing(comment)}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={14} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </>
                      )}
                      {currentUserId && currentUserId !== comment.user._id && (
                        <button
                          onClick={() => openReportModal(comment._id)}
                          className="p-1.5 hover:bg-orange-500/10 rounded transition-colors"
                          title="Báo cáo"
                        >
                          <Flag size={14} className="text-orange-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Content or Edit Form */}
                  {editingId === comment._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full h-20 bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        maxLength={5000}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment._id)}
                          disabled={!editText.trim()}
                        >
                          Lưu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground text-sm whitespace-pre-wrap break-words mb-3">
                        {comment.content}
                      </p>

                      {/* Like/Dislike buttons */}
                      {currentUserId && (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(comment._id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                              likedComments.has(comment._id)
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            title="Thích"
                          >
                            <ThumbsUp 
                              size={16} 
                              className={likedComments.has(comment._id) ? 'fill-current' : ''}
                            />
                            <span className="text-sm font-medium">{comment.likeCount || 0}</span>
                          </button>

                          <button
                            onClick={() => handleDislike(comment._id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                              dislikedComments.has(comment._id)
                                ? 'bg-red-500/20 text-red-500'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            title="Không thích"
                          >
                            <ThumbsDown 
                              size={16} 
                              className={dislikedComments.has(comment._id) ? 'fill-current' : ''}
                            />
                            <span className="text-sm font-medium">{comment.dislikeCount || 0}</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Report count indicator */}
                  {comment.reportCount > 0 && (
                    <div className="mt-2 text-xs text-orange-500 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>{comment.reportCount} báo cáo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Flag size={20} className="text-orange-500" />
                Báo cáo bình luận
              </h3>
              <button onClick={closeReportModal} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Vui lòng cho chúng tôi biết lý do bạn báo cáo bình luận này. Chúng tôi sẽ xem xét và xử lý phù hợp.
              </p>
              
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ví dụ: Spam, ngôn từ không phù hợp, thông tin sai lệch..."
                className="w-full h-32 bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                maxLength={500}
              />
              
              <div className="text-xs text-muted-foreground">
                {reportReason.length} / 500 ký tự
              </div>
            </div>
            
            <div className="flex gap-2 justify-end p-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={closeReportModal}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleReportComment}
                disabled={reportSubmitting || !reportReason.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {reportSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </>
                ) : (
                  'Gửi báo cáo'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
