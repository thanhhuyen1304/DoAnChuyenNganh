import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import adminCommentController from '../controllers/adminComment.controller';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Get reported comments
router.get('/reported', adminCommentController.getReportedComments);

// Get all comments (can filter by challenge)
router.get('/', adminCommentController.getAllComments);

// Get comment stats
router.get('/stats', adminCommentController.getCommentStats);

// Hide/Unhide comment
router.patch('/:commentId/hide', adminCommentController.toggleHideComment);

// Delete comment
router.delete('/:commentId', adminCommentController.adminDeleteComment);

export default router;
