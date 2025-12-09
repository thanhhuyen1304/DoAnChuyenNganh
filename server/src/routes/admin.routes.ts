import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AdminStatsController } from '../controllers/admin.stats.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();
const statsController = new AdminStatsController();

// Tất cả routes đều yêu cầu admin
router.use(authenticateToken);
router.use(isAdmin);

// System statistics
router.get('/stats', statsController.getSystemStats.bind(statsController));

// User management
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/stats', adminController.getUserStats.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.patch('/users/:id/ban', adminController.banUser.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

export default router;

