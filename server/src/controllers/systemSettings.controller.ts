import { Request, Response } from 'express';
import SystemSettings from '../models/systemSettings.model';

export class SystemSettingsController {
  // Lấy tất cả settings (admin) hoặc public settings (user)
  async getAllSettings(req: Request, res: Response): Promise<any> {
    try {
      const category = req.query.category as string;
      const isPublic = req.query.isPublic as string;

      const query: any = {};

      // Nếu không phải admin, chỉ lấy public settings
      if (req.user?.role !== 'admin') {
        query.isPublic = true;
      } else if (isPublic !== undefined) {
        query.isPublic = isPublic === 'true';
      }

      if (category) {
        query.category = category;
      }

      const settings = await SystemSettings.find(query).sort({ category: 1, key: 1 });

      // Group by category
      const grouped = settings.reduce((acc: any, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});

      return res.json({
        success: true,
        data: {
          settings,
          grouped,
        },
      });
    } catch (error) {
      console.error('Lỗi lấy settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy setting theo key
  async getSettingByKey(req: Request, res: Response): Promise<any> {
    try {
      const { key } = req.params;

      const setting = await SystemSettings.findOne({ key: key.toUpperCase() });
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy setting',
        });
      }

      // Kiểm tra quyền truy cập
      if (!setting.isPublic && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập',
        });
      }

      return res.json({
        success: true,
        data: { setting },
      });
    } catch (error) {
      console.error('Lỗi lấy setting:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Tạo hoặc cập nhật setting (admin)
  async upsertSetting(req: Request, res: Response): Promise<any> {
    try {
      const { key, value, type, description, category, isPublic } = req.body;

      if (!key || value === undefined || !type) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc',
        });
      }

      // Validate type
      let validatedValue: any = value;
      if (type === 'number') {
        validatedValue = Number(value);
        if (isNaN(validatedValue)) {
          return res.status(400).json({
            success: false,
            message: 'Giá trị không phải là số',
          });
        }
      } else if (type === 'boolean') {
        validatedValue = value === 'true' || value === true;
      } else if (type === 'json') {
        try {
          validatedValue = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return res.status(400).json({
            success: false,
            message: 'JSON không hợp lệ',
          });
        }
      }

      const setting = await SystemSettings.findOneAndUpdate(
        { key: key.toUpperCase() },
        {
          key: key.toUpperCase(),
          value: validatedValue,
          type,
          description,
          category: category || 'general',
          isPublic: isPublic !== false,
          updatedBy: req.user?.id,
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        message: 'Cập nhật setting thành công',
        data: { setting },
      });
    } catch (error) {
      console.error('Lỗi cập nhật setting:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Xóa setting (admin)
  async deleteSetting(req: Request, res: Response): Promise<any> {
    try {
      const { key } = req.params;

      const setting = await SystemSettings.findOneAndDelete({ key: key.toUpperCase() });
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy setting',
        });
      }

      return res.json({
        success: true,
        message: 'Xóa setting thành công',
      });
    } catch (error) {
      console.error('Lỗi xóa setting:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Khởi tạo default settings (admin)
  async initializeDefaultSettings(req: Request, res: Response): Promise<any> {
    try {
      const defaultSettings = [
        {
          key: 'SITE_NAME',
          value: 'BugHunter',
          type: 'string' as const,
          description: 'Tên website',
          category: 'general' as const,
          isPublic: true,
        },
        {
          key: 'MAX_CHALLENGES_PER_DAY',
          value: 10,
          type: 'number' as const,
          description: 'Số lượng bài tập tối đa mỗi ngày',
          category: 'challenge' as const,
          isPublic: false,
        },
        {
          key: 'POINTS_PER_CHALLENGE',
          value: 10,
          type: 'number' as const,
          description: 'Điểm thưởng mỗi bài tập',
          category: 'challenge' as const,
          isPublic: true,
        },
        {
          key: 'ENABLE_REGISTRATION',
          value: true,
          type: 'boolean' as const,
          description: 'Cho phép đăng ký tài khoản mới',
          category: 'user' as const,
          isPublic: true,
        },
        {
          key: 'ENABLE_EMAIL_NOTIFICATIONS',
          value: true,
          type: 'boolean' as const,
          description: 'Bật thông báo email',
          category: 'notification' as const,
          isPublic: false,
        },
        {
          key: 'SESSION_TIMEOUT',
          value: 3600,
          type: 'number' as const,
          description: 'Thời gian hết hạn session (giây)',
          category: 'security' as const,
          isPublic: false,
        },
      ];

      const results = [];
      for (const setting of defaultSettings) {
        const existing = await SystemSettings.findOne({ key: setting.key });
        if (!existing) {
          const newSetting = new SystemSettings({
            ...setting,
            updatedBy: req.user?.id,
          });
          await newSetting.save();
          results.push({ key: setting.key, action: 'created' });
        } else {
          results.push({ key: setting.key, action: 'skipped' });
        }
      }

      return res.json({
        success: true,
        message: 'Khởi tạo default settings thành công',
        data: { results },
      });
    } catch (error) {
      console.error('Lỗi khởi tạo settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}

