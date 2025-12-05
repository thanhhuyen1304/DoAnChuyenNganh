import express from 'express';
import aiChatController from '../controllers/aiChatController';
import { authenticateToken } from '../middleware/auth';
import { chatRateLimit } from '../middleware/rateLimit';

const router = express.Router();

// Rate limiting: 20 messages/minute
const chatRateLimiter = chatRateLimit; // Sử dụng rate limiter hiện có

// Routes
router.post('/message', authenticateToken, chatRateLimiter, (req, res) => aiChatController.sendMessage(req, res));
router.get('/history', authenticateToken, (req, res) => aiChatController.getChatHistory(req, res));
router.delete('/history', authenticateToken, (req, res) => aiChatController.clearHistory(req, res));

export default router;

