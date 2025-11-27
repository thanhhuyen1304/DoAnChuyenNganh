import { Router } from 'express';
import { getTopLearners } from '../controllers/leaderboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/leaderboard/top?limit=5
router.get('/top', getTopLearners);

export default router;
