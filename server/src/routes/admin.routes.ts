import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// Tất cả routes đều yêu cầu admin
router.use(authenticateToken);
router.use(isAdmin);

// User management
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/stats', adminController.getUserStats.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.patch('/users/:id/ban', adminController.banUser.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

export default router;

