import { Request, Response, NextFunction } from 'express';
import { RealProblemScraper } from '../services/realProblemScraper';
import Challenge from '../models/challenge.model';

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

    // Pass requested language to scraper
    let problems = await RealProblemScraper.scrapeCSES(classificationSettings.language);
    const savedCount = await RealProblemScraper.saveProblemsToDB(problems, req.user.id, classificationSettings, 10);

    // Lấy tổng số bài tập hiện tại trong database
    const totalChallenges = await Challenge.countDocuments({});
    
    res.json({
      success: true,
      message: `Đã scrape và lưu ${savedCount} problems từ CSES`,
      data: { 
        count: savedCount,
        total: totalChallenges,
        details: {
          source: 'CSES',
          newProblems: savedCount,
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
    await RealProblemScraper.saveProblemsToDB(problems, req.user.id, classificationSettings);

    res.json({
      success: true,
      message: `Đã scrape và lưu ${problems.length} problems từ AtCoder`,
      data: { count: problems.length }
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

    const problems = await RealProblemScraper.scrapeLeetCode(0, classificationSettings.language);
    await RealProblemScraper.saveProblemsToDB(problems, req.user.id, classificationSettings);

    res.json({
      success: true,
      message: `Đã scrape và lưu ${problems.length} problems từ LeetCode`,
      data: { count: problems.length }
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
    const [csesProblems, atcoderProblems, leetcodeProblems] = await Promise.all([
      RealProblemScraper.scrapeCSES(requestedLang),
      RealProblemScraper.scrapeAtCoder(requestedLang),
      RealProblemScraper.scrapeLeetCode(0, requestedLang)
    ]);

    const allProblems = [...csesProblems, ...atcoderProblems, ...leetcodeProblems];
    await RealProblemScraper.saveProblemsToDB(allProblems, req.user.id, classificationSettings);

    res.json({
      success: true,
      message: `Đã scrape và lưu ${allProblems.length} problems từ tất cả nguồn`,
      data: { 
        total: allProblems.length,
        cses: csesProblems.length,
        atcoder: atcoderProblems.length,
        leetcode: leetcodeProblems.length
      }
    });
  } catch (error) {
    next(error);
  }
};
