import { Request, Response } from 'express';
import Feedback from '../models/feedback.model';

export class FeedbackController {
  // Tạo feedback mới (user)
  async createFeedback(req: Request, res: Response): Promise<any> {
    try {
      const { type, title, content, rating } = req.body;

      if (!type || !title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc',
        });
      }

      const feedback = new Feedback({
        user: req.user?.id,
        type,
        title,
        content,
        rating,
        status: 'pending',
      });

      await feedback.save();
      await feedback.populate('user', 'username email');

      return res.status(201).json({
        success: true,
        message: 'Phản hồi đã được gửi thành công',
        data: { feedback },
      });
    } catch (error) {
      console.error('Lỗi tạo feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy danh sách feedback (admin)
  async getAllFeedback(req: Request, res: Response): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const type = req.query.type as string;

      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const feedbacks = await Feedback.find(query)
        .populate('user', 'username email')
        .populate('respondedBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Feedback.countDocuments(query);

      return res.json({
        success: true,
        data: {
          feedbacks,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy feedback của user hiện tại
  async getMyFeedback(req: Request, res: Response): Promise<any> {
    try {
      const feedbacks = await Feedback.find({ user: req.user?.id })
        .populate('respondedBy', 'username email')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: { feedbacks },
      });
    } catch (error) {
      console.error('Lỗi lấy feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Cập nhật trạng thái feedback (admin)
  async updateFeedbackStatus(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      if (!status || !['pending', 'reviewing', 'in_progress', 'completed', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
        });
      }

      const updateData: any = {
        status,
        adminResponse,
      };

      if (adminResponse) {
        updateData.respondedBy = req.user?.id;
        updateData.respondedAt = new Date();
      }

      const feedback = await Feedback.findByIdAndUpdate(id, updateData, { new: true })
        .populate('user', 'username email')
        .populate('respondedBy', 'username email');

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phản hồi',
        });
      }

      return res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: { feedback },
      });
    } catch (error) {
      console.error('Lỗi cập nhật feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Xóa feedback
  async deleteFeedback(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const feedback = await Feedback.findById(id);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phản hồi',
        });
      }

      // Chỉ cho phép xóa feedback của chính mình hoặc admin
      if (feedback.user.toString() !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xóa phản hồi này',
        });
      }

      await Feedback.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: 'Xóa phản hồi thành công',
      });
    } catch (error) {
      console.error('Lỗi xóa feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy thống kê feedback
  async getFeedbackStats(req: Request, res: Response): Promise<any> {
    try {
      const total = await Feedback.countDocuments();
      const pending = await Feedback.countDocuments({ status: 'pending' });
      const reviewing = await Feedback.countDocuments({ status: 'reviewing' });
      const inProgress = await Feedback.countDocuments({ status: 'in_progress' });
      const completed = await Feedback.countDocuments({ status: 'completed' });
      const rejected = await Feedback.countDocuments({ status: 'rejected' });

      // Average rating
      const avgRating = await Feedback.aggregate([
        { $match: { rating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]);

      // By type
      const byType = await Feedback.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      return res.json({
        success: true,
        data: {
          total,
          byStatus: {
            pending,
            reviewing,
            inProgress,
            completed,
            rejected,
          },
          averageRating: avgRating[0]?.avgRating || 0,
          byType: byType.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error('Lỗi lấy thống kê feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}

