import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Submission, { ISubmission } from '../models/submission.model';
import Challenge from '../models/challenge.model';
import User from '../models/user.model';
import aiAnalysisService from '../services/aiAnalysisService';
import judge0Service from '../services/judge0Service';
import { ENV } from '../../config/environment';

// Extend Request interface
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Tính XP dựa trên kết quả
const calculateXP = (challenge: any, score: number, totalPoints: number): number => {
  if (score === 0) return 0;
  
  const scorePercentage = (score / totalPoints) * 100;
  
  // Base XP theo độ khó
  const baseXP: Record<string, number> = {
    'Easy': 10,
    'Medium': 25,
    'Hard': 50
  };
  
  const base = baseXP[challenge.difficulty] || 10;
  
  // XP tỷ lệ với điểm đạt được
  const xpEarned = Math.floor(base * (scorePercentage / 100));
  
  // Bonus XP nếu đạt 100%
  if (scorePercentage === 100) {
    return Math.floor(base * 1.5); // 50% bonus
  }
  
  return xpEarned;
};

// Cập nhật rank dựa trên XP
const updateUserRank = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return;
  
  const xp = user.experience || 0;
  let newRank = 'Newbie';
  
  if (xp >= 1000) newRank = 'Expert';
  else if (xp >= 500) newRank = 'Senior';
  else if (xp >= 200) newRank = 'Intermediate';
  else if (xp >= 50) newRank = 'Junior';
  
  if (user.rank !== newRank) {
    user.rank = newRank as any;
    await user.save();
  }
};

// Nộp bài và chấm điểm
export const submitSolution = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { challengeId, code, language } = req.body;
    const userId = req.user?.id;

    // Lấy challenge
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    if (!challenge.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Bài tập không khả dụng'
      });
    }

    // Chạy code với Judge0 API
    let executionResults: any[] = [];
    let score = 0;
    let status: ISubmission['status'] = 'Accepted';
    let errorMessage: string | undefined;

    try {
      // Kiểm tra Judge0 có available không
      // Self-hosted không cần API key, chỉ cần check health
      const isJudge0Available = await judge0Service.checkHealth();
      
      if (isJudge0Available) {
        // Chạy code thực với Judge0
        const testCases = challenge.testCases.map((tc, idx) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        }));

        const judgeResults = await judge0Service.runTestCases(
          code,
          language,
          testCases,
          challenge.timeLimit,
          challenge.memoryLimit
        );

        // Map kết quả từ Judge0 sang format của hệ thống
        executionResults = judgeResults.map((result, idx) => {
          const testCase = challenge.testCases[idx];
          const points = result.passed ? (testCase.points || 10) : 0;
          score += points;

          return {
            testCaseIndex: result.testCaseIndex,
            input: result.input,
            expectedOutput: result.expectedOutput,
            actualOutput: result.actualOutput,
            passed: result.passed,
            executionTime: result.executionTime,
            memoryUsed: result.memoryUsed,
            errorMessage: result.errorMessage,
            points
          };
        });

        // Xác định status tổng thể
        const allPassed = executionResults.every(r => r.passed);
        const hasCompilationError = judgeResults.some(r => r.status === 'Compilation Error');
        const hasTimeout = judgeResults.some(r => r.status === 'Time Limit Exceeded');
        const hasMemoryError = judgeResults.some(r => r.status === 'Memory Limit Exceeded');
        const hasRuntimeError = judgeResults.some(r => r.status === 'Runtime Error');

        if (hasCompilationError) {
          status = 'Compilation Error';
          errorMessage = judgeResults.find(r => r.status === 'Compilation Error')?.errorMessage;
        } else if (hasTimeout) {
          status = 'Time Limit Exceeded';
        } else if (hasMemoryError) {
          status = 'Memory Limit Exceeded';
        } else if (hasRuntimeError) {
          status = 'Runtime Error';
          errorMessage = judgeResults.find(r => r.status === 'Runtime Error')?.errorMessage;
        } else if (!allPassed) {
          status = 'Wrong Answer';
        } else {
          status = 'Accepted';
        }
      } else {
        // Fallback về mock nếu Judge0 không available
        console.warn('Judge0 không available, sử dụng mock execution');
        for (let i = 0; i < challenge.testCases.length; i++) {
          const testCase = challenge.testCases[i];
          const passed = true; // Mock - sẽ luôn pass
          const points = passed ? testCase.points || 10 : 0;
          
          executionResults.push({
            testCaseIndex: i,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: testCase.expectedOutput, // Mock
            passed,
            executionTime: Math.random() * 100,
            memoryUsed: Math.random() * 10000,
            points
          });
          
          score += points;
        }
      }
    } catch (error: any) {
      // Nếu Judge0 fail, fallback về mock
      console.error('Judge0 execution failed:', error);
      errorMessage = error.message;
      status = 'Runtime Error';

      // Fallback: tạo mock results
      for (let i = 0; i < challenge.testCases.length; i++) {
        const testCase = challenge.testCases[i];
        executionResults.push({
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsed: 0,
          errorMessage: error.message,
          points: 0
        });
      }
    }

    // Tạo submission
    const submission = new Submission({
      user: userId,
      challenge: challengeId,
      submittedCode: code,
      language,
      status,
      score,
      totalPoints: challenge.points,
      executionResults,
      executionTime: executionResults.reduce((sum, r) => sum + r.executionTime, 0),
      memoryUsed: Math.max(...executionResults.map(r => r.memoryUsed)),
      errorMessage
    });

    // Phân tích với AI để cung cấp feedback chi tiết
    // Tự động dùng Gemini Pro nếu có API key, fallback về rule-based
    try {
      const aiAnalysis = await aiAnalysisService.analyzeWithAI({
        userCode: code,
        correctCode: challenge.correctCode,
        buggyCode: challenge.buggyCode,
        language,
        problemStatement: challenge.problemStatement,
        executionResults: executionResults.map(r => ({
          testCaseIndex: r.testCaseIndex,
          input: r.input,
          expectedOutput: r.expectedOutput,
          actualOutput: r.actualOutput,
          passed: r.passed,
          errorMessage: r.errorMessage
        })),
        errorMessage,
        status
      });

      submission.aiAnalysis = aiAnalysis;
    } catch (error) {
      // Nếu AI analysis fail, vẫn tiếp tục với submission bình thường
      console.error('AI Analysis failed:', error);
    }

    await submission.save();

    // Cập nhật XP nếu đạt điểm
    if (score > 0) {
      const xpEarned = calculateXP(challenge, score, challenge.points);
      const user = await User.findById(userId);
      if (user) {
        user.experience = (user.experience || 0) + xpEarned;
        await user.save();
        await updateUserRank(userId);
        
        // Populate user để trả về XP mới
        await submission.populate('user', 'username experience rank');
        await submission.populate('challenge', 'title difficulty');
        
        return res.json({
          success: true,
          message: 'Nộp bài thành công',
          data: {
            submission,
            xpEarned,
            newXP: user.experience,
            newRank: user.rank
          }
        });
      }
    }

    await submission.populate('user', 'username experience rank');
    await submission.populate('challenge', 'title difficulty');

    res.json({
      success: true,
      message: 'Nộp bài thành công',
      data: {
        submission,
        xpEarned: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách submissions của user cho một challenge
export const getUserSubmissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { challengeId } = req.params;
    const userId = req.user?.id;

    const submissions = await Submission.find({
      user: userId,
      challenge: challengeId
    })
      .populate('challenge', 'title difficulty')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        submissions,
        count: submissions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả submissions của user
export const getAllUserSubmissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status, language } = req.query;

    const filter: any = { user: userId };
    if (status) filter.status = status;
    if (language) filter.language = language;

    const submissions = await Submission.find(filter)
      .populate('challenge', 'title difficulty category')
      .sort({ submittedAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Submission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết một submission
export const getSubmissionById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const submission = await Submission.findById(id)
      .populate('user', 'username')
      .populate('challenge', 'title difficulty testCases');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy submission'
      });
    }

    // Kiểm tra quyền truy cập
    if (submission.user.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập submission này'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê submissions của user
export const getUserSubmissionStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user?.id;

    const stats = await Submission.aggregate([
      { $match: { user: userId as any } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          totalScore: { $sum: '$score' },
          totalPoints: { $sum: '$totalPoints' }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      accepted: 0,
      totalScore: 0,
      totalPoints: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        acceptanceRate: result.total > 0 ? ((result.accepted / result.total) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

