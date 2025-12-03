/**
 * Script để test Knowledge Graph tích hợp vào Chatbot
 * 
 * Usage:
 *   npx ts-node scripts/test-knowledge-graph-chatbot.ts
 */

import mongoose from 'mongoose';
import Submission from '../src/models/submission.model';
import User from '../src/models/user.model';
import { knowledgeGraphService } from '../src/services/knowledgeGraphService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  data?: any;
}

async function testKnowledgeGraphChatbot() {
  const results: TestResult[] = [];

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Tìm một user có submissions với lỗi
    console.log('🔍 Finding user with error submissions...');
    const users = await User.find({}).limit(10).lean();
    
    let testUser = null;
    for (const user of users) {
      const errorSubmissions = await Submission.countDocuments({
        user: user._id,
        status: { $ne: 'Accepted' }
      });
      
      if (errorSubmissions > 0) {
        testUser = user;
        console.log(`✅ Found user: ${user.email} (${errorSubmissions} error submissions)\n`);
        break;
      }
    }

    if (!testUser) {
      results.push({
        testName: 'Find User with Errors',
        passed: false,
        message: '❌ Không tìm thấy user nào có submissions với lỗi. Vui lòng tạo submissions với lỗi trước.',
      });
      printResults(results);
      return;
    }

    results.push({
      testName: 'Find User with Errors',
      passed: true,
      message: `✅ Tìm thấy user: ${testUser.email}`,
      data: { userId: testUser._id.toString(), email: testUser.email },
    });

    // 2. Test buildErrorBasedGraph
    console.log('🔍 Test 1: buildErrorBasedGraph');
    console.log('─'.repeat(50));
    try {
      const graphData = await knowledgeGraphService.buildErrorBasedGraph(
        testUser._id.toString()
      );

      const nodeCount = graphData.nodes.length;
      const linkCount = graphData.links.length;
      const errorTypeCount = Object.keys(graphData.errorSummary.errorTypes).length;
      const trainingDataCount = graphData.recommendations.trainingData.length;
      const challengeCount = graphData.recommendations.challenges.length;

      console.log(`   Nodes: ${nodeCount}`);
      console.log(`   Links: ${linkCount}`);
      console.log(`   Error types: ${errorTypeCount}`);
      console.log(`   Recommended training data: ${trainingDataCount}`);
      console.log(`   Recommended challenges: ${challengeCount}`);

      if (errorTypeCount > 0) {
        console.log(`   Error types found:`, graphData.errorSummary.errorTypes);
      }

      const testPassed = nodeCount > 0 && linkCount >= 0;
      results.push({
        testName: 'buildErrorBasedGraph',
        passed: testPassed,
        message: testPassed
          ? `✅ Graph được tạo thành công với ${nodeCount} nodes và ${linkCount} links`
          : '❌ Graph không có nodes',
        data: {
          nodeCount,
          linkCount,
          errorTypeCount,
          trainingDataCount,
          challengeCount,
          errorTypes: graphData.errorSummary.errorTypes,
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'buildErrorBasedGraph',
        passed: false,
        message: `❌ Error: ${error.message}`,
      });
    }

    console.log();

    // 3. Test findTrainingDataForErrors
    console.log('🔍 Test 2: findTrainingDataForErrors');
    console.log('─'.repeat(50));
    try {
      const errorMessages = [
        'undefined is not defined',
        'Cannot read property',
        'syntax error',
        'TypeError',
      ];
      const errorTypes = ['runtime', 'syntax', 'logic'];

      const trainingData = await knowledgeGraphService.findTrainingDataForErrors(
        errorMessages,
        errorTypes,
        5
      );

      console.log(`   Found ${trainingData.length} training data items`);
      
      if (trainingData.length > 0) {
        console.log('   Top recommendations:');
        trainingData.slice(0, 3).forEach((td, index) => {
          console.log(`   ${index + 1}. ${td.question?.substring(0, 60)}...`);
          console.log(`      Category: ${td.category || 'N/A'}, Tags: ${td.tags?.join(', ') || 'N/A'}`);
        });
      } else {
        console.log('   ⚠️  Không tìm thấy training data - kiểm tra database');
      }

      results.push({
        testName: 'findTrainingDataForErrors',
        passed: trainingData.length > 0,
        message: trainingData.length > 0
          ? `✅ Tìm thấy ${trainingData.length} training data items`
          : '⚠️  Không tìm thấy training data liên quan',
        data: {
          count: trainingData.length,
          items: trainingData.slice(0, 3).map(td => ({
            question: td.question?.substring(0, 50),
            category: td.category,
            tags: td.tags,
          })),
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'findTrainingDataForErrors',
        passed: false,
        message: `❌ Error: ${error.message}`,
      });
    }

    console.log();

    // 4. Test với submissions cụ thể
    console.log('🔍 Test 3: Analyze Recent Error Submissions');
    console.log('─'.repeat(50));
    try {
      const recentSubmissions = await Submission.find({
        user: testUser._id,
        status: { $ne: 'Accepted' },
      })
        .sort({ submittedAt: -1 })
        .limit(10)
        .lean();

      console.log(`   Found ${recentSubmissions.length} recent error submissions`);

      const errorTypes: Record<string, number> = {};
      const errorMessages: string[] = [];
      let submissionWithAnalysis = 0;

      recentSubmissions.forEach((sub, index) => {
        console.log(`   Submission ${index + 1}:`);
        console.log(`      Status: ${sub.status}`);
        
        if (sub.aiAnalysis?.errorAnalyses && sub.aiAnalysis.errorAnalyses.length > 0) {
          submissionWithAnalysis++;
          console.log(`      Errors: ${sub.aiAnalysis.errorAnalyses.length}`);
          
          sub.aiAnalysis.errorAnalyses.forEach((error: any) => {
            errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1;
            if (error.errorMessage) {
              errorMessages.push(error.errorMessage);
            }
          });
        } else {
          console.log(`      ⚠️  No AI analysis found`);
        }
      });

      if (Object.keys(errorTypes).length > 0) {
        console.log(`   Error types distribution:`);
        Object.entries(errorTypes).forEach(([type, count]) => {
          console.log(`      - ${type}: ${count}`);
        });
      }

      results.push({
        testName: 'Analyze Recent Submissions',
        passed: recentSubmissions.length > 0,
        message: recentSubmissions.length > 0
          ? `✅ Phân tích ${recentSubmissions.length} submissions, ${submissionWithAnalysis} có AI analysis`
          : '⚠️  Không có error submissions',
        data: {
          submissionCount: recentSubmissions.length,
          submissionsWithAnalysis: submissionWithAnalysis,
          errorTypes,
          uniqueErrorMessages: [...new Set(errorMessages)].length,
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'Analyze Recent Submissions',
        passed: false,
        message: `❌ Error: ${error.message}`,
      });
    }

    console.log();

    // 5. Test với challenge cụ thể
    console.log('🔍 Test 4: Error-Based Graph with Specific Challenge');
    console.log('─'.repeat(50));
    try {
      const submissionWithChallenge = await Submission.findOne({
        user: testUser._id,
        status: { $ne: 'Accepted' },
        challenge: { $exists: true },
      }).lean();

      if (submissionWithChallenge && submissionWithChallenge.challenge) {
        const challengeId = typeof submissionWithChallenge.challenge === 'object'
          ? (submissionWithChallenge.challenge as any)._id.toString()
          : submissionWithChallenge.challenge.toString();

        console.log(`   Testing with challenge: ${challengeId}`);
        
        const graphData = await knowledgeGraphService.buildErrorBasedGraph(
          testUser._id.toString(),
          challengeId
        );

        console.log(`   Nodes: ${graphData.nodes.length}`);
        console.log(`   Error types: ${Object.keys(graphData.errorSummary.errorTypes).length}`);
        
        results.push({
          testName: 'Error-Based Graph with Challenge',
          passed: true,
          message: `✅ Graph được tạo thành công cho challenge cụ thể`,
          data: {
            challengeId,
            nodeCount: graphData.nodes.length,
          },
        });
      } else {
        console.log('   ⚠️  Không tìm thấy submission với challenge');
        results.push({
          testName: 'Error-Based Graph with Challenge',
          passed: false,
          message: '⚠️  Không có submission với challenge để test',
        });
      }
    } catch (error: any) {
      results.push({
        testName: 'Error-Based Graph with Challenge',
        passed: false,
        message: `❌ Error: ${error.message}`,
      });
    }

    console.log();

    // Print summary
    printResults(results);

  } catch (error: any) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
    results.push({
      testName: 'Overall Test',
      passed: false,
      message: `❌ Fatal error: ${error.message}`,
    });
    printResults(results);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

function printResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.testName}`);
    console.log(`   ${result.message}`);
    
    if (result.data && Object.keys(result.data).length > 0) {
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📈 Results: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('='.repeat(60));

  if (passed === total) {
    console.log('\n🎉 All tests passed! Knowledge Graph is fully integrated.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
  }
}

// Run tests
if (require.main === module) {
  testKnowledgeGraphChatbot()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testKnowledgeGraphChatbot };

