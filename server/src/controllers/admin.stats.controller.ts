import { Request, Response } from 'express';
import User from '../models/user.model';
import Challenge from '../models/challenge.model';
import Submission from '../models/submission.model';
import Achievement from '../models/achievement.model';
import mongoose from 'mongoose';

export class AdminStatsController {
  async getSystemStats(req: Request, res: Response): Promise<any> {
    try {
      const { range = '30days' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date(0); // Beginning of time
      
      switch (range) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      // Overview stats
      const [totalUsers, totalChallenges, totalSubmissions, totalAchievements] = await Promise.all([
        User.countDocuments(),
        Challenge.countDocuments({ isActive: true }),
        Submission.countDocuments(),
        Achievement.countDocuments({ isDeleted: false }),
      ]);

      // User growth (daily counts)
      const userGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1
          }
        }
      ]);

      // Challenges by difficulty
      const challengesByDifficulty = await Challenge.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            difficulty: '$_id',
            count: 1
          }
        }
      ]);

      // Challenges by language
      const challengesByLanguage = await Challenge.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            language: '$_id',
            count: 1
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Submissions by status
      const submissionsByStatus = await Submission.aggregate([
        {
          $match: {
            submittedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1
          }
        }
      ]);

      // Top users by experience
      const topUsers = await User.find()
        .select('username experience rank')
        .sort({ experience: -1 })
        .limit(10)
        .lean();

      // Achievement stats
      const allAchievements = await Achievement.find({ isDeleted: false }).lean();
      const achievementStats = await Promise.all(
        allAchievements.map(async (achievement) => {
          const count = await User.countDocuments({ badges: achievement.badge });
          return {
            name: achievement.name,
            earned: count
          };
        })
      );
      achievementStats.sort((a, b) => b.earned - a.earned);

      // Activity by day (last 7 days)
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const activityByDay = await Submission.aggregate([
        {
          $match: {
            submittedAt: { $gte: last7Days }
          }
        },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
              user: '$user'
            }
          }
        },
        {
          $group: {
            _id: '$_id.day',
            users: { $addToSet: '$_id.user' },
            submissions: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            day: '$_id',
            users: { $size: '$users' },
            submissions: 1
          }
        },
        {
          $sort: { day: 1 }
        }
      ]);

      // Ensure we have data for all fields (fill with empty arrays if needed)
      const safeUserGrowth = userGrowth.length > 0 ? userGrowth : [
        { date: new Date().toISOString().split('T')[0], count: totalUsers }
      ];

      const safeChallengesByDifficulty = challengesByDifficulty.length > 0 ? challengesByDifficulty : [
        { difficulty: 'Easy', count: 0 },
        { difficulty: 'Medium', count: 0 },
        { difficulty: 'Hard', count: 0 }
      ];

      const safeChallengesByLanguage = challengesByLanguage.length > 0 ? challengesByLanguage : [
        { language: 'Python', count: 0 },
        { language: 'JavaScript', count: 0 },
        { language: 'Java', count: 0 }
      ];

      const safeSubmissionsByStatus = submissionsByStatus.length > 0 ? submissionsByStatus : [
        { status: 'Accepted', count: 0 },
        { status: 'Wrong Answer', count: 0 },
        { status: 'Runtime Error', count: 0 }
      ];

      const safeActivityByDay = activityByDay.length > 0 ? activityByDay : [];

      return res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalChallenges,
            totalSubmissions,
            totalAchievements,
          },
          userGrowth: safeUserGrowth,
          challengesByDifficulty: safeChallengesByDifficulty,
          challengesByLanguage: safeChallengesByLanguage,
          submissionsByStatus: safeSubmissionsByStatus,
          topUsers: topUsers || [],
          achievementStats: achievementStats.slice(0, 10),
          activityByDay: safeActivityByDay,
        }
      });
    } catch (error) {
      console.error('Error getting system stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}