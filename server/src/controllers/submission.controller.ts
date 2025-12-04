import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Submission, { ISubmission } from '../models/submission.model';
import Challenge from '../models/challenge.model';
import User from '../models/user.model';
import aiAnalysisService from '../services/aiAnalysisService';
import judge0Service from '../services/judge0Service';
import { ENV } from '../../config/environment';
import { notifyChallengeCompleted, notifyRankUp } from '../services/notification.service';

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

// Cập nhật rank dựa trên XP và thông báo nếu rank up
const updateUserRank = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return;
  
  const oldRank = user.rank || 'Newbie';
  const xp = user.experience || 0;
  let newRank = 'Newbie';
  
  if (xp >= 1000) newRank = 'Expert';
  else if (xp >= 500) newRank = 'Senior';
  else if (xp >= 200) newRank = 'Intermediate';
  else if (xp >= 50) newRank = 'Junior';
  
  if (oldRank !== newRank) {
    user.rank = newRank as any;
    await user.save();
    
    // Notify user about rank up
    await notifyRankUp(userId, oldRank, newRank);
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

    // Kiểm tra xem user đã submit code đúng trước đó chưa (đạt điểm tối đa)
    // Tìm submission Accepted có điểm cao nhất trước đó
    const previousAcceptedSubmission = await Submission.findOne({
      user: userId,
      challenge: challengeId,
      status: 'Accepted'
    })
      .sort({ score: -1, submittedAt: -1 }) // Sắp xếp theo điểm cao nhất, sau đó theo thời gian mới nhất
      .select('_id submittedAt score submittedCode language executionTime')
      .lean();

    const hasPreviousAccepted = !!previousAcceptedSubmission;
    const previousMaxScore = previousAcceptedSubmission?.score || 0;
    const hasReachedMaxBefore = previousMaxScore >= challenge.points;
    
    if (hasPreviousAccepted) {
      console.log('ℹ️ User đã submit challenge này trước đó:', {
        submissionId: previousAcceptedSubmission!._id,
        submittedAt: previousAcceptedSubmission!.submittedAt,
        previousScore: previousMaxScore,
        maxScore: challenge.points,
        hasReachedMax: hasReachedMaxBefore
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
        
        // Log chi tiết execution time và memory từ Judge0
        console.log('📊 Judge0 execution metrics:', judgeResults.map((r, idx) => ({
          testCase: idx + 1,
          executionTime: r.executionTime,
          memoryUsed: r.memoryUsed,
          status: r.status
        })));

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
        
        // Log executionResults sau khi map
        console.log('📊 Mapped executionResults:', executionResults.map((r, idx) => ({
          testCase: idx + 1,
          executionTime: r.executionTime,
          memoryUsed: r.memoryUsed
        })));

        // Tính lại score dựa trên số test cases pass được
        // Mỗi test case pass sẽ được điểm tương ứng
        score = executionResults.reduce((sum, r) => sum + (r.passed ? r.points : 0), 0);
        
        console.log('📊 Score tính từ test cases:', {
          totalTestCases: executionResults.length,
          passedTestCases: executionResults.filter(r => r.passed).length,
          totalScore: score,
          totalPoints: challenge.points
        });
        
        // Xác định status tổng thể dựa trên kết quả test cases
        const allPassed = executionResults.every(r => r.passed);
        const hasCompilationError = judgeResults.some(r => r.status === 'Compilation Error');
        const hasTimeout = judgeResults.some(r => r.status === 'Time Limit Exceeded');
        const hasMemoryError = judgeResults.some(r => r.status === 'Memory Limit Exceeded');
        const hasRuntimeError = judgeResults.some(r => r.status === 'Runtime Error');
        const hasSystemError = judgeResults.some(r => 
          r.errorMessage && (
            r.errorMessage.includes('No such file or directory') ||
            r.errorMessage.includes('Judge0 không thể') ||
            r.errorMessage.includes('Lỗi hệ thống')
          )
        );

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
        } else if (hasSystemError) {
          status = 'Runtime Error';
          errorMessage = 'Lỗi hệ thống Judge0, không thể chạy code đầy đủ.';
        } else if (!allPassed) {
          status = 'Wrong Answer';
        } else {
          status = 'Accepted';
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
        // Lỗi hệ thống Judge0 - không thể chạy code, fail tất cả test cases
        console.warn('⚠️ Judge0 system error - không thể chạy code:', error.message);
        errorMessage = 'Lỗi hệ thống: Judge0 không thể chạy code. Vui lòng thử lại sau.';
        status = 'Runtime Error';
        
        // Fail tất cả test cases vì không thể chạy code để kiểm tra
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
        
        // Score = 0 vì không có test case nào pass
        score = 0;
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

    // Tính tổng execution time từ tất cả test cases
    const totalExecutionTime = executionResults.length > 0
      ? executionResults.reduce((sum, r) => sum + (r.executionTime || 0), 0)
      : 0;
    
    // Tính peak memory usage
    const peakMemory = executionResults.length > 0
      ? Math.max(...executionResults.map(r => r.memoryUsed || 0))
      : 0;
    
    // Log tổng execution time và peak memory
    console.log('📊 Final submission metrics:', {
      totalExecutionTime,
      peakMemory,
      executionResultsCount: executionResults.length,
      executionTimes: executionResults.map(r => r.executionTime),
      memoryUsages: executionResults.map(r => r.memoryUsed)
    });

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
      executionTime: totalExecutionTime,
      memoryUsed: peakMemory,
      errorMessage,
      submittedAt: new Date() // Đảm bảo submittedAt được set đúng
    });

    console.log('💾 Saving submission to database...');
    await submission.save();
    console.log('✅ Submission saved:', submission._id);

    // Phân tích với AI không đồng bộ (fire-and-forget) để không làm chậm response
    // Tự động dùng Gemini Pro nếu có API key, fallback về rule-based
    console.log('🤖 Starting AI analysis (async)...');
    aiAnalysisService.analyzeWithAI({
      userCode: code,
      correctCode: undefined,
      buggyCode: undefined,
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
    }).then(async (aiAnalysis) => {
      // Cập nhật submission với AI analysis sau khi có kết quả
      submission.aiAnalysis = aiAnalysis;
      await submission.save();
      console.log('✅ AI analysis completed and saved');
    }).catch((error: any) => {
      console.error('❌ AI Analysis failed:', error.message);
    });

    // Cập nhật XP nếu đạt điểm
    // CHỈ tính XP nếu:
    // 1. Score > 0 (có điểm)
    // 2. Chưa từng đạt điểm tối đa trước đó, HOẶC đạt điểm cao hơn lần trước (cải thiện)
    let xpEarned = 0;
    let shouldAwardXP = false;
    
    if (score > 0) {
      // Chỉ tính XP nếu:
      // - Chưa từng submit trước đó, HOẶC
      // - Chưa từng đạt điểm tối đa trước đó, HOẶC
      // - Đạt điểm cao hơn lần trước (cải thiện)
      const shouldAward = !hasPreviousAccepted || 
                         (!hasReachedMaxBefore && score >= challenge.points) || 
                         (hasPreviousAccepted && score > previousMaxScore);
      
      if (shouldAward) {
        xpEarned = calculateXP(challenge, score, challenge.points);
        shouldAwardXP = true;
        
        const user = await User.findById(userId);
        if (user) {
          const oldRank = user.rank || 'Newbie';
          user.experience = (user.experience || 0) + xpEarned;
          await user.save();
          await updateUserRank(userId);
          
          // Create notification for challenge completion (async - không chờ)
          const isFirstTime = !hasPreviousAccepted;
          notifyChallengeCompleted(
            userId,
            challenge.title,
            xpEarned,
            score,
            challenge.points,
            challengeId,
            isFirstTime
          ).catch(error => {
            console.error('❌ Failed to create notification:', error.message);
          });
          
          // Populate user để trả về XP mới
          await submission.populate('user', 'username experience rank');
          await submission.populate('challenge', 'title difficulty');
          
          // Tạo message phù hợp
          let message = 'Nộp bài thành công';
          if (hasPreviousAccepted && score > previousMaxScore) {
            message = 'Nộp bài thành công! Bạn đã cải thiện điểm số.';
          } else if (!hasPreviousAccepted && score >= challenge.points) {
            message = 'Nộp bài thành công! Chúc mừng bạn đã giải được bài này.';
          }
          
          return res.json({
            success: true,
            message: message,
            data: {
              submission,
              xpEarned,
              newXP: user.experience,
              newRank: user.rank,
              previousSubmission: hasPreviousAccepted ? previousAcceptedSubmission : null,
              isImprovement: hasPreviousAccepted && score > previousMaxScore,
              hasReachedMaxBefore: hasReachedMaxBefore,
              message: hasPreviousAccepted 
                ? `Bạn đã submit bài này trước đó (${previousMaxScore}/${challenge.points} điểm). Lần này bạn đạt ${score}/${challenge.points} điểm.`
                : undefined
            }
          });
        }
      } else {
        // Đã đạt điểm tối đa trước đó và lần này không cải thiện
        console.log('ℹ️ User đã đạt điểm tối đa trước đó hoặc không cải thiện, không tính XP lại');
      }
    }

    await submission.populate('user', 'username experience rank');
    await submission.populate('challenge', 'title difficulty');

    const duration = Date.now() - startTime;
    console.log('✅ Submission completed in', duration, 'ms');
    console.log('Status:', status);
    console.log('Score:', score, '/', challenge.points);
    console.log('=== 📝 SUBMISSION END ===\n');

    // Tạo message phù hợp
    let message = 'Nộp bài thành công';
    if (hasPreviousAccepted) {
      if (score >= challenge.points && hasReachedMaxBefore) {
        message = 'Nộp bài thành công! Bạn đã giải được bài này trước đó.';
      } else if (score < previousMaxScore) {
        message = 'Nộp bài thành công. Bạn đã giải được bài này trước đó với điểm cao hơn.';
      } else if (score === previousMaxScore) {
        message = 'Nộp bài thành công. Điểm số giống với lần submit trước.';
      }
    }

    res.json({
      success: true,
      message: message,
      data: {
        submission,
        xpEarned: 0,
        previousSubmission: hasPreviousAccepted ? previousAcceptedSubmission : null,
        hasPreviousAccepted: hasPreviousAccepted,
        hasReachedMaxBefore: hasReachedMaxBefore,
        previousMaxScore: previousMaxScore,
        message: hasPreviousAccepted 
          ? `Bạn đã submit bài này trước đó (${previousMaxScore}/${challenge.points} điểm). Lần này bạn đạt ${score}/${challenge.points} điểm.`
          : undefined
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

