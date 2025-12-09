import express, { Request, Response } from 'express'
import {
  getMyProgress,
  getTodayStats,
  getProgressByUsername,
  updateMe,
  getMyPreferences,
  updateMyPreferences,
  getMyCompletedChallenges,
  searchUsers
} from '../controllers/user.controller'
import { authenticateToken, isAdmin } from '../middleware/auth'
import { uploadRateLimit } from '../middleware/rateLimit'
import { uploadAvatar, getFileUrl } from '../middleware/upload'
import User from '../models/user.model'

const router = express.Router()

// Admin: search users
router.get('/search', authenticateToken, isAdmin, searchUsers)

// Protected: get current user's progress
router.get('/me/progress', authenticateToken, getMyProgress)

// Protected: get today's stats
router.get('/me/today-stats', authenticateToken, getTodayStats)

// Protected: get completed challenges
router.get('/me/completed-challenges', authenticateToken, getMyCompletedChallenges)

// Update profile
router.patch('/me', authenticateToken, updateMe)

// Upload avatar
router.post('/me/avatar',
  authenticateToken,
  uploadRateLimit,
  ...uploadAvatar(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Chưa xác thực' });
      }

      const avatarUrl = getFileUrl(req.file);
      
      // Update user avatar
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      ).select('avatar username email');

      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      return res.json({
        success: true,
        message: 'Cập nhật avatar thành công',
        data: {
          avatar: user.avatar,
          filename: req.file.filename,
        }
      });
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }
)

// Get user preferences (language preferences)
router.get('/me/preferences', authenticateToken, getMyPreferences)

// Update user preferences (language preferences)
router.patch('/me/preferences', authenticateToken, updateMyPreferences)

// Public: get progress by username (case-insensitive)
router.get('/:username/progress', getProgressByUsername)

export default router
