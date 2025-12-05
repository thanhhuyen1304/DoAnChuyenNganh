import { Request, Response } from 'express';
import Achievement from '../models/achievement.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

export class AchievementController {
  // Tạo achievement mới (admin)
  async createAchievement(req: Request, res: Response): Promise<any> {
    try {
      console.log('=== CREATE ACHIEVEMENT REQUEST ===');
      console.log('User:', req.user?.email, 'Role:', req.user?.role);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const { name, description, icon, image, type, condition, points, badge, isActive } = req.body;

      // Validation với thông báo chi tiết
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!description) missingFields.push('description');
      if (!type) missingFields.push('type');
      if (!condition) missingFields.push('condition');
      if (!badge) missingFields.push('badge');

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        return res.status(400).json({
          success: false,
          message: `Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`,
          missingFields,
        });
      }

      // Validate condition với thông báo chi tiết
      if (!condition.type) {
        console.log('Missing condition.type');
        return res.status(400).json({
          success: false,
          message: 'Điều kiện thiếu trường "type"',
        });
      }

      if (typeof condition.value !== 'number' && isNaN(Number(condition.value))) {
        console.log('Invalid condition.value:', condition.value, typeof condition.value);
        return res.status(400).json({
          success: false,
          message: 'Điều kiện "value" phải là số hợp lệ',
        });
      }

      // Validate type
      const validTypes = ['challenge', 'streak', 'points', 'special', 'support', 'teamwork', 'creativity'];
      if (!validTypes.includes(type)) {
        console.log('Invalid type:', type);
        return res.status(400).json({
          success: false,
          message: `Type không hợp lệ. Chỉ chấp nhận: ${validTypes.join(', ')}`,
        });
      }

      // Check duplicate name
      const existingAchievement = await Achievement.findOne({ name: name.trim() });
      if (existingAchievement) {
        console.log('Duplicate achievement name:', name);
        return res.status(400).json({
          success: false,
          message: `Thành tích với tên "${name}" đã tồn tại`,
        });
      }

      const achievementData = {
        name: name.trim(),
        description: description.trim(),
        icon: icon || '🏆',
        image: image?.trim() || undefined,
        type,
        condition: {
          type: condition.type.trim(),
          value: Number(condition.value),
        },
        points: Number(points) || 0,
        badge: badge.trim(),
        isActive: isActive !== false,
        createdBy: req.user?.id,
      };

      console.log('Creating achievement with data:', achievementData);

      const achievement = new Achievement(achievementData);
      await achievement.save();

      console.log('Achievement created successfully:', achievement._id);

      return res.status(201).json({
        success: true,
        message: 'Tạo thành tích thành công',
        data: { achievement },
      });
    } catch (error: any) {
      console.error('=== ERROR CREATING ACHIEVEMENT ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (error.code === 11000) {
        const duplicateKey = Object.keys(error.keyPattern || {})[0];
        return res.status(400).json({
          success: false,
          message: `Giá trị "${duplicateKey}" đã tồn tại trong hệ thống`,
        });
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message,
      });
    }
  }

  // Lấy danh sách achievements với phân trang, tìm kiếm, lọc, sắp xếp
  async getAllAchievements(req: Request, res: Response): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        isActive,
        type,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeDeleted = 'false',
      } = req.query;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = {};

      // Soft delete filter (chỉ admin mới thấy deleted items)
      if (includeDeleted === 'true' && req.user?.role === 'admin') {
        // Show all including deleted
      } else {
        query.isDeleted = false;
      }

      // Active filter
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      // Type filter
      if (type) {
        query.type = type;
      }

      // Search by name or description
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { badge: { $regex: search, $options: 'i' } },
        ];
      }

      // Sort
      const sortOptions: any = {};
      sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const [achievements, total] = await Promise.all([
        Achievement.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .populate('createdBy', 'username email')
          .populate('updatedBy', 'username email')
          .populate('deletedBy', 'username email')
          .lean(),
        Achievement.countDocuments(query),
      ]);

      // Get statistics for each achievement (count users who earned it)
      const achievementsWithStats = await Promise.all(
        achievements.map(async (achievement) => {
          const usersCount = await User.countDocuments({
            badges: achievement.badge,
          });
          return {
            ...achievement,
            usersEarnedCount: usersCount,
          };
        })
      );

      return res.json({
        success: true,
        data: {
          achievements: achievementsWithStats,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasMore: pageNum * limitNum < total,
          },
        },
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách achievements:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy achievement theo ID với thống kê chi tiết
  async getAchievementById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID không hợp lệ',
        });
      }

      const achievement = await Achievement.findById(id)
        .populate('createdBy', 'username email avatar')
        .populate('updatedBy', 'username email avatar')
        .populate('deletedBy', 'username email avatar');

      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      // Get users who earned this achievement
      const usersEarned = await User.find(
        { badges: achievement.badge },
        'username email avatar experience rank createdAt'
      )
        .sort({ experience: -1 })
        .limit(50)
        .lean();

      // Statistics
      const stats = {
        totalUsersEarned: usersEarned.length,
        recentUsers: usersEarned.slice(0, 10),
      };

      return res.json({
        success: true,
        data: {
          achievement,
          stats,
        },
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

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID không hợp lệ',
        });
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.createdAt;
      delete updateData.createdBy;
      delete updateData.isDeleted;
      delete updateData.deletedAt;
      delete updateData.deletedBy;

      // Validate type if provided
      if (updateData.type) {
        const validTypes = ['challenge', 'streak', 'points', 'special', 'support', 'teamwork', 'creativity'];
        if (!validTypes.includes(updateData.type)) {
          return res.status(400).json({
            success: false,
            message: `Type không hợp lệ. Chỉ chấp nhận: ${validTypes.join(', ')}`,
          });
        }
      }

      // Validate condition if provided
      if (updateData.condition) {
        if (!updateData.condition.type || typeof updateData.condition.value !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Điều kiện không hợp lệ: cần có type và value (số)',
          });
        }
      }

      // Trim string fields
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.description) updateData.description = updateData.description.trim();
      if (updateData.badge) updateData.badge = updateData.badge.trim();
      if (updateData.image) updateData.image = updateData.image.trim();

      // Add updatedBy
      updateData.updatedBy = req.user?.id;

      const achievement = await Achievement.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email');

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
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Tên thành tích đã tồn tại',
        });
      }
      console.error('Lỗi cập nhật achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message,
      });
    }
  }

  // Soft delete achievement (admin)
  async deleteAchievement(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { hard = 'false' } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID không hợp lệ',
        });
      }

      // Hard delete (permanent) - chỉ super admin
      if (hard === 'true') {
        const achievement = await Achievement.findByIdAndDelete(id);
        if (!achievement) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy thành tích',
          });
        }

        return res.json({
          success: true,
          message: 'Xóa vĩnh viễn thành tích thành công',
        });
      }

      // Soft delete (default)
      const achievement = await Achievement.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user?.id,
          isActive: false, // Tự động deactivate khi xóa
        },
        { new: true }
      );

      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      return res.json({
        success: true,
        message: 'Xóa thành tích thành công (soft delete)',
        data: { achievement },
      });
    } catch (error) {
      console.error('Lỗi xóa achievement:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Restore soft-deleted achievement (admin)
  async restoreAchievement(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID không hợp lệ',
        });
      }

      const achievement = await Achievement.findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          updatedBy: req.user?.id,
        },
        { new: true }
      );

      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      return res.json({
        success: true,
        message: 'Khôi phục thành tích thành công',
        data: { achievement },
      });
    } catch (error) {
      console.error('Lỗi khôi phục achievement:', error);
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

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ',
        });
      }

      const user = await User.findById(targetUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      // Lấy tất cả achievements active và không bị xóa
      const allAchievements = await Achievement.find({
        isActive: true,
        isDeleted: false,
      }).lean();

      // Kiểm tra achievements mà user đã đạt được (dựa vào badges)
      const userBadges = user.badges || [];
      const achievements = allAchievements.map((achievement) => ({
        ...achievement,
        unlocked: userBadges.includes(achievement.badge),
        unlockedAt: userBadges.includes(achievement.badge) ? user.updatedAt : null,
      }));

      // Categorize achievements
      const categorized = {
        unlocked: achievements.filter((a) => a.unlocked),
        locked: achievements.filter((a) => !a.unlocked),
      };

      return res.json({
        success: true,
        data: {
          achievements,
          categorized,
          unlockedCount: categorized.unlocked.length,
          totalCount: achievements.length,
          progress: achievements.length > 0
            ? Math.round((categorized.unlocked.length / achievements.length) * 100)
            : 0,
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

      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(achievementId)) {
        return res.status(400).json({
          success: false,
          message: 'userId hoặc achievementId không hợp lệ',
        });
      }

      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành tích',
        });
      }

      if (achievement.isDeleted) {
        return res.status(400).json({
          success: false,
          message: 'Không thể trao thành tích đã bị xóa',
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
            username: user.username,
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

  // Lấy thống kê tổng quan về achievements
  async getAchievementStats(req: Request, res: Response): Promise<any> {
    try {
      const [
        totalAchievements,
        activeAchievements,
        deletedAchievements,
        achievementsByType,
      ] = await Promise.all([
        Achievement.countDocuments({ isDeleted: false }),
        Achievement.countDocuments({ isActive: true, isDeleted: false }),
        Achievement.countDocuments({ isDeleted: true }),
        Achievement.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
      ]);

      // Get top achievements (most earned)
      const allAchievements = await Achievement.find({ isDeleted: false }).lean();
      const topAchievements = await Promise.all(
        allAchievements.map(async (achievement) => {
          const count = await User.countDocuments({ badges: achievement.badge });
          return {
            ...achievement,
            usersEarnedCount: count,
          };
        })
      );
      topAchievements.sort((a, b) => b.usersEarnedCount - a.usersEarnedCount);

      return res.json({
        success: true,
        data: {
          summary: {
            total: totalAchievements,
            active: activeAchievements,
            inactive: totalAchievements - activeAchievements,
            deleted: deletedAchievements,
          },
          byType: achievementsByType.reduce((acc: any, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          topEarned: topAchievements.slice(0, 10),
        },
      });
    } catch (error) {
      console.error('Lỗi lấy thống kê achievements:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}
