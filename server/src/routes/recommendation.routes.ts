import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { RecommendationController } from '../controllers/recommendation.controller';

const router = express.Router();
const recommendationController = new RecommendationController();

router.use(authenticateToken);

router.get('/related', (req, res) => recommendationController.getRelated(req as any, res));

export default router;
