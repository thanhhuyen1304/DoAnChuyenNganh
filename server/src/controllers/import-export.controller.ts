import { Request, Response, NextFunction } from 'express';
import Challenge from '../models/challenge.model';
import { IUser } from '../models/user.model';

interface AuthenticatedRequest extends Request {
  user?: IUser & { id: string; email: string; role?: string };
}

export async function importChallenges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể import bài tập'
      });
      return;
    }

    const { challenges } = req.body;
    
    if (!Array.isArray(challenges)) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
      return;
    }

    const importedChallenges = [];
    const errors = [];

    for (const challenge of challenges) {
      try {
        const existingChallenge = await Challenge.findOne({ title: challenge.title });
        if (existingChallenge) {
          errors.push(`Bài "${challenge.title}" đã tồn tại`);
          continue;
        }

        challenge.createdBy = req.user.id;
        
        const newChallenge = new Challenge(challenge);
        await newChallenge.save();
        importedChallenges.push(newChallenge);
      } catch (error) {
        errors.push(`Lỗi import bài "${challenge.title}": ${(error as Error).message}`);
      }
    }

    res.json({
      success: true,
      message: `Đã import ${importedChallenges.length} bài tập`,
      data: {
        imported: importedChallenges.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function exportChallenges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể export bài tập'
      });
      return;
    }

    const challenges = await Challenge.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    next(error);
  }
}

export default {
  importChallenges,
  exportChallenges
};