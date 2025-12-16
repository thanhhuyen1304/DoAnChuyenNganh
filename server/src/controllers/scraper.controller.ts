import { Request, Response, NextFunction } from 'express';
import { RealProblemScraper } from '../services/realProblemScraper';
import Challenge from '../models/challenge.model';
import { Notification } from '../models/notification.model';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Scrape problems từ CSES
export const scrapeCSES = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể scrape problems'
      });
    }

    // Lấy classification settings từ request body (nếu có)
    const classificationSettings = req.body.classification || {
      language: 'C++',
      difficulty: 'Medium',
      category: 'Logic',
      points: 20
    };

    // Random offset để tránh luôn lấy 10 bài đầu (giống AtCoder sinh bài mới)
    const offset = Number(req.body?.offset ?? Math.floor(Math.random() * 50));
    const problems = await RealProblemScraper.scrapeCSES(classificationSettings.language, offset);

    // Nếu không scrape được bài nào thì trả lỗi rõ ràng thay vì giả vờ thành công
    if (!problems || problems.length === 0) {
      return res.status(502).json({
        success: false,
        message: 'Không thể lấy bài tập từ CSES (có thể do lỗi mạng hoặc cấu trúc trang web thay đổi). Vui lòng kiểm tra lại kết nối và log của server.'
      });
    }

    const beforeCount = await Challenge.countDocuments({});
    const savedCount = await RealProblemScraper.saveProblemsToDB(problems, req.user.id, classificationSettings, 10);
    const afterCount = await Challenge.countDocuments({});
    const newCount = Math.max(0, afterCount - beforeCount);

    // Tạo notification trên header khi có bài tập mới
    if (newCount > 0 && req.user?.id) {
      await Notification.create({
        user_id: req.user.id,
        title: 'Đã thêm bài tập mới từ CSES',
        message: `Đã thêm ${newCount} bài tập mới từ CSES Problem Set.`,
        type: 'success',
        read: false,
      });
    }

    // Lấy tổng số bài tập hiện tại trong database
    const totalChallenges = afterCount;
    
    res.json({
      success: true,
      message: `Đã scrape và lưu ${savedCount} problems từ CSES`,
      data: { 
        count: savedCount,
        savedCount,
        newCount,
        total: totalChallenges,
        details: {
          source: 'CSES',
          newProblems: newCount,
          totalScraped: problems.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Scrape problems từ AtCoder
export const scrapeAtCoder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể scrape problems'
      });
    }

    // Lấy classification settings từ request body (nếu có)
    const classificationSettings = req.body.classification || {
      language: 'C++',
      difficulty: 'Medium',
      category: 'Logic',
      points: 20
    };

    const problems = await RealProblemScraper.scrapeAtCoder(classificationSettings.language);
    const beforeCount = await Challenge.countDocuments({});
    const savedCount = await RealProblemScraper.saveProblemsToDB(problems, req.user.id, classificationSettings);
    const afterCount = await Challenge.countDocuments({});
    const newCount = Math.max(0, afterCount - beforeCount);
    const totalChallenges = afterCount;

    if (newCount > 0 && req.user?.id) {
      await Notification.create({
        user_id: req.user.id,
        title: 'Đã thêm bài tập mới từ AtCoder',
        message: `Đã thêm ${newCount} bài tập mới từ AtCoder.`,
        type: 'success',
        read: false,
      });
    }

    res.json({
      success: true,
      message: `Đã scrape và lưu ${savedCount} problems từ AtCoder`,
      data: { 
        count: savedCount, 
        savedCount,
        newCount,
        total: totalChallenges 
      }
    });
  } catch (error) {
    next(error);
  }
};

// Scrape problems từ LeetCode
export const scrapeLeetCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể scrape problems'
      });
    }

    // Lấy classification settings từ request body (nếu có)
    const classificationSettings = req.body.classification || {
      language: 'JavaScript',
      difficulty: 'Medium',
      category: 'Logic',
      points: 20
    };

    // Random skip để lấy trang khác, tránh trùng (mặc định 0)
    const skip = Number(req.body?.skip ?? Math.floor(Math.random() * 200));
    const problems = await RealProblemScraper.scrapeLeetCode(skip, classificationSettings.language);
    const beforeCount = await Challenge.countDocuments({});
    const savedCount = await RealProblemScraper.saveProblemsToDB(problems, req.user.id, classificationSettings);
    const afterCount = await Challenge.countDocuments({});
    const newCount = Math.max(0, afterCount - beforeCount);
    const totalChallenges = afterCount;

    if (newCount > 0 && req.user?.id) {
      await Notification.create({
        user_id: req.user.id,
        title: 'Đã thêm bài tập mới từ LeetCode',
        message: `Đã thêm ${newCount} bài tập mới từ LeetCode.`,
        type: 'success',
        read: false,
      });
    }

    res.json({
      success: true,
      message: `Đã scrape và lưu ${savedCount} problems từ LeetCode`,
      data: { 
        count: savedCount, 
        savedCount,
        newCount,
        total: totalChallenges 
      }
    });
  } catch (error) {
    next(error);
  }
};

// Scrape từ tất cả nguồn
export const scrapeAllSources = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể scrape problems'
      });
    }

    // Lấy classification settings từ request body (nếu có)
    const classificationSettings = req.body.classification || {
      language: 'JavaScript',
      difficulty: 'Medium',
      category: 'Logic',
      points: 20
    };

    const requestedLang = classificationSettings.language;
    const offset = Number(req.body?.offset ?? Math.floor(Math.random() * 50));
    const skip = Number(req.body?.skip ?? Math.floor(Math.random() * 200));
    const [csesProblems, atcoderProblems, leetcodeProblems] = await Promise.all([
      RealProblemScraper.scrapeCSES(requestedLang, offset),
      RealProblemScraper.scrapeAtCoder(requestedLang),
      RealProblemScraper.scrapeLeetCode(skip, requestedLang)
    ]);

    const allProblems = [...csesProblems, ...atcoderProblems, ...leetcodeProblems];

    if (!allProblems || allProblems.length === 0) {
      return res.status(502).json({
        success: false,
        message: 'Không thể lấy bài tập từ các nguồn (CSES / AtCoder / LeetCode). Vui lòng kiểm tra lại kết nối mạng hoặc log lỗi trên server.'
      });
    }

    const beforeCount = await Challenge.countDocuments({});
    const savedCount = await RealProblemScraper.saveProblemsToDB(allProblems, req.user.id, classificationSettings);
    const afterCount = await Challenge.countDocuments({});
    const newCount = Math.max(0, afterCount - beforeCount);
    const totalChallenges = afterCount;

    if (newCount > 0 && req.user?.id) {
      await Notification.create({
        user_id: req.user.id,
        title: 'Đã thêm bài tập mới từ tất cả nguồn',
        message: `Đã thêm ${newCount} bài tập mới từ CSES, AtCoder và LeetCode.`,
        type: 'success',
        read: false,
      });
    }

    res.json({
      success: true,
      message: `Đã scrape và lưu ${savedCount} problems từ tất cả nguồn`,
      data: { 
        savedCount,
        newCount,
        total: totalChallenges,
        cses: csesProblems.length,
        atcoder: atcoderProblems.length,
        leetcode: leetcodeProblems.length
      }
    });
  } catch (error) {
    next(error);
  }
};
