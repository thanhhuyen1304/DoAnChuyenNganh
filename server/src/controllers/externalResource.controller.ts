import { Request, Response } from 'express';
import { externalKnowledgeService } from '../services/externalKnowledgeService';
import ResourceFeedback, { ResourceRating } from '../models/resourceFeedback.model';
import { IUser } from '../models/user.model';

interface AuthenticatedRequest extends Request {
  user?: IUser & { id: string };
}

export class ExternalResourceController {
  async suggest(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        q,
        context,
        language,
        difficulty,
        types,
        duration,
        limit,
      } = req.query;

      const parsedTypes = typeof types === 'string'
        ? (types.split(',').filter(Boolean) as any)
        : undefined;

      const resources = await externalKnowledgeService.suggest({
        query: (q as string) || '',
        context: (context as string) || '',
        language: (language as string) || undefined,
        difficulty: (difficulty as string) || undefined,
        types: parsedTypes,
        duration: (duration as any) || undefined,
        limit: limit ? Number(limit) : undefined,
      });

      const warnings: string[] = [];
      if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
        warnings.push('Google Custom Search API chưa được cấu hình');
      }
      if (!process.env.YOUTUBE_API_KEY) {
        warnings.push('YouTube Data API chưa được cấu hình');
      }

      return res.json({
        success: true,
        data: resources,
        warnings,
      });
    } catch (error: any) {
      console.error('[ExternalResourceController] suggest error', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách tài nguyên ngoài',
        error: error.message,
      });
    }
  }

  async feedback(req: AuthenticatedRequest, res: Response) {
    try {
      const { url, title, rating, comment, source, language } = req.body;

      if (!url || !rating) {
        return res.status(400).json({
          success: false,
          message: 'url và rating là bắt buộc',
        });
      }

      const feedback = await ResourceFeedback.create({
        url,
        title,
        rating: rating as ResourceRating,
        comment,
        source,
        language,
        userId: req.user?.id,
      });

      return res.json({
        success: true,
        data: feedback,
      });
    } catch (error: any) {
      console.error('[ExternalResourceController] feedback error', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể lưu phản hồi',
        error: error.message,
      });
    }
  }
}


