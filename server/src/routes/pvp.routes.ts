import { Router } from 'express';
import { PvPController } from '../controllers/pvp.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const pvpController = new PvPController();

// Middleware để xác thực tất cả routes
router.use(authenticate);

// Room Management
router.get('/rooms', pvpController.getRooms);
router.post('/rooms', pvpController.createRoom);
router.post('/rooms/:roomId/join', pvpController.joinRoom);
router.post('/rooms/:roomId/leave', pvpController.leaveRoom);

// Matchmaking
router.post('/matchmaking/start', pvpController.startMatchmaking);
router.post('/matchmaking/cancel', pvpController.cancelMatchmaking);
router.post('/matches/:matchId/accept', pvpController.acceptMatch);
router.post('/matches/:matchId/reject', pvpController.rejectMatch);

// Online Users
router.get('/online-users', pvpController.getOnlineUsers);

// Friend System
router.post('/friends/request', pvpController.sendFriendRequest);
router.get('/friends/requests', pvpController.getFriendRequests);
router.post('/friends/requests/:requestId/accept', pvpController.acceptFriendRequest);
router.post('/friends/requests/:requestId/reject', pvpController.rejectFriendRequest);
router.get('/friends', pvpController.getFriends);
router.delete('/friends/:friendId', pvpController.removeFriend);

// Match History
router.get('/matches/history', pvpController.getMatchHistory);

// Leaderboard
router.get('/leaderboard', pvpController.getLeaderboard);

// User Stats
router.get('/stats', pvpController.getUserStats);

// Challenge System
router.post('/challenge/:toUserId', pvpController.challengeUser);
router.get('/challenges', pvpController.getChallenges);
router.post('/challenges/:challengeId/respond', pvpController.respondToChallenge);

export default router;