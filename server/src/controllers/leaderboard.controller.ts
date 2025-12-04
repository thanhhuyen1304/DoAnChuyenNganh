import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Submission from '../models/submission.model'
import Challenge from '../models/challenge.model'
import User from '../models/user.model'

// GET /api/leaderboard/top?limit=5
export const getTopLearners = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '5')))

    // 1) Get distinct (user,challenge) pairs for Accepted submissions
    // 2) Lookup challenge points
    // 3) Aggregate per user: completedCount and totalPoints
    const pipeline: any[] = [
      { $match: { status: 'Accepted' } },
      { $group: { _id: { user: '$user', challenge: '$challenge' } } },
      { $lookup: {
          from: 'challenges',
          localField: '_id.challenge',
          foreignField: '_id',
          as: 'challenge'
      }},
      { $unwind: { path: '$challenge', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$_id.user', completedCount: { $sum: 1 }, totalPoints: { $sum: { $ifNull: ['$challenge.points', 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: 0,
        userId: '$_id',
        username: '$user.username',
        avatar: '$user.avatar',
        completedCount: 1,
        totalPoints: 1,
        createdAt: '$user.createdAt',
        badges: '$user.badges',
        rank: '$user.rank',
        experience: '$user.experience'
      } },
      { $sort: { totalPoints: -1, completedCount: -1 } },
      { $limit: limit }
    ]

    const results = await Submission.aggregate(pipeline)
    
    // Tính thời gian hoạt động và thêm huy chương
    const withDetails = results.map((r: any) => {
      const createdDate = r.createdAt ? new Date(r.createdAt) : new Date()
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - createdDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return {
        ...r,
        activityDays: diffDays,
        highestBadge: r.badges && r.badges.length > 0 ? r.badges[r.badges.length - 1] : null,
        userRank: r.rank || 'Newbie'
      }
    })

    // Attach rank
    const withRank = withDetails.map((r: any, idx: number) => ({ rank: idx + 1, ...r }))

    return res.json({ success: true, data: withRank })
  } catch (err) {
    console.error('getTopLearners error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// GET /api/leaderboard/practice - Xếp hạng bài đơn chi tiết
export const getPracticeLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50')))

    // Aggregate để lấy thông tin chi tiết
    const pipeline: any[] = [
      { $match: { status: 'Accepted' } },
      { $group: {
        _id: { user: '$user', challenge: '$challenge' },
        bestScore: { $max: '$score' },
        firstSubmit: { $min: '$submittedAt' }
      }},
      { $lookup: {
          from: 'challenges',
          localField: '_id.challenge',
          foreignField: '_id',
          as: 'challenge'
      }},
      { $unwind: { path: '$challenge', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: '$_id.user',
        completedCount: { $sum: 1 },
        totalPoints: { $sum: { $ifNull: ['$challenge.points', 0] } },
        highestScore: { $max: '$bestScore' },
        earliestSubmit: { $min: '$firstSubmit' }
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: 0,
        userId: '$_id',
        username: '$user.username',
        avatar: '$user.avatar',
        completedCount: 1,
        totalPoints: 1,
        highestScore: 1,
        createdAt: '$user.createdAt',
        badges: '$user.badges',
        rank: '$user.rank',
        experience: '$user.experience',
        earliestSubmit: 1
      }},
      { $sort: { totalPoints: -1, highestScore: -1, completedCount: -1 } },
      { $limit: limit }
    ]

    const results = await Submission.aggregate(pipeline)

    // Thêm thông tin chi tiết
    const withDetails = results.map((r: any) => {
      const createdDate = r.createdAt ? new Date(r.createdAt) : new Date()
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - createdDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return {
        userId: r.userId,
        username: r.username,
        avatar: r.avatar,
        completedCount: r.completedCount || 0,
        highestScore: r.highestScore || 0,
        totalPoints: r.totalPoints || 0,
        activityDays: diffDays,
        badges: r.badges || [],
        highestBadge: r.badges && r.badges.length > 0 ? r.badges[r.badges.length - 1] : null,
        userRank: r.rank || 'Newbie',
        experience: r.experience || 0
      }
    })

    // Gán rank
    const withRank = withDetails.map((r: any, idx: number) => ({
      rank: idx + 1,
      ...r
    }))

    return res.json({
      success: true,
      data: withRank,
      total: withRank.length
    })
  } catch (err) {
    console.error('getPracticeLeaderboard error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

export default { getTopLearners, getPracticeLeaderboard }
