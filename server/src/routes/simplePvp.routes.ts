import express from 'express';
import { body, param } from 'express-validator';
import simplePvpController from '../controllers/simplePvpNew.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Validation rules
const createRoomValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be between 1 and 50 characters'),
  body('settings.timeLimit')
    .isInt({ min: 5, max: 60 })
    .withMessage('Time limit must be between 5 and 60 minutes'),
  body('settings.difficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  body('settings.maxParticipants')
    .optional()
    .isInt({ min: 2, max: 8 })
    .withMessage('Max participants must be between 2 and 8')
];

const submitCodeValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code is required'),
  body('language')
    .isIn(['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'])
    .withMessage('Invalid programming language')
];

const readyStatusValidation = [
  body('isReady')
    .isBoolean()
    .withMessage('isReady must be a boolean')
];

// Room Management Routes (all require authentication)
router.post('/rooms', authenticateToken, createRoomValidation, (req: any, res: any, next: any) => {
  console.log('Route middleware - Request body:', req.body);
  console.log('Route middleware - Validation errors:', req.validationErrors);
  next();
}, simplePvpController.createRoom);
router.get('/rooms', authenticateToken, simplePvpController.getRooms);
router.post('/rooms/:roomCode/join', authenticateToken, simplePvpController.joinRoom);
router.post('/rooms/:roomId/join', authenticateToken, simplePvpController.joinRoom); // Join by room ID
router.post('/rooms/:roomId/leave', authenticateToken, simplePvpController.leaveRoom);
router.delete('/rooms/:roomId', authenticateToken, simplePvpController.deleteRoom);
router.post('/rooms/:roomId/start', authenticateToken, simplePvpController.startMatch);
router.post('/rooms/:roomId/ready', authenticateToken, readyStatusValidation, simplePvpController.setReadyStatus);

// Match Routes (all require authentication)
router.post('/matches/:matchId/submit', authenticateToken, submitCodeValidation, simplePvpController.submitCode);
router.get('/matches/:matchId/status', authenticateToken, simplePvpController.getMatchStatus);
router.post('/matches/:matchId/finish', authenticateToken, simplePvpController.finishMatch);
router.post('/matches/:matchId/forfeit', authenticateToken, simplePvpController.forfeitMatch);

// Leaderboard and Stats Routes (leaderboard is public, stats require auth)
router.get('/leaderboard', optionalAuth, simplePvpController.getLeaderboard);
router.get('/stats/me', authenticateToken, simplePvpController.getUserStats);

// All other routes require authentication
router.use(authenticateToken);

export default router;
