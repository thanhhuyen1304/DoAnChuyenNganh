import { Request, Response } from 'express';
import Report from '../models/report.model';
import User from '../models/user.model';

export class ReportController {
  // Tạo báo cáo mới (user)
  async createReport(req: Request, res: Response): Promise<any> {
    try {
      const { type, reason, description, reportedUser, reportedChallenge, reportedSubmission } = req.body;

      if (!type || !reason || !description) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc',
        });
      }

      const report = new Report({
        reporter: req.user?.id,
        type,
        reason,
        description,
        reportedUser,
        reportedChallenge,
        reportedSubmission,
        status: 'pending',
      });

      await report.save();
      await report.populate('reporter', 'username email');

      return res.status(201).json({
        success: true,
        message: 'Báo cáo đã được gửi thành công',
        data: { report },
      });
    } catch (error) {
      console.error('Lỗi tạo báo cáo:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy danh sách báo cáo (admin)
  async getAllReports(req: Request, res: Response): Promise<any> {
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

      const reports = await Report.find(query)
        .populate('reporter', 'username email')
        .populate('reportedUser', 'username email')
        .populate('reportedChallenge', 'title')
        .populate('resolvedBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Report.countDocuments(query);

      return res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách báo cáo:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy báo cáo theo ID
  async getReportById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const report = await Report.findById(id)
        .populate('reporter', 'username email')
        .populate('reportedUser', 'username email')
        .populate('reportedChallenge', 'title')
        .populate('resolvedBy', 'username email');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo',
        });
      }

      return res.json({
        success: true,
        data: { report },
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Cập nhật trạng thái báo cáo (admin)
  async updateReportStatus(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['pending', 'reviewing', 'resolved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
        });
      }

      const updateData: any = {
        status,
        adminNotes,
      };

      if (status === 'resolved' || status === 'rejected') {
        updateData.resolvedBy = req.user?.id;
        updateData.resolvedAt = new Date();
      }

      const report = await Report.findByIdAndUpdate(id, updateData, { new: true })
        .populate('reporter', 'username email')
        .populate('reportedUser', 'username email')
        .populate('resolvedBy', 'username email');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo',
        });
      }

      return res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: { report },
      });
    } catch (error) {
      console.error('Lỗi cập nhật báo cáo:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Xóa báo cáo (admin)
  async deleteReport(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const report = await Report.findByIdAndDelete(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo',
        });
      }

      return res.json({
        success: true,
        message: 'Xóa báo cáo thành công',
      });
    } catch (error) {
      console.error('Lỗi xóa báo cáo:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy thống kê báo cáo
  async getReportStats(req: Request, res: Response): Promise<any> {
    try {
      const total = await Report.countDocuments();
      const pending = await Report.countDocuments({ status: 'pending' });
      const reviewing = await Report.countDocuments({ status: 'reviewing' });
      const resolved = await Report.countDocuments({ status: 'resolved' });
      const rejected = await Report.countDocuments({ status: 'rejected' });

      // By type
      const byType = await Report.aggregate([
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
            resolved,
            rejected,
          },
          byType: byType.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error('Lỗi lấy thống kê báo cáo:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}

