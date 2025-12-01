import { Router } from 'express';
import { importChallenges, exportChallenges } from '../controllers/import-export.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(isAdmin);

// POST /api/import-export/challenges
router.post('/challenges', importChallenges);

// GET /api/import-export/challenges
router.get('/challenges', exportChallenges);

export default router;