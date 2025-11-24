import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const achievementController = new AchievementController();

// Public routes
router.get('/', achievementController.getAllAchievements.bind(achievementController));
router.get('/:id', achievementController.getAchievementById.bind(achievementController));
router.get('/user/:userId', authenticateToken, achievementController.getUserAchievements.bind(achievementController));
router.get('/me/achievements', authenticateToken, achievementController.getUserAchievements.bind(achievementController));

// Admin routes
router.post('/', authenticateToken, isAdmin, achievementController.createAchievement.bind(achievementController));
router.patch('/:id', authenticateToken, isAdmin, achievementController.updateAchievement.bind(achievementController));
router.delete('/:id', authenticateToken, isAdmin, achievementController.deleteAchievement.bind(achievementController));
router.post('/award', authenticateToken, isAdmin, achievementController.awardAchievement.bind(achievementController));

export default router;

