import { Router } from 'express';
import { SystemSettingsController } from '../controllers/systemSettings.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const systemSettingsController = new SystemSettingsController();

// Public routes (chỉ lấy public settings)
router.get('/', systemSettingsController.getAllSettings.bind(systemSettingsController));
router.get('/:key', systemSettingsController.getSettingByKey.bind(systemSettingsController));

// Admin routes
router.post('/', authenticateToken, isAdmin, systemSettingsController.upsertSetting.bind(systemSettingsController));
router.put('/:key', authenticateToken, isAdmin, systemSettingsController.upsertSetting.bind(systemSettingsController));
router.delete('/:key', authenticateToken, isAdmin, systemSettingsController.deleteSetting.bind(systemSettingsController));
router.post('/initialize', authenticateToken, isAdmin, systemSettingsController.initializeDefaultSettings.bind(systemSettingsController));

export default router;

