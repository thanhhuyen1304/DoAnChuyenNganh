import express from 'express';
import friendController from '../controllers/friend.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Friend request routes
router.post('/requests', friendController.sendFriendRequest);
router.post('/requests/:requestId/accept', friendController.acceptFriendRequest);
router.post('/requests/:requestId/decline', friendController.declineFriendRequest);
router.get('/requests/pending', friendController.getPendingRequests);

// Friend management routes
router.get('/list', friendController.getFriendsList);
router.delete('/:friendId', friendController.removeFriend);

// Online users
router.get('/online', friendController.getOnlineUsers);

export default router;