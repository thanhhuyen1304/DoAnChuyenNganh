import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const feedbackController = new FeedbackController();

// User routes
router.post('/', authenticateToken, feedbackController.createFeedback.bind(feedbackController));
router.get('/me', authenticateToken, feedbackController.getMyFeedback.bind(feedbackController));

// Admin routes
router.get('/', authenticateToken, isAdmin, feedbackController.getAllFeedback.bind(feedbackController));
router.get('/stats', authenticateToken, isAdmin, feedbackController.getFeedbackStats.bind(feedbackController));
router.patch('/:id/status', authenticateToken, isAdmin, feedbackController.updateFeedbackStatus.bind(feedbackController));
router.delete('/:id', authenticateToken, feedbackController.deleteFeedback.bind(feedbackController));

export default router;

