import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendationService';
import { IUser } from '../models/user.model';

interface AuthenticatedRequest extends Request {
  user?: IUser & { id: string; email: string; role?: string };
}

export class RecommendationController {
  async getRelated(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Bạn cần đăng nhập để sử dụng tính năng này',
        });
      }

      const { challengeId, limitChallenges, limitTraining, limitResources } = req.query;

      const data = await recommendationService.getRelatedRecommendations({
        userId: req.user.id,
        challengeId: challengeId as string | undefined,
        limitChallenges: limitChallenges ? Number(limitChallenges) : undefined,
        limitTraining: limitTraining ? Number(limitTraining) : undefined,
        limitResources: limitResources ? Number(limitResources) : undefined,
      });

      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Get related recommendations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy gợi ý liên quan',
        error: error.message,
      });
    }
  }
}
