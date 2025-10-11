import { Request, Response, NextFunction } from 'express';
import { ProblemScraper } from '../services/problemScraper';

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

    const problems = await ProblemScraper.scrapeCSES();
    await ProblemScraper.saveProblemsToDB(problems, req.user.id);

    res.json({
      success: true,
      message: `Đã scrape và lưu ${problems.length} problems từ CSES`,
      data: { count: problems.length }
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

    const problems = await ProblemScraper.scrapeAtCoder();
    await ProblemScraper.saveProblemsToDB(problems, req.user.id);

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

    const problems = await ProblemScraper.scrapeLeetCode();
    await ProblemScraper.saveProblemsToDB(problems, req.user.id);

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

    const [csesProblems, atcoderProblems, leetcodeProblems] = await Promise.all([
      ProblemScraper.scrapeCSES(),
      ProblemScraper.scrapeAtCoder(),
      ProblemScraper.scrapeLeetCode()
    ]);

    const allProblems = [...csesProblems, ...atcoderProblems, ...leetcodeProblems];
    await ProblemScraper.saveProblemsToDB(allProblems, req.user.id);

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
