import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const reportController = new ReportController();

// User routes
router.post('/', authenticateToken, reportController.createReport.bind(reportController));

// Admin routes
router.get('/', authenticateToken, isAdmin, reportController.getAllReports.bind(reportController));
router.get('/stats', authenticateToken, isAdmin, reportController.getReportStats.bind(reportController));
router.get('/:id', authenticateToken, isAdmin, reportController.getReportById.bind(reportController));
router.patch('/:id/status', authenticateToken, isAdmin, reportController.updateReportStatus.bind(reportController));
router.delete('/:id', authenticateToken, isAdmin, reportController.deleteReport.bind(reportController));

export default router;

