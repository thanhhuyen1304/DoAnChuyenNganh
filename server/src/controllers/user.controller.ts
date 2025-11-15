import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Submission from '../models/submission.model'
import Challenge from '../models/challenge.model'
import User from '../models/user.model'
import bcrypt from 'bcryptjs'

// GET /api/users/me/progress
export const getMyProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' })
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Total active challenges
    const totalChallenges = await Challenge.countDocuments({ isActive: true })

    // Completed challenges: distinct challenge IDs where user has Accepted submissions
    const completedDistinct = await Submission.distinct('challenge', { user: userObjectId, status: 'Accepted' })
    const completedCount = Array.isArray(completedDistinct) ? completedDistinct.length : 0

    // Learning time: sum executionTime (ms) for accepted submissions
    const agg = await Submission.aggregate([
      { $match: { user: userObjectId, status: 'Accepted', executionTime: { $exists: true } } },
      { $group: { _id: null, totalExecutionTimeMs: { $sum: '$executionTime' } } }
    ])
    const totalExecutionTimeMs = agg[0]?.totalExecutionTimeMs || 0
    const learningTimeMinutes = Math.round(totalExecutionTimeMs / 60000)

    // Ranking: compute completedCount per user and derive percentile
    const perUser = await Submission.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: { user: '$user', challenge: '$challenge' } } },
      { $group: { _id: '$_id.user', completedCount: { $sum: 1 } } }
    ])

    const totalUsersWithCompletions = perUser.length
    const currentUserEntry = perUser.find((p: any) => p._id.toString() === userId)
    const currentCompleted = currentUserEntry ? currentUserEntry.completedCount : 0
    const higherCount = perUser.filter((p: any) => p.completedCount > currentCompleted).length
    const rankingPercent = totalUsersWithCompletions === 0 ? 100 : Math.max(1, Math.round(((totalUsersWithCompletions - higherCount) / Math.max(1, totalUsersWithCompletions)) * 100))

    return res.json({
      success: true,
      data: {
        completed: currentCompleted,
        total: totalChallenges,
        learningTimeMinutes,
        rankingPercent
      }
    })
  } catch (err) {
    console.error('getMyProgress error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// GET /api/users/:username/progress  (public)
export const getProgressByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params
    if (!username) return res.status(400).json({ success: false, message: 'Username is required' })

    // find user by username (case-insensitive)
    const user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const userId = (user._id as any).toString()
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Total active challenges
    const totalChallenges = await Challenge.countDocuments({ isActive: true })

    // Completed challenges
    const completedDistinct = await Submission.distinct('challenge', { user: userObjectId, status: 'Accepted' })
    const completedCount = Array.isArray(completedDistinct) ? completedDistinct.length : 0

    // Learning time
    const agg = await Submission.aggregate([
      { $match: { user: userObjectId, status: 'Accepted', executionTime: { $exists: true } } },
      { $group: { _id: null, totalExecutionTimeMs: { $sum: '$executionTime' } } }
    ])
    const totalExecutionTimeMs = agg[0]?.totalExecutionTimeMs || 0
    const learningTimeMinutes = Math.round(totalExecutionTimeMs / 60000)

    // Ranking percentile (based on completed counts)
    const perUser = await Submission.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: { user: '$user', challenge: '$challenge' } } },
      { $group: { _id: '$_id.user', completedCount: { $sum: 1 } } }
    ])

    const totalUsersWithCompletions = perUser.length
    const currentUserEntry = perUser.find((p: any) => p._1.d && p._id.toString() === userId)
    const currentCompleted = currentUserEntry ? currentUserEntry.completedCount : 0
    const higherCount = perUser.filter((p: any) => p.completedCount > currentCompleted).length
    const rankingPercent = totalUsersWithCompletions === 0 ? 100 : Math.max(1, Math.round(((totalUsersWithCompletions - higherCount) / Math.max(1, totalUsersWithCompletions)) * 100))

    return res.json({
      success: true,
      data: {
        username: user.username,
        completed: currentCompleted,
        total: totalChallenges,
        learningTimeMinutes,
        rankingPercent
      }
    })
  } catch (err) {
    console.error('getProgressByUsername error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// PATCH /api/users/me  (update profile)
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Chưa xác thực' })

    const allowed: any = {}
    const { avatar, email, phone, password } = req.body || {}
    if (typeof avatar === 'string') allowed.avatar = avatar.trim()
    if (typeof email === 'string' && email.trim().length > 3) allowed.email = email.trim()
    if (typeof phone === 'string' && phone.trim().length > 0) allowed.phone = phone.trim()

    // Password handled separately (hashed)

    if (Object.keys(allowed).length === 0 && typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Không có trường nào để cập nhật' })
    }

    // Validate email uniqueness
    if (allowed.email) {
      const existsEmail = await User.findOne({ email: allowed.email, _id: { $ne: req.user?.id } })
      if (existsEmail) return res.status(400).json({ success: false, message: 'Email đã được sử dụng' })
    }

    // Validate phone uniqueness
    if (allowed.phone) {
      const existsPhone = await User.findOne({ phone: allowed.phone, _id: { $ne: req.user?.id } })
      if (existsPhone) return res.status(400).json({ success: false, message: 'Số điện thoại đã được sử dụng' })
    }

    // Prepare update object
    const updateObj: any = { ...allowed }

    // Handle password change
    if (typeof password === 'string' && password.length > 0) {
      const { oldPassword } = req.body
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ' })
      }

      // Get user with password (need to explicitly select password field)
      const user = await User.findById(userId).select('+password')
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      }

      // Verify old password
      const isMatch = await user.comparePassword(oldPassword)
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' })
      }

      // Validate and hash new password
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      }
      const salt = await bcrypt.genSalt(10)
      const hashed = await bcrypt.hash(password, salt)
      updateObj.password = hashed
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updateObj }, { new: true })
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })

    return res.json({
      success: true,
      data: {
        id: (updated._id as any).toString(),
        email: updated.email,
        username: updated.username, // Include username in response but don't allow updates
        avatar: updated.avatar,
        phone: updated.phone,
      }
    })
  } catch (err) {
    console.error('updateMe error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

export default { getMyProgress, updateMe }
