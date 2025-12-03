import express from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth';
import { chatRateLimit } from '../middleware/rateLimit';

const router = express.Router();
const chatController = new ChatController();

// Tất cả routes đều yêu cầu authentication
router.post('/message', authenticateToken, chatRateLimit, (req, res) => chatController.sendMessage(req, res));
router.post('/rate', authenticateToken, (req, res) => chatController.rateMessage(req, res));
router.get('/history/:chatId', authenticateToken, (req, res) => chatController.getChatHistory(req, res));
router.get('/histories', authenticateToken, (req, res) => chatController.getAllChatHistories(req, res));
router.delete('/history/:chatId', authenticateToken, (req, res) => chatController.deleteChatHistory(req, res));

export default router;

