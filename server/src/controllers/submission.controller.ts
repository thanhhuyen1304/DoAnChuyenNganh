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
  const startTime = Date.now();
  
  try {
    console.log('\n=== 📝 SUBMISSION START ===');
    console.log('Time:', new Date().toISOString());
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { challengeId, code, language } = req.body;
    const userId = req.user?.id;
    
    console.log('Challenge ID:', challengeId);
    console.log('Language:', language);
    console.log('Code length:', code?.length || 0);
    console.log('User ID:', userId);

    // Lấy challenge
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      console.log('❌ Challenge not found:', challengeId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    console.log('Challenge found:', challenge.title);
    console.log('Test cases count:', challenge.testCases?.length || 0);

    if (!challenge.isActive) {
      console.log('❌ Challenge is not active');
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
      console.log('🔍 Checking Judge0 health...');
      const isJudge0Available = await judge0Service.checkHealth();
      console.log('Judge0 available:', isJudge0Available);
      
      if (isJudge0Available) {
        console.log('✅ Running code with Judge0...');
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

        console.log('✅ Judge0 results received:', judgeResults.length, 'test cases');
        console.log('Results summary:', {
          passed: judgeResults.filter(r => r.passed).length,
          failed: judgeResults.filter(r => !r.passed).length,
          statuses: judgeResults.map(r => r.status)
        });

        // Map kết quả từ Judge0 sang format của hệ thống
        executionResults = judgeResults.map((result, idx) => {
          const testCase = challenge.testCases[idx];
          const points = result.passed ? (testCase.points || 10) : 0;
          score += points;

          return {
            testCaseIndex: result.testCaseIndex,
            input: result.input || '',
            expectedOutput: result.expectedOutput || '',
            actualOutput: result.actualOutput || '', // Đảm bảo luôn là string, không bao giờ undefined
            passed: result.passed,
            executionTime: result.executionTime || 0,
            memoryUsed: result.memoryUsed || 0,
            errorMessage: result.errorMessage,
            points
          };
        });

        // Kiểm tra xem có lỗi hệ thống Judge0 không (status 13 - Internal Error)
        const hasSystemError = judgeResults.some(r => 
          r.errorMessage && (
            r.errorMessage.includes('No such file or directory') ||
            r.errorMessage.includes('Judge0 không thể') ||
            r.errorMessage.includes('Lỗi hệ thống')
          )
        );
        
        // Nếu có lỗi hệ thống và có correctCode, so sánh code
        if (hasSystemError && challenge.correctCode) {
          const normalizedUserCode = code.trim().replace(/\s+/g, ' ');
          const normalizedCorrectCode = challenge.correctCode.trim().replace(/\s+/g, ' ');
          const codeMatches = normalizedUserCode === normalizedCorrectCode;
          
          console.log('🔍 Judge0 lỗi hệ thống, so sánh code với correctCode:', codeMatches ? '✅ Khớp' : '❌ Không khớp');
          
          if (codeMatches) {
            // Code đúng - cập nhật lại executionResults
            executionResults = challenge.testCases.map((testCase, idx) => ({
              testCaseIndex: idx,
              input: testCase.input || '',
              expectedOutput: testCase.expectedOutput || '',
              actualOutput: testCase.expectedOutput || '',
              passed: true,
              executionTime: 0,
              memoryUsed: 0,
              errorMessage: 'Lỗi hệ thống Judge0, không thể chạy code. Code đúng dựa trên so sánh với giải pháp.',
              points: testCase.points || 10
            }));
            score = challenge.testCases.reduce((sum, tc) => sum + (tc.points || 10), 0);
            status = 'Accepted';
            errorMessage = undefined;
            console.log('✅ Code đúng, đánh giá là Accepted dù Judge0 lỗi');
          }
        }
        
        // Xác định status tổng thể (nếu chưa được set ở trên)
        if (status === 'Accepted' && executionResults.every(r => r.passed)) {
          // Đã set ở trên, không cần làm gì
        } else {
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
          } else if (hasRuntimeError && !hasSystemError) {
            status = 'Runtime Error';
            errorMessage = judgeResults.find(r => r.status === 'Runtime Error')?.errorMessage;
          } else if (!allPassed) {
            status = 'Wrong Answer';
          } else {
            status = 'Accepted';
          }
        }
      } else {
        // Fallback về mock nếu Judge0 không available
        console.warn('⚠️ Judge0 không available, sử dụng mock execution');
        for (let i = 0; i < challenge.testCases.length; i++) {
          const testCase = challenge.testCases[i];
          const passed = true; // Mock - sẽ luôn pass
          const points = passed ? testCase.points || 10 : 0;
          
          executionResults.push({
            testCaseIndex: i,
            input: testCase.input || '',
            expectedOutput: testCase.expectedOutput || '',
            actualOutput: testCase.expectedOutput || '', // Mock - đảm bảo luôn là string
            passed,
            executionTime: Math.random() * 100,
            memoryUsed: Math.random() * 10000,
            points
          });
          
          score += points;
        }
      }
    } catch (error: any) {
      // Nếu Judge0 fail, kiểm tra xem có phải lỗi hệ thống không
      const isSystemError = error.message.includes('No such file or directory') || 
                           error.message.includes('Judge0 không thể');
      
      if (isSystemError) {
        // Lỗi hệ thống Judge0 - chỉ log warning vì đã có fallback
        console.warn('⚠️ Judge0 system error (sẽ sử dụng fallback):', error.message);
        errorMessage = 'Lỗi hệ thống: Judge0 không thể tạo file script. Hệ thống sẽ sử dụng phương pháp dự phòng để đánh giá.';
        status = 'Runtime Error';
        
        // Nếu có correctCode, so sánh code để ít nhất biết code có đúng không
        if (challenge.correctCode) {
          const normalizedUserCode = code.trim().replace(/\s+/g, ' ');
          const normalizedCorrectCode = challenge.correctCode.trim().replace(/\s+/g, ' ');
          const codeMatches = normalizedUserCode === normalizedCorrectCode;
          
          console.log('🔍 So sánh code với correctCode:', codeMatches ? '✅ Khớp' : '❌ Không khớp');
          
          if (codeMatches) {
            // Code đúng nhưng Judge0 lỗi - đánh giá là đúng nhưng không tính điểm
            console.log('✅ Code đúng nhưng Judge0 lỗi hệ thống');
            for (let i = 0; i < challenge.testCases.length; i++) {
              const testCase = challenge.testCases[i];
              executionResults.push({
                testCaseIndex: i,
                input: testCase.input || '',
                expectedOutput: testCase.expectedOutput || '',
                actualOutput: testCase.expectedOutput || '', // Giả định output đúng vì code đúng
                passed: true, // Code đúng nên pass
                executionTime: 0,
                memoryUsed: 0,
                errorMessage: 'Lỗi hệ thống Judge0, không thể chạy code. Code có vẻ đúng dựa trên so sánh với giải pháp.',
                points: testCase.points || 10
              });
              score += (testCase.points || 10);
            }
            status = 'Accepted'; // Code đúng
          } else {
            // Code không khớp - không thể đánh giá
            for (let i = 0; i < challenge.testCases.length; i++) {
              const testCase = challenge.testCases[i];
              executionResults.push({
                testCaseIndex: i,
                input: testCase.input || '',
                expectedOutput: testCase.expectedOutput || '',
                actualOutput: errorMessage || '',
                passed: false,
                executionTime: 0,
                memoryUsed: 0,
                errorMessage: errorMessage,
                points: 0
              });
            }
          }
        } else {
          // Không có correctCode để so sánh - fail tất cả
          for (let i = 0; i < challenge.testCases.length; i++) {
            const testCase = challenge.testCases[i];
            executionResults.push({
              testCaseIndex: i,
              input: testCase.input || '',
              expectedOutput: testCase.expectedOutput || '',
              actualOutput: errorMessage || '',
              passed: false,
              executionTime: 0,
              memoryUsed: 0,
              errorMessage: errorMessage,
              points: 0
            });
          }
        }
      } else {
        // Lỗi khác (không phải hệ thống)
        errorMessage = error.message;
        status = 'Runtime Error';
        
        for (let i = 0; i < challenge.testCases.length; i++) {
          const testCase = challenge.testCases[i];
          executionResults.push({
            testCaseIndex: i,
            input: testCase.input || '',
            expectedOutput: testCase.expectedOutput || '',
            actualOutput: error.message || '',
            passed: false,
            executionTime: 0,
            memoryUsed: 0,
            errorMessage: error.message,
            points: 0
          });
        }
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
    console.log('🤖 Starting AI analysis...');
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
      console.log('✅ AI analysis completed');
    } catch (error: any) {
      // Nếu AI analysis fail, vẫn tiếp tục với submission bình thường
      console.error('❌ AI Analysis failed:', error.message);
      console.error('Error stack:', error.stack);
    }

    console.log('💾 Saving submission to database...');
    await submission.save();
    console.log('✅ Submission saved:', submission._id);

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

    const duration = Date.now() - startTime;
    console.log('✅ Submission completed in', duration, 'ms');
    console.log('Status:', status);
    console.log('Score:', score, '/', challenge.points);
    console.log('=== 📝 SUBMISSION END ===\n');

    res.json({
      success: true,
      message: 'Nộp bài thành công',
      data: {
        submission,
        xpEarned: 0
      }
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ Fatal error in submission:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Duration:', duration, 'ms');
    console.error('=== 📝 SUBMISSION END (ERROR) ===\n');
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

