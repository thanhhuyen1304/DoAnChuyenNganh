import express from 'express';
import { authenticate } from '../middleware/auth';
import commentController from '../controllers/comment.controller';

const router = express.Router();

// Public routes
router.get('/challenge/:challengeId', commentController.getCommentsByChallenge);

// Protected routes (require authentication)
router.post('/', authenticate, commentController.createComment);
router.post('/:commentId/like', authenticate, commentController.likeComment);
router.post('/:commentId/dislike', authenticate, commentController.dislikeComment);
router.post('/:commentId/report', authenticate, commentController.reportComment);
router.patch('/:commentId', authenticate, commentController.updateComment);
router.delete('/:commentId', authenticate, commentController.deleteComment);

export default router;
