import { Request, Response } from 'express';
import Achievement from '../models/achievement.model';
import User from '../models/user.model';

export class AchievementController {
  // Tạo achievement mới (admin)
  async createAchievement(req: Request, res: Response): Promise<any> {
    try {
      const { name, description, icon, type, condition, points, badge, isActive } = req.body;

      if (!name || !description || !type || !condition || !badge) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc',
        });
      }

      const achievement = new Achievement({
        name,
        description,
        icon: icon || '🏆',
        type,
        condition,
        points: points || 0,
        badge,
        isActive: isActive !== false,
      });

      await achievement.save();

      return res.status(201).json({
        success: true,
        message: 'Tạo thành tích thành công',
        data: { achievement },
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Tên thành tích đã tồn tại',
        });
      }
      console.error('Lỗi tạo achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy danh sách achievements
  async getAllAchievements(req: Request, res: Response): Promise<any> {
    try {
      const isActive = req.query.isActive as string;
      const type = req.query.type as string;

      const query: any = {};

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (type) {
        query.type = type;
      }

      const achievements = await Achievement.find(query).sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: { achievements },
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách achievements:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy achievement theo ID
  async getAchievementById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const achievement = await Achievement.findById(id);
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      return res.json({
        success: true,
        data: { achievement },
      });
    } catch (error) {
      console.error('Lỗi lấy achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Cập nhật achievement (admin)
  async updateAchievement(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const achievement = await Achievement.findByIdAndUpdate(id, updateData, { new: true });
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      return res.json({
        success: true,
        message: 'Cập nhật thành tích thành công',
        data: { achievement },
      });
    } catch (error) {
      console.error('Lỗi cập nhật achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Xóa achievement (admin)
  async deleteAchievement(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const achievement = await Achievement.findByIdAndDelete(id);
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      return res.json({
        success: true,
        message: 'Xóa thành tích thành công',
      });
    } catch (error) {
      console.error('Lỗi xóa achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy achievements của user
  async getUserAchievements(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;
      const targetUserId = userId || req.user?.id;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu userId',
        });
      }

      const user = await User.findById(targetUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      // Lấy tất cả achievements active
      const allAchievements = await Achievement.find({ isActive: true });

      // Kiểm tra achievements mà user đã đạt được (dựa vào badges)
      const userBadges = user.badges || [];
      const achievements = allAchievements.map((achievement) => ({
        ...achievement.toObject(),
        unlocked: userBadges.includes(achievement.badge),
        unlockedAt: userBadges.includes(achievement.badge) ? user.updatedAt : null,
      }));

      return res.json({
        success: true,
        data: {
          achievements,
          unlockedCount: achievements.filter((a) => a.unlocked).length,
          totalCount: achievements.length,
        },
      });
    } catch (error) {
      console.error('Lỗi lấy achievements của user:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Thêm badge cho user (admin hoặc system)
  async awardAchievement(req: Request, res: Response): Promise<any> {
    try {
      const { userId, achievementId } = req.body;

      if (!userId || !achievementId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu userId hoặc achievementId',
        });
      }

      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      // Kiểm tra xem user đã có badge này chưa
      if (user.badges.includes(achievement.badge)) {
        return res.status(400).json({
          success: false,
          message: 'User đã có thành tích này',
        });
      }

      // Thêm badge và cộng points
      user.badges.push(achievement.badge);
      user.experience += achievement.points || 0;

      await user.save();

      return res.json({
        success: true,
        message: 'Đã trao thành tích cho user',
        data: {
          user: {
            id: user.id,
            badges: user.badges,
            experience: user.experience,
          },
          achievement,
        },
      });
    } catch (error) {
      console.error('Lỗi trao achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}

