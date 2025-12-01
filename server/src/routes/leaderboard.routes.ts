import { Router } from 'express';
import { getTopLearners, getPracticeLeaderboard } from '../controllers/leaderboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/leaderboard/top?limit=5
router.get('/top', getTopLearners);

// GET /api/leaderboard/practice?limit=50 - Xếp hạng bài đơn chi tiết
router.get('/practice', getPracticeLeaderboard);

export default router;
