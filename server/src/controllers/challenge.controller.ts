import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Challenge, { IChallenge } from '../models/challenge.model';
import User from '../models/user.model';

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
      isActive = true
    } = req.query;

    const filter: any = { isActive };
    
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

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'username email')
      .select('-buggyCode -correctCode -testCases')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

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

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

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

    if (!challenge.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Bài tập không khả dụng'
      });
    }

    // Ẩn test cases và correct code cho user thường
    const authReq = req as AuthenticatedRequest;
    const isAdmin = authReq.user?.role === 'admin' || 
                   challenge.createdBy.toString() === authReq.user?.id;

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
