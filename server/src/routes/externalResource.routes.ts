import express from 'express';
import rateLimit from 'express-rate-limit';
import { ExternalResourceController } from '../controllers/externalResource.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const controller = new ExternalResourceController();

const suggestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

router.get('/suggest', suggestLimiter, (req, res) => controller.suggest(req as any, res));
router.post('/feedback', (req, res) => controller.feedback(req as any, res));

export default router;


