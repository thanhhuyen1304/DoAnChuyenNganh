import { Request, Response } from 'express';
import aiChatService from '../services/aiChatService';
import ChatMessage from '../models/chatMessage.model';

class AIChatController {
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?._id || req.user?.id;
      const { message } = req.body;

      // Validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Tin nhắn không được để trống' }
        });
      }

      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          error: { message: 'Tin nhắn quá dài (tối đa 500 ký tự)' }
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Chưa đăng nhập' }
        });
      }

      // Process message
      const result = await aiChatService.sendMessage(userId.toString(), message.trim());

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: { message: result.message }
        });
      }

      return res.json({
        success: true,
        data: {
          message: result.message,
          hasContext: result.hasContext,
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      console.error('[AIChatController] Error in sendMessage:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Đã xảy ra lỗi khi xử lý tin nhắn' }
      });
    }
  }

  async getChatHistory(req: Request, res: Response) {
    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Chưa đăng nhập' }
        });
      }

      const limit = parseInt(req.query.limit as string) || 50;

      // Use ChatMessage model's static method
      const ChatMessageModel = ChatMessage as any;
      const messages = await ChatMessageModel.getRecentHistory(userId.toString(), Math.min(limit, 100));

      return res.json({
        success: true,
        data: {
          messages: messages.reverse(),
          count: messages.length
        }
      });
    } catch (error: any) {
      console.error('[AIChatController] Error in getChatHistory:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Không thể lấy lịch sử chat' }
      });
    }
  }

  async clearHistory(req: Request, res: Response) {
    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Chưa đăng nhập' }
        });
      }

      const result = await aiChatService.clearHistory(userId.toString());

      return res.json(result);
    } catch (error: any) {
      console.error('[AIChatController] Error in clearHistory:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Không thể xóa lịch sử' }
      });
    }
  }
}

export default new AIChatController();

