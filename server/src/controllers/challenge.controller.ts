import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Challenge, { IChallenge } from '../models/challenge.model';
import User from '../models/user.model';
import { Favorite } from '../models/favorite.model';
import Submission from '../models/submission.model';
import mongoose from 'mongoose';

// Extend Request interface để có user property
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Lấy danh sách bài tập (public)
export const getChallenges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      language,
      difficulty,
      category,
      search,
      isActive
    } = req.query;

    console.log('[getChallenges] Query params:', { page, limit, language, difficulty, category, search, isActive });

    // Parse isActive - default to true if not provided
    let isActiveFilter = true;
    if (isActive !== undefined) {
      if (typeof isActive === 'string') {
        isActiveFilter = isActive === 'true' || isActive === '';
      } else {
        isActiveFilter = Boolean(isActive);
      }
    }

    const filter: any = { isActive: isActiveFilter };
    
    // Lọc theo ngôn ngữ - trim và kiểm tra kỹ
    if (language && typeof language === 'string' && language.trim() !== '') {
      filter.language = language.trim();
      console.log('[getChallenges] Filtering by language:', filter.language);
    }
    
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    console.log('[getChallenges] Final filter:', JSON.stringify(filter, null, 2));

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'username email')
      .select('-buggyCode -correctCode -testCases')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Challenge.countDocuments(filter);

    console.log('[getChallenges] Found', challenges.length, 'challenges out of', total, 'total');

    // Enrich challenges with favorites count and submission stats
    const challengeIds = challenges.map(c => c._id);
    
    // Get favorites count for each challenge
    const favoritesCount = await Favorite.aggregate([
      { $match: { exercise_id: { $in: challengeIds } } },
      { $group: { _id: '$exercise_id', count: { $sum: 1 } } }
    ]);
    
    const favoritesMap = new Map(
      favoritesCount.map((f: any) => [f._id.toString(), f.count])
    );
    
    // Get submission stats for each challenge
    const submissionStats = await Submission.aggregate([
      { $match: { challenge: { $in: challengeIds } } },
      {
        $group: {
          _id: '$challenge',
          totalAttempts: { $sum: 1 },
          successfulAttempts: {
            $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const statsMap = new Map(
      submissionStats.map((s: any) => [
        s._id.toString(),
        { totalAttempts: s.totalAttempts, successfulAttempts: s.successfulAttempts }
      ])
    );
    
    // Enrich challenges with the computed data
    const enrichedChallenges = challenges.map((challenge: any) => {
      const challengeObj = challenge.toObject();
      const challengeId = challenge._id.toString();
      
      return {
        ...challengeObj,
        favorites: favoritesMap.get(challengeId) || 0,
        totalAttempts: statsMap.get(challengeId)?.totalAttempts || 0,
        successfulAttempts: statsMap.get(challengeId)?.successfulAttempts || 0
      };
    });

    res.json({
      success: true,
      data: {
        challenges: enrichedChallenges,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách bài tập cho admin (tất cả bài tập, kể cả inactive)
export const getAdminChallenges = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể xem tất cả bài tập'
      });
    }

    const {
      page = 1,
      limit = 50,
      language,
      difficulty,
      category,
      search,
      isActive
    } = req.query;

    const filter: any = {};
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (language) filter.language = language;
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    console.log('📊 Fetching challenges with filter:', filter);
    console.log('   Page:', page);
    console.log('   Limit:', limit);

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })

    const total = await Challenge.countDocuments(filter);

    res.json({
      success: true,
      data: {
        challenges,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết bài tập
export const getChallengeById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    
    const challenge = await Challenge.findById(id)
      .populate('createdBy', 'username email');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    // Convert request và check quyền admin
    const authReq = req as AuthenticatedRequest;
    const isAdmin = authReq.user?.role === 'admin' || 
                   challenge.createdBy.toString() === authReq.user?.id;

    // Kiểm tra active status chỉ khi không phải admin
    if (!challenge.isActive && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Bài tập không khả dụng'
      });
    }

    // Ẩn test cases và correct code cho user thường

    const challengeData = challenge.toObject();
    if (!isAdmin) {
      challengeData.correctCode = undefined;
      challengeData.testCases = challengeData.testCases.map((tc: any) => ({
        ...tc,
        expectedOutput: tc.isHidden ? '***' : tc.expectedOutput
      }));
    }

    res.json({
      success: true,
      data: challengeData
    });
  } catch (error) {
    next(error);
  }
};

// Tạo bài tập mới (admin only)
export const createChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const challengeData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const challenge = new Challenge(challengeData);
    await challenge.save();

    await challenge.populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Tạo bài tập thành công',
      data: challenge
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật bài tập (admin only)
export const updateChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    // Kiểm tra quyền chỉnh sửa
    const isAdmin = req.user?.role === 'admin';
    const isCreator = challenge.createdBy.toString() === req.user?.id;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa bài tập này'
      });
    }

    const updatedChallenge = await Challenge.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    res.json({
      success: true,
      message: 'Cập nhật bài tập thành công',
      data: updatedChallenge
    });
  } catch (error) {
    next(error);
  }
};

// Xóa bài tập (admin only)
export const deleteChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    // Chỉ admin mới có thể xóa
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể xóa bài tập'
      });
    }

    await Challenge.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Xóa bài tập thành công'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle trạng thái active/inactive của bài tập (admin only)
export const toggleChallengeStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể thay đổi trạng thái bài tập'
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    challenge.isActive = !challenge.isActive;
    await challenge.save();

    res.json({
      success: true,
      message: `Bài tập đã được ${challenge.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: { isActive: challenge.isActive }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê bài tập (admin only)
export const getChallengeStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể xem thống kê'
      });
    }

    const stats = await Challenge.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              isActive: '$isActive'
            }
          },
          byLanguage: {
            $push: {
              language: '$language',
              isActive: '$isActive'
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              isActive: '$isActive'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      byDifficulty: [],
      byLanguage: [],
      byCategory: []
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách lời giải với trạng thái unlock
export const getSolutionsStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Map solutions với trạng thái unlock
    const solutionsStatus = challenge.solutions.map((solution, index) => {
      const isUnlocked = user.unlockedSolutions.some(
        (u: any) => u.challengeId.equals(id) && u.solutionIndex === index
      );

      return {
        index,
        title: solution.title,
        tokenCost: solution.tokenCost,
        language: solution.language,
        isUnlocked,
        order: solution.order
      };
    });

    // Sắp xếp theo order
    solutionsStatus.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        solutions: solutionsStatus,
        userTokens: user.tokens || 0,
        totalSolutions: solutionsStatus.length,
        unlockedCount: solutionsStatus.filter(s => s.isUnlocked).length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mở khóa lời giải bằng token
export const unlockSolution = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id, solutionIndex } = req.params;
    const userId = req.user?.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    const index = Number(solutionIndex);
    if (index < 0 || index >= challenge.solutions.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lời giải'
      });
    }

    const solution = challenge.solutions[index];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra đã unlock chưa
    const alreadyUnlocked = user.unlockedSolutions.some(
      (u: any) => u.challengeId.equals(id) && u.solutionIndex === index
    );

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã mở khóa lời giải này rồi'
      });
    }

    // Kiểm tra token
    const currentTokens = user.tokens || 0;
    if (currentTokens < solution.tokenCost) {
      return res.status(400).json({
        success: false,
        message: `Không đủ token. Cần ${solution.tokenCost} token, bạn có ${currentTokens} token`
      });
    }

    // Trừ token và unlock
    user.tokens = currentTokens - solution.tokenCost;
    user.unlockedSolutions.push({
      challengeId: id,
      solutionIndex: index,
      unlockedAt: new Date()
    } as any);

    await user.save();

    console.log(`🔓 User ${userId} đã mở khóa lời giải ${index} của bài ${id} với ${solution.tokenCost} token`);

    res.json({
      success: true,
      message: 'Đã mở khóa lời giải thành công',
      data: {
        solution,
        remainingTokens: user.tokens,
        tokensSpent: solution.tokenCost
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết lời giải đã unlock
export const getSolution = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id, solutionIndex } = req.params;
    const userId = req.user?.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    const index = Number(solutionIndex);
    if (index < 0 || index >= challenge.solutions.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lời giải'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra quyền truy cập
    const isUnlocked = user.unlockedSolutions.some(
      (u: any) => u.challengeId.equals(id) && u.solutionIndex === index
    );

    const isAdmin = req.user?.role === 'admin';

    if (!isUnlocked && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa mở khóa lời giải này'
      });
    }

    const solution = challenge.solutions[index];

    res.json({
      success: true,
      data: solution
    });
  } catch (error) {
    next(error);
  }
};
