import express from 'express';
import { TrainingDataController } from '../controllers/trainingData.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();
const trainingDataController = new TrainingDataController();

// Tất cả routes đều yêu cầu authentication
router.use(authenticateToken);

// Public routes (authenticated users can view)
router.get('/', (req, res) => trainingDataController.getAllTrainingData(req, res));
router.get('/categories', (req, res) => trainingDataController.getCategories(req, res));
router.get('/export', (req, res) => trainingDataController.exportTrainingData(req, res));
router.get('/status', (req, res) => trainingDataController.getTrainingStatus(req, res));
router.get('/:id', (req, res) => trainingDataController.getTrainingDataById(req, res));

// Admin only routes
router.post('/', isAdmin, (req, res) => trainingDataController.createTrainingData(req, res));
router.put('/:id', isAdmin, (req, res) => trainingDataController.updateTrainingData(req, res));
router.delete('/:id', isAdmin, (req, res) => trainingDataController.deleteTrainingData(req, res));
router.post('/bulk-import', isAdmin, (req, res) => trainingDataController.bulkImport(req, res));
router.post('/extract-from-chat', isAdmin, (req, res) => trainingDataController.extractFromChatHistory(req, res));
router.post('/sync', isAdmin, (req, res) => trainingDataController.syncToFiles(req, res));

export default router;

