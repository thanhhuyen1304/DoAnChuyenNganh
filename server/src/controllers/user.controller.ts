import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Submission from '../models/submission.model'
import Challenge from '../models/challenge.model'
import User from '../models/user.model'

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
    const currentUserEntry = perUser.find((p: any) => p._id.toString() === userId)
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

export default { getMyProgress }
