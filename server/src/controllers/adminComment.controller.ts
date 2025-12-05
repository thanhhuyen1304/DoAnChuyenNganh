import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/comment.model';
import Challenge from '../models/challenge.model';

// GET /api/admin/comments/reported - Lấy tất cả comments bị báo cáo
export const getReportedComments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'reports' } = req.query;

    // Build query - lấy comments có ít nhất 1 report
    const query: any = {
      'reports.0': { $exists: true }, // Có ít nhất 1 report
    };

    // Sort options
    let sortOption: any = { 'reports': -1 }; // Mặc định: nhiều reports nhất
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get reported comments with full details
    const comments = await Comment.find(query)
      .populate('user', 'username avatar email')
      .populate('challenge', 'title difficulty language')
      .populate('reports.user', 'username email')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count
    const total = await Comment.countDocuments(query);

    // Format response with report details
    const formattedComments = comments.map((comment: any) => ({
      _id: comment._id,
      user: comment.user,
      challenge: comment.challenge,
      content: comment.content,
      reportCount: comment.reports?.length || 0,
      reports: comment.reports || [],
      likeCount: comment.likes?.length || 0,
      dislikeCount: comment.dislikes?.length || 0,
      isHidden: comment.isHidden,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    return res.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting reported comments:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// GET /api/admin/comments - Lấy tất cả comments (có thể filter theo challenge)
export const getAllComments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, challengeId, sort = 'newest' } = req.query;

    // Build query
    const query: any = {};
    if (challengeId) {
      query.challenge = new mongoose.Types.ObjectId(challengeId as string);
    }

    // Sort
    let sortOption: any = { createdAt: -1 }; // Mặc định: mới nhất
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'reports') {
      sortOption = { reports: -1 };
    } else if (sort === 'likes') {
      sortOption = { likes: -1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get comments
    const comments = await Comment.find(query)
      .populate('user', 'username avatar email')
      .populate('challenge', 'title difficulty language')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count
    const total = await Comment.countDocuments(query);

    // Get unique challenges if not filtering by challengeId
    let challenges: any[] = [];
    if (!challengeId) {
      challenges = await Challenge.find({ isActive: true })
        .select('_id title difficulty language')
        .sort({ title: 1 })
        .lean();
    }

    // Format response
    const formattedComments = comments.map((comment: any) => ({
      _id: comment._id,
      user: comment.user,
      challenge: comment.challenge,
      content: comment.content,
      reportCount: comment.reports?.length || 0,
      likeCount: comment.likes?.length || 0,
      dislikeCount: comment.dislikes?.length || 0,
      isHidden: comment.isHidden,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    return res.json({
      success: true,
      data: {
        comments: formattedComments,
        challenges,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting all comments:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// PATCH /api/admin/comments/:commentId/hide - Ẩn/hiện comment
export const toggleHideComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { isHidden, reason } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    comment.isHidden = isHidden !== undefined ? isHidden : !comment.isHidden;
    await comment.save();

    // Log action (có thể thêm admin action log model sau)
    console.log(`Admin ${req.user?.id} ${comment.isHidden ? 'hid' : 'unhid'} comment ${commentId}. Reason: ${reason || 'N/A'}`);

    return res.json({
      success: true,
      message: comment.isHidden ? 'Đã ẩn bình luận' : 'Đã hiện bình luận',
      data: { isHidden: comment.isHidden },
    });
  } catch (error: any) {
    console.error('Error toggling hide comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// DELETE /api/admin/comments/:commentId - Xóa comment (admin)
export const adminDeleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Log action
    console.log(`Admin ${req.user?.id} deleted comment ${commentId}`);

    return res.json({
      success: true,
      message: 'Đã xóa bình luận',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// GET /api/admin/comments/stats - Thống kê comments
export const getCommentStats = async (req: Request, res: Response) => {
  try {
    const totalComments = await Comment.countDocuments();
    const reportedComments = await Comment.countDocuments({ 'reports.0': { $exists: true } });
    const hiddenComments = await Comment.countDocuments({ isHidden: true });

    // Comments per challenge (top 10)
    const commentsPerChallenge = await Comment.aggregate([
      {
        $group: {
          _id: '$challenge',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'challenges',
          localField: '_id',
          foreignField: '_id',
          as: 'challenge',
        },
      },
      { $unwind: '$challenge' },
      {
        $project: {
          _id: 1,
          count: 1,
          challengeTitle: '$challenge.title',
        },
      },
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentComments = await Comment.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    return res.json({
      success: true,
      data: {
        total: totalComments,
        reported: reportedComments,
        hidden: hiddenComments,
        recentWeek: recentComments,
        topChallenges: commentsPerChallenge,
      },
    });
  } catch (error: any) {
    console.error('Error getting comment stats:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

export default {
  getReportedComments,
  getAllComments,
  toggleHideComment,
  adminDeleteComment,
  getCommentStats,
};
