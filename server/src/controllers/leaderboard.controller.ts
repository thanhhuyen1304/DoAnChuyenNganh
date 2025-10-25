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
      { $project: { _id: 0, userId: '$_id', username: '$user.username', avatar: '$user.avatar', completedCount: 1, totalPoints: 1 } },
      { $sort: { totalPoints: -1, completedCount: -1 } },
      { $limit: limit }
    ]

    const results = await Submission.aggregate(pipeline)

    // Attach rank
    const withRank = results.map((r: any, idx: number) => ({ rank: idx + 1, ...r }))

    return res.json({ success: true, data: withRank })
  } catch (err) {
    console.error('getTopLearners error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

export default { getTopLearners }
