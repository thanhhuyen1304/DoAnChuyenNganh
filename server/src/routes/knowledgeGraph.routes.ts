import express from 'express';
import { KnowledgeGraphController } from '../controllers/knowledgeGraph.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const knowledgeGraphController = new KnowledgeGraphController();

// Tất cả routes đều yêu cầu authentication
router.use(authenticateToken);

router.get('/', (req, res) => knowledgeGraphController.getGraph(req, res));
router.get('/stats', (req, res) => knowledgeGraphController.getGraphStats(req, res));
router.get('/personalized', (req, res) => knowledgeGraphController.getPersonalizedGraph(req as any, res));
router.get('/error-based', (req, res) => knowledgeGraphController.getErrorBasedGraph(req as any, res));
router.post('/find-training-for-errors', (req, res) => knowledgeGraphController.findTrainingDataForErrors(req as any, res));

export default router;
