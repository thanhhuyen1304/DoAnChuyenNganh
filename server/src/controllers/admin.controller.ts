import { Request, Response } from 'express';
import User from '../models/user.model';
import mongoose from 'mongoose';

export class AdminController {
  // Lấy danh sách tất cả users (có phân trang và filter)
  async getAllUsers(req: Request, res: Response): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search as string || '';
      const role = req.query.role as string;
      const isBanned = req.query.isBanned as string;

      const query: any = {};
      const andConditions: any[] = [];

      // Build search conditions
      if (search && search.trim()) {
        andConditions.push({
          $or: [
            { username: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } }
          ]
        });
      }

      // Filter by role
      if (role && role.trim()) {
        const roleValue = role.trim();
        if (roleValue === 'user') {
          // For 'user' role, include both users with role='user' and users without role field (default is 'user')
          andConditions.push({
            $or: [
              { role: 'user' },
              { role: { $exists: false } },
              { role: null }
            ]
          });
        } else {
          andConditions.push({ role: roleValue });
        }
      }

      // Filter by ban status
      if (isBanned === 'true') {
        andConditions.push({ isBanned: true });
      } else if (isBanned === 'false') {
        andConditions.push({ isBanned: { $ne: true } });
      }

      // Combine all conditions with $and if we have multiple conditions
      if (andConditions.length > 0) {
        if (andConditions.length === 1) {
          Object.assign(query, andConditions[0]);
        } else {
          query.$and = andConditions;
        }
      }

      // Debug log
      console.log('[Admin] Query params:', { page, limit, search, role, isBanned });
      console.log('[Admin] MongoDB query:', JSON.stringify(query, null, 2));

      const users = await User.find(query)
        .select('-password -resetCode -resetCodeExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      return res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách users:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy thông tin chi tiết một user
  async getUserById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password -resetCode -resetCodeExpires');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      return res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin user:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Cập nhật role của user
  async updateUserRole(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role không hợp lệ',
        });
      }

      // Không cho phép tự thay đổi role của chính mình
      if (id === req.user?.id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể thay đổi role của chính mình',
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      ).select('-password -resetCode -resetCodeExpires');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      return res.json({
        success: true,
        message: 'Cập nhật role thành công',
        data: { user },
      });
    } catch (error) {
      console.error('Lỗi cập nhật role:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Ban/Unban user
  async banUser(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { isBanned, banReason, bannedUntil } = req.body;

      if (id === req.user?.id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể ban chính mình',
        });
      }

      const updateData: any = {
        isBanned: isBanned === true || isBanned === 'true',
      };

      if (updateData.isBanned) {
        if (banReason) updateData.banReason = banReason;
        if (bannedUntil) updateData.bannedUntil = new Date(bannedUntil);
      } else {
        updateData.banReason = undefined;
        updateData.bannedUntil = undefined;
      }

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).select('-password -resetCode -resetCodeExpires');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      return res.json({
        success: true,
        message: updateData.isBanned ? 'Đã ban user' : 'Đã unban user',
        data: { user },
      });
    } catch (error) {
      console.error('Lỗi ban/unban user:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Xóa user
  async deleteUser(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      if (id === req.user?.id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa chính mình',
        });
      }

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      return res.json({
        success: true,
        message: 'Xóa user thành công',
      });
    } catch (error) {
      console.error('Lỗi xóa user:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Lấy thống kê users
  async getUserStats(req: Request, res: Response): Promise<any> {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isBanned: { $ne: true } });
      const bannedUsers = await User.countDocuments({ isBanned: true });
      const adminUsers = await User.countDocuments({ role: 'admin' });
      const moderatorUsers = await User.countDocuments({ role: 'moderator' });
      const regularUsers = await User.countDocuments({ role: 'user' });

      // Users by login method
      const localUsers = await User.countDocuments({ loginMethod: 'local' });
      const googleUsers = await User.countDocuments({ loginMethod: 'google' });
      const githubUsers = await User.countDocuments({ loginMethod: 'github' });
      const facebookUsers = await User.countDocuments({ loginMethod: 'facebook' });

      // Recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      return res.json({
        success: true,
        data: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          byRole: {
            admin: adminUsers,
            moderator: moderatorUsers,
            user: regularUsers,
          },
          byLoginMethod: {
            local: localUsers,
            google: googleUsers,
            github: githubUsers,
            facebook: facebookUsers,
          },
          recent: recentUsers,
        },
      });
    } catch (error) {
      console.error('Lỗi lấy thống kê users:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}

