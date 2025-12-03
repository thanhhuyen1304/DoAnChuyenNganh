/**
 * Script Test Toàn Diện: Kiểm Tra Chatbot Đã Nhúng Sâu Vào Dữ Liệu Project Chưa
 * 
 * Script này kiểm tra tất cả các tích hợp của chatbot với dữ liệu:
 * 1. Training Data (Word2Vec)
 * 2. User Submissions & Errors
 * 3. Knowledge Graph
 * 4. Challenges
 * 5. Error Analysis từ AI
 * 
 * Usage:
 *   npx ts-node scripts/test-chatbot-data-integration.ts
 */

import mongoose from 'mongoose';
import Submission from '../src/models/submission.model';
import User from '../src/models/user.model';
import TrainingData from '../src/models/trainingData.model';
import Challenge from '../src/models/challenge.model';
import ChatHistory from '../src/models/chatHistory.model';
import { knowledgeGraphService } from '../src/services/knowledgeGraphService';
import { word2vecService } from '../src/services/word2vecService';

// Lấy MONGODB_URI từ env, nếu không có thì dùng default
// Xử lý case sensitivity của database name
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
// Nếu URI có /bughunter, thử thay bằng /BugHunter (case sensitivity)
if (MONGODB_URI.includes('/bughunter') && !MONGODB_URI.includes('/BugHunter')) {
  // Thử với BugHunter trước
  const uriWithBugHunter = MONGODB_URI.replace('/bughunter', '/BugHunter');
  MONGODB_URI = uriWithBugHunter;
}

interface TestResult {
  category: string;
  testName: string;
  passed: boolean;
  message: string;
  data?: any;
  score: number; // 0-100
}

const results: TestResult[] = [];

async function testChatbotDataIntegration() {
  try {
    // Connect to MongoDB
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');
    console.log('='.repeat(70));
    console.log('🧪 KIỂM TRA TÍCH HỢP CHATBOT VỚI DỮ LIỆU PROJECT');
    console.log('='.repeat(70));
    console.log();

    // ============================================================
    // 1. KIỂM TRA TRAINING DATA INTEGRATION
    // ============================================================
    console.log('📚 PHẦN 1: KIỂM TRA TRAINING DATA INTEGRATION');
    console.log('─'.repeat(70));
    
    // 1.1. Kiểm tra số lượng Training Data
    const trainingDataCount = await TrainingData.countDocuments({ isActive: true });
    const totalTrainingData = await TrainingData.countDocuments();
    
    results.push({
      category: 'Training Data',
      testName: 'Training Data có trong database',
      passed: trainingDataCount > 0,
      message: trainingDataCount > 0 
        ? `✅ Có ${trainingDataCount} training data active (tổng ${totalTrainingData})`
        : `❌ Không có training data active trong database`,
      data: { active: trainingDataCount, total: totalTrainingData },
      score: trainingDataCount >= 50 ? 100 : trainingDataCount >= 20 ? 70 : trainingDataCount > 0 ? 40 : 0,
    });
    console.log(`   ${trainingDataCount > 0 ? '✅' : '❌'} Training Data: ${trainingDataCount} active, ${totalTrainingData} total`);

    // 1.2. Kiểm tra Word2Vec Model
    const isWord2VecTrained = word2vecService.isModelTrained();
    results.push({
      category: 'Training Data',
      testName: 'Word2Vec Model đã được train',
      passed: isWord2VecTrained,
      message: isWord2VecTrained 
        ? `✅ Word2Vec model đã được train và sẵn sàng sử dụng`
        : `⚠️  Word2Vec model chưa được train - sẽ dùng keyword matching`,
      score: isWord2VecTrained ? 100 : 0,
    });
    console.log(`   ${isWord2VecTrained ? '✅' : '⚠️ '} Word2Vec Model: ${isWord2VecTrained ? 'Đã train' : 'Chưa train'}`);

    // 1.3. Test tìm Training Data
    if (trainingDataCount > 0) {
      try {
        const testQuery = 'làm sao debug lỗi JavaScript?';
        const relevantData = await TrainingData.find({
          isActive: true,
          $or: [
            { question: { $regex: testQuery, $options: 'i' } },
            { answer: { $regex: testQuery, $options: 'i' } },
            { tags: { $in: ['debug', 'javascript', 'error'] } },
          ],
        }).limit(3).lean();

        results.push({
          category: 'Training Data',
          testName: 'Có thể tìm Training Data liên quan',
          passed: relevantData.length > 0,
          message: relevantData.length > 0 
            ? `✅ Tìm thấy ${relevantData.length} training data liên quan với query test`
            : `⚠️  Không tìm thấy training data liên quan (có thể cần thêm data)`,
          data: { found: relevantData.length, query: testQuery },
          score: relevantData.length >= 3 ? 100 : relevantData.length > 0 ? 60 : 0,
        });
        console.log(`   ${relevantData.length > 0 ? '✅' : '⚠️ '} Tìm Training Data: ${relevantData.length} kết quả`);
      } catch (error: any) {
        results.push({
          category: 'Training Data',
          testName: 'Có thể tìm Training Data liên quan',
          passed: false,
          message: `❌ Lỗi khi tìm training data: ${error.message}`,
          score: 0,
        });
      }
    }

    console.log();

    // ============================================================
    // 2. KIỂM TRA USER SUBMISSIONS & ERRORS INTEGRATION
    // ============================================================
    console.log('👤 PHẦN 2: KIỂM TRA USER SUBMISSIONS & ERRORS INTEGRATION');
    console.log('─'.repeat(70));

    // 2.1. Tìm user có submissions
    const users = await User.find({}).limit(10).lean();
    let testUser: any = null;
    let userErrorCount = 0;
    let userSubmissionCount = 0;

    for (const user of users) {
      const errorSubmissions = await Submission.countDocuments({
        user: user._id,
        status: { $ne: 'Accepted' }
      });
      const totalSubmissions = await Submission.countDocuments({ user: user._id });
      
      if (totalSubmissions > 0) {
        testUser = user;
        userErrorCount = errorSubmissions;
        userSubmissionCount = totalSubmissions;
        break;
      }
    }

    results.push({
      category: 'User Data',
      testName: 'Có user với submissions trong database',
      passed: testUser !== null,
      message: testUser !== null
        ? `✅ Tìm thấy user: ${testUser.email} (${userSubmissionCount} submissions, ${userErrorCount} errors)`
        : `⚠️  Không tìm thấy user nào có submissions`,
      data: testUser ? { 
        email: testUser.email, 
        submissions: userSubmissionCount, 
        errors: userErrorCount 
      } : null,
      score: testUser && userSubmissionCount > 0 ? 100 : 0,
    });
    console.log(`   ${testUser ? '✅' : '⚠️ '} User với Submissions: ${testUser ? testUser.email : 'Không tìm thấy'}`);

    // 2.2. Kiểm tra submissions có AI Analysis
    if (testUser) {
      const submissionsWithAnalysis = await Submission.countDocuments({
        user: testUser._id,
        'aiAnalysis.errorAnalyses': { $exists: true, $ne: [] }
      });

      results.push({
        category: 'User Data',
        testName: 'Submissions có AI Analysis (cho chatbot context)',
        passed: submissionsWithAnalysis > 0,
        message: submissionsWithAnalysis > 0
          ? `✅ Có ${submissionsWithAnalysis} submissions có AI analysis (cung cấp context cho chatbot)`
          : `⚠️  Không có submissions nào có AI analysis - chatbot không thể sử dụng error context`,
        data: { count: submissionsWithAnalysis, total: userSubmissionCount },
        score: submissionsWithAnalysis >= 3 ? 100 : submissionsWithAnalysis > 0 ? 60 : 0,
      });
      console.log(`   ${submissionsWithAnalysis > 0 ? '✅' : '⚠️ '} Submissions với AI Analysis: ${submissionsWithAnalysis}/${userSubmissionCount}`);
    }

    // 2.3. Test lấy recent errors (như trong chat controller)
    if (testUser) {
      try {
        const recentSubmissions = await Submission.find({
          user: testUser._id,
          status: { $ne: 'Accepted' }
        })
          .sort({ submittedAt: -1 })
          .limit(10)
          .lean();

        const errorTypes: Record<string, number> = {};
        const errorMessages: string[] = [];

        recentSubmissions.forEach(sub => {
          if (sub.aiAnalysis?.errorAnalyses) {
            sub.aiAnalysis.errorAnalyses.forEach((error: any) => {
              errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1;
              if (error.errorMessage) {
                errorMessages.push(error.errorMessage);
              }
            });
          }
        });

        results.push({
          category: 'User Data',
          testName: 'Có thể extract error types từ submissions',
          passed: Object.keys(errorTypes).length > 0,
          message: Object.keys(errorTypes).length > 0
            ? `✅ Extract được ${Object.keys(errorTypes).length} loại lỗi từ submissions`
            : `⚠️  Không thể extract error types (có thể submissions chưa có AI analysis)`,
          data: { errorTypes, errorCount: errorMessages.length },
          score: Object.keys(errorTypes).length >= 2 ? 100 : Object.keys(errorTypes).length > 0 ? 50 : 0,
        });
        console.log(`   ${Object.keys(errorTypes).length > 0 ? '✅' : '⚠️ '} Error Types: ${Object.keys(errorTypes).length} loại`);
      } catch (error: any) {
        results.push({
          category: 'User Data',
          testName: 'Có thể extract error types từ submissions',
          passed: false,
          message: `❌ Lỗi: ${error.message}`,
          score: 0,
        });
      }
    }

    console.log();

    // ============================================================
    // 3. KIỂM TRA KNOWLEDGE GRAPH INTEGRATION
    // ============================================================
    console.log('🕸️  PHẦN 3: KIỂM TRA KNOWLEDGE GRAPH INTEGRATION');
    console.log('─'.repeat(70));

    // 3.1. Test buildErrorBasedGraph
    if (testUser) {
      try {
        console.log('   Đang build error-based graph...');
        const graphData = await knowledgeGraphService.buildErrorBasedGraph(
          testUser._id.toString()
        );

        const nodeCount = graphData.nodes.length;
        const hasErrorSummary = !!graphData.errorSummary;
        const hasRecommendations = !!graphData.recommendations;

        results.push({
          category: 'Knowledge Graph',
          testName: 'Knowledge Graph có thể build từ user errors',
          passed: nodeCount > 0 && hasErrorSummary,
          message: nodeCount > 0 && hasErrorSummary
            ? `✅ Knowledge Graph được build thành công: ${nodeCount} nodes, có error summary & recommendations`
            : `⚠️  Knowledge Graph được build nhưng thiếu data`,
          data: {
            nodes: nodeCount,
            links: graphData.links.length,
            hasErrorSummary,
            hasRecommendations,
            errorTypes: graphData.errorSummary?.errorTypes || {},
          },
          score: nodeCount > 0 && hasErrorSummary ? 100 : nodeCount > 0 ? 50 : 0,
        });
        console.log(`   ${nodeCount > 0 ? '✅' : '⚠️ '} Error-Based Graph: ${nodeCount} nodes`);
      } catch (error: any) {
        console.error('   ❌ Lỗi buildErrorBasedGraph:', error.message);
        console.error('   Stack:', error.stack);
        results.push({
          category: 'Knowledge Graph',
          testName: 'Knowledge Graph có thể build từ user errors',
          passed: false,
          message: `❌ Lỗi khi build graph: ${error.message}`,
          data: { error: error.message, stack: error.stack },
          score: 0,
        });
      }
    }

    // 3.2. Test findTrainingDataForErrors
    try {
      const testErrorMessages = ['undefined is not defined', 'syntax error'];
      const testErrorTypes = ['runtime', 'syntax'];
      
      const trainingDataForErrors = await knowledgeGraphService.findTrainingDataForErrors(
        testErrorMessages,
        testErrorTypes,
        5
      );

      results.push({
        category: 'Knowledge Graph',
        testName: 'Knowledge Graph có thể tìm Training Data cho errors',
        passed: trainingDataForErrors.length > 0,
        message: trainingDataForErrors.length > 0
          ? `✅ Tìm thấy ${trainingDataForErrors.length} training data liên quan đến errors`
          : `⚠️  Không tìm thấy training data liên quan (có thể cần thêm training data về errors)`,
        data: { found: trainingDataForErrors.length },
        score: trainingDataForErrors.length >= 3 ? 100 : trainingDataForErrors.length > 0 ? 60 : 0,
      });
      console.log(`   ${trainingDataForErrors.length > 0 ? '✅' : '⚠️ '} Training Data cho Errors: ${trainingDataForErrors.length} kết quả`);
    } catch (error: any) {
      results.push({
        category: 'Knowledge Graph',
        testName: 'Knowledge Graph có thể tìm Training Data cho errors',
        passed: false,
        message: `❌ Lỗi: ${error.message}`,
        score: 0,
      });
    }

    console.log();

    // ============================================================
    // 4. KIỂM TRA CHALLENGES INTEGRATION
    // ============================================================
    console.log('🏆 PHẦN 4: KIỂM TRA CHALLENGES INTEGRATION');
    console.log('─'.repeat(70));

    // 4.1. Kiểm tra số lượng Challenges
    const activeChallenges = await Challenge.countDocuments({ isActive: true });
    const totalChallenges = await Challenge.countDocuments();

    results.push({
      category: 'Challenges',
      testName: 'Có Challenges trong database',
      passed: activeChallenges > 0,
      message: activeChallenges > 0
        ? `✅ Có ${activeChallenges} challenges active (tổng ${totalChallenges})`
        : `❌ Không có challenges trong database`,
      data: { active: activeChallenges, total: totalChallenges },
      score: activeChallenges >= 10 ? 100 : activeChallenges >= 5 ? 70 : activeChallenges > 0 ? 40 : 0,
    });
    console.log(`   ${activeChallenges > 0 ? '✅' : '❌'} Challenges: ${activeChallenges} active`);

    // 4.2. Test tìm Challenges (như trong chat controller)
    if (activeChallenges > 0) {
      try {
        const testLanguages = ['Python', 'JavaScript'];
        const challenges = await Challenge.find({
          isActive: true,
          language: { $in: testLanguages }
        }).limit(5).lean();

        results.push({
          category: 'Challenges',
          testName: 'Có thể tìm Challenges theo ngôn ngữ',
          passed: challenges.length > 0,
          message: challenges.length > 0
            ? `✅ Tìm thấy ${challenges.length} challenges với ngôn ngữ phổ biến`
            : `⚠️  Không tìm thấy challenges với ngôn ngữ phổ biến`,
          data: { found: challenges.length, languages: testLanguages },
          score: challenges.length >= 3 ? 100 : challenges.length > 0 ? 60 : 0,
        });
        console.log(`   ${challenges.length > 0 ? '✅' : '⚠️ '} Challenges theo ngôn ngữ: ${challenges.length} kết quả`);
      } catch (error: any) {
        results.push({
          category: 'Challenges',
          testName: 'Có thể tìm Challenges theo ngôn ngữ',
          passed: false,
          message: `❌ Lỗi: ${error.message}`,
          score: 0,
        });
      }
    }

    console.log();

    // ============================================================
    // 5. KIỂM TRA CHAT HISTORY INTEGRATION
    // ============================================================
    console.log('💬 PHẦN 5: KIỂM TRA CHAT HISTORY INTEGRATION');
    console.log('─'.repeat(70));

    const chatHistoriesCount = await ChatHistory.countDocuments();
    results.push({
      category: 'Chat History',
      testName: 'Có Chat Histories được lưu',
      passed: chatHistoriesCount > 0,
      message: chatHistoriesCount > 0
        ? `✅ Có ${chatHistoriesCount} chat histories trong database`
        : `⚠️  Chưa có chat histories (chatbot chưa được sử dụng)`,
      data: { count: chatHistoriesCount },
      score: chatHistoriesCount >= 5 ? 100 : chatHistoriesCount > 0 ? 60 : 0,
    });
    console.log(`   ${chatHistoriesCount > 0 ? '✅' : '⚠️ '} Chat Histories: ${chatHistoriesCount}`);

    if (chatHistoriesCount > 0) {
      const chatWithRatings = await ChatHistory.countDocuments({
        'messages.rating': { $exists: true }
      });

      results.push({
        category: 'Chat History',
        testName: 'Chat Histories có ratings (feedback)',
        passed: chatWithRatings > 0,
        message: chatWithRatings > 0
          ? `✅ Có ${chatWithRatings} chat histories có ratings (có feedback từ user)`
          : `⚠️  Chưa có ratings nào (user chưa đánh giá chatbot responses)`,
        data: { withRatings: chatWithRatings, total: chatHistoriesCount },
        score: chatWithRatings >= 3 ? 100 : chatWithRatings > 0 ? 60 : 0,
      });
      console.log(`   ${chatWithRatings > 0 ? '✅' : '⚠️ '} Chat với Ratings: ${chatWithRatings}/${chatHistoriesCount}`);
    }

    console.log();

    // ============================================================
    // 6. TỔNG HỢP & ĐÁNH GIÁ
    // ============================================================
    printSummary();

  } catch (error: any) {
    console.error('❌ Lỗi nghiêm trọng:', error.message);
    console.error(error.stack);
    results.push({
      category: 'System',
      testName: 'Test Execution',
      passed: false,
      message: `❌ Lỗi nghiêm trọng: ${error.message}`,
      score: 0,
    });
    printSummary();
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

function printSummary() {
  console.log();
  console.log('='.repeat(70));
  console.log('📊 TỔNG HỢP KẾT QUẢ');
  console.log('='.repeat(70));
  console.log();

  // Nhóm theo category
  const byCategory: Record<string, TestResult[]> = {};
  results.forEach(r => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = [];
    }
    byCategory[r.category].push(r);
  });

  // In kết quả theo category
  Object.keys(byCategory).forEach(category => {
    console.log(`\n📁 ${category}`);
    console.log('─'.repeat(70));
    
    byCategory[category].forEach((result, index) => {
      const icon = result.passed ? '✅' : result.score > 0 ? '⚠️ ' : '❌';
      console.log(`${index + 1}. ${icon} ${result.testName}`);
      console.log(`   ${result.message}`);
      if (result.data && Object.keys(result.data).length > 0) {
        console.log(`   Data: ${JSON.stringify(result.data)}`);
      }
    });
  });

  // Tính điểm tổng
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.length * 100;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const passedCount = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log();
  console.log('='.repeat(70));
  console.log('📈 ĐÁNH GIÁ TỔNG THỂ');
  console.log('='.repeat(70));
  console.log();
  console.log(`✅ Tests passed: ${passedCount}/${totalTests} (${Math.round((passedCount / totalTests) * 100)}%)`);
  console.log(`📊 Điểm số: ${totalScore}/${maxScore} (${percentage}%)`);
  console.log();

  // Đánh giá mức độ tích hợp
  let integrationLevel = 'CHƯA TÍCH HỢP';
  let levelEmoji = '❌';
  let recommendations: string[] = [];

  if (percentage >= 90) {
    integrationLevel = 'TÍCH HỢP SÂU (Excellent)';
    levelEmoji = '🎉';
  } else if (percentage >= 75) {
    integrationLevel = 'TÍCH HỢP TỐT (Good)';
    levelEmoji = '✅';
  } else if (percentage >= 50) {
    integrationLevel = 'TÍCH HỢP VỪA PHẢI (Fair)';
    levelEmoji = '⚠️';
    recommendations.push('Cần cải thiện một số tích hợp');
  } else if (percentage >= 25) {
    integrationLevel = 'TÍCH HỢP YẾU (Poor)';
    levelEmoji = '⚠️';
    recommendations.push('Chatbot chưa tích hợp đủ với dữ liệu');
    recommendations.push('Cần thêm training data và user submissions');
  } else {
    integrationLevel = 'CHƯA TÍCH HỢP (None)';
    levelEmoji = '❌';
    recommendations.push('Chatbot hầu như chưa tích hợp với dữ liệu project');
    recommendations.push('Cần setup và thêm dữ liệu ngay');
  }

  console.log(`${levelEmoji} Mức độ tích hợp: ${integrationLevel}`);
  console.log();

  if (recommendations.length > 0) {
    console.log('💡 KHUYẾN NGHỊ:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log();
  }

  // Đề xuất cải thiện cụ thể
  const categoriesNeedingWork = Object.keys(byCategory).filter(cat => {
    const categoryResults = byCategory[cat];
    const avgScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;
    return avgScore < 70;
  });

  if (categoriesNeedingWork.length > 0) {
    console.log('🔧 CẦN CẢI THIỆN:');
    categoriesNeedingWork.forEach((cat, index) => {
      const categoryResults = byCategory[cat];
      const avgScore = Math.round(categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length);
      console.log(`   ${index + 1}. ${cat} (điểm: ${avgScore}/100)`);
    });
    console.log();
  }

  console.log('='.repeat(70));
}

// Run tests
if (require.main === module) {
  testChatbotDataIntegration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testChatbotDataIntegration };
