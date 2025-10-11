import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { 
  scrapeCSES, 
  scrapeAtCoder, 
  scrapeLeetCode, 
  scrapeAllSources 
} from '../controllers/scraper.controller';

const router = Router();

// Tất cả routes đều cần authentication và admin role
router.use(authenticateToken);
router.use(isAdmin);

// Scrape từ các nguồn khác nhau
router.post('/cses', scrapeCSES);
router.post('/atcoder', scrapeAtCoder);
router.post('/leetcode', scrapeLeetCode);
router.post('/all', scrapeAllSources);

export default router;
