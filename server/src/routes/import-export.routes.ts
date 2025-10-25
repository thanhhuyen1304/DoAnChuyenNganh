import { Router } from 'express';
import controller from '../controllers/import-export.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/import', authenticateToken, controller.importChallenges);
router.get('/export', authenticateToken, controller.exportChallenges);

export default router;