import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/comment.model';
import Challenge from '../models/challenge.model';

// POST /api/comments - Tạo comment mới
export const createComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { challengeId, content } = req.body;

    // Validate input
    if (!challengeId || !content) {
      return res.status(400).json({ success: false, message: 'Challenge ID và nội dung là bắt buộc' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ success: false, message: 'Nội dung không được quá 5000 ký tự' });
    }

    // Check if challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
    }

    // Create comment
    const comment = new Comment({
      user: new mongoose.Types.ObjectId(userId),
      challenge: new mongoose.Types.ObjectId(challengeId),
      content: content.trim(),
    });

    await comment.save();

    // Populate user info
    await comment.populate('user', 'username avatar email');

    return res.status(201).json({
      success: true,
      message: 'Tạo bình luận thành công',
      data: comment,
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// GET /api/comments/challenge/:challengeId - Lấy tất cả comments của một challenge
export const getCommentsByChallenge = async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    if (!challengeId) {
      return res.status(400).json({ success: false, message: 'Challenge ID là bắt buộc' });
    }

    // Check if challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
    }

    // Build query
    const query: any = {
      challenge: new mongoose.Types.ObjectId(challengeId),
      isHidden: false, // Chỉ lấy comments chưa bị ẩn
    };

    // Sort
    let sortOption: any = { createdAt: -1 }; // Mặc định: mới nhất
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get comments
    const comments = await Comment.find(query)
      .populate('user', 'username avatar email')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count
    const total = await Comment.countDocuments(query);

    // Add report count to each comment (without showing who reported)
    const commentsWithReportCount = comments.map((comment: any) => ({
      ...comment,
      reportCount: comment.reports?.length || 0,
      likeCount: comment.likes?.length || 0,
      dislikeCount: comment.dislikes?.length || 0,
      reports: undefined, // Không trả về chi tiết reports cho user thường
      likes: undefined, // Không trả về danh sách user likes
      dislikes: undefined, // Không trả về danh sách user dislikes
    }));

    return res.json({
      success: true,
      data: {
        comments: commentsWithReportCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting comments:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// POST /api/comments/:commentId/report - Report/Tố cáo comment
export const reportComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { commentId } = req.params;
    const { reason } = req.body;

    // Validate input
    if (!commentId) {
      return res.status(400).json({ success: false, message: 'Comment ID là bắt buộc' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Lý do tố cáo là bắt buộc' });
    }

    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: 'Lý do không được quá 500 ký tự' });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Check if user already reported this comment
    const alreadyReported = comment.reports.some(
      (report) => report.user.toString() === userId
    );

    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'Bạn đã tố cáo bình luận này rồi' });
    }

    // Add report
    comment.reports.push({
      user: new mongoose.Types.ObjectId(userId),
      reason: reason.trim(),
      reportedAt: new Date(),
    });

    // Auto-hide comment if it has too many reports (e.g., 3 reports)
    const REPORT_THRESHOLD = 3;
    if (comment.reports.length >= REPORT_THRESHOLD) {
      comment.isHidden = true;
    }

    await comment.save();

    return res.json({
      success: true,
      message: 'Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng sạch sẽ hơn!',
      data: {
        reportCount: comment.reports.length,
        isHidden: comment.isHidden,
      },
    });
  } catch (error: any) {
    console.error('Error reporting comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// DELETE /api/comments/:commentId - Xóa comment (chỉ người tạo hoặc admin)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { commentId } = req.params;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Check permission: chỉ người tạo hoặc admin/moderator mới được xóa
    const isOwner = comment.user.toString() === userId;
    const isAdmin = userRole === 'admin' || userRole === 'moderator';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.json({
      success: true,
      message: 'Đã xóa bình luận',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// PATCH /api/comments/:commentId - Cập nhật comment (chỉ người tạo)
export const updateComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { commentId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ success: false, message: 'Nội dung không được quá 5000 ký tự' });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Check permission
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bình luận này' });
    }

    // Update comment
    comment.content = content.trim();
    await comment.save();

    await comment.populate('user', 'username avatar email');

    return res.json({
      success: true,
      message: 'Đã cập nhật bình luận',
      data: comment,
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// POST /api/comments/:commentId/like - Like/Unlike comment
export const likeComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { commentId } = req.params;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if already liked
    const likeIndex = comment.likes.findIndex((id) => id.toString() === userId);
    const dislikeIndex = comment.dislikes.findIndex((id) => id.toString() === userId);

    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like and remove dislike if exists
      comment.likes.push(userObjectId);
      if (dislikeIndex > -1) {
        comment.dislikes.splice(dislikeIndex, 1);
      }
    }

    await comment.save();

    return res.json({
      success: true,
      data: {
        likeCount: comment.likes.length,
        dislikeCount: comment.dislikes.length,
        isLiked: likeIndex === -1, // true if just liked, false if just unliked
      },
    });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// POST /api/comments/:commentId/dislike - Dislike/Undislike comment
export const dislikeComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { commentId } = req.params;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if already disliked
    const dislikeIndex = comment.dislikes.findIndex((id) => id.toString() === userId);
    const likeIndex = comment.likes.findIndex((id) => id.toString() === userId);

    if (dislikeIndex > -1) {
      // Undislike
      comment.dislikes.splice(dislikeIndex, 1);
    } else {
      // Dislike and remove like if exists
      comment.dislikes.push(userObjectId);
      if (likeIndex > -1) {
        comment.likes.splice(likeIndex, 1);
      }
    }

    await comment.save();

    return res.json({
      success: true,
      data: {
        likeCount: comment.likes.length,
        dislikeCount: comment.dislikes.length,
        isDisliked: dislikeIndex === -1, // true if just disliked, false if just undisliked
      },
    });
  } catch (error: any) {
    console.error('Error disliking comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

export default {
  createComment,
  getCommentsByChallenge,
  reportComment,
  deleteComment,
  updateComment,
  likeComment,
  dislikeComment,
};
