/**
 * Script test fallback execution
 * Chạy trực tiếp để kiểm tra fallback mechanism
 */

import mongoose from 'mongoose';
import judge0Service from '../src/services/judge0Service';
import Challenge from '../src/models/challenge.model';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testFallback() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doanchuyennganh';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Lấy challenge "Tìm số lớn nhất" hoặc challenge đầu tiên có test cases
    let challenge = await Challenge.findOne({
      title: { $regex: /Tìm số lớn nhất/i },
      isActive: true,
      language: 'Python',
      'testCases.0': { $exists: true }
    });
    
    if (!challenge) {
      challenge = await Challenge.findOne({
        isActive: true,
        language: 'Python',
        'testCases.0': { $exists: true }
      });
    }

    if (!challenge) {
      console.log('❌ Không tìm thấy challenge nào');
      return;
    }

    console.log('\n📋 Challenge:', challenge.title);
    console.log('📝 Language:', challenge.language);
    console.log('🧪 Test cases:', challenge.testCases.length);

    // Code đúng để test - dùng code phù hợp với challenge
    let testCode = `def find_max(a, b):
    if a > b:
        return a
    else:
        return b

a = int(input())
b = int(input())
print(find_max(a, b))`;
    
    // Nếu là challenge "Two Sum", dùng code khác
    if (challenge.title.includes('Two Sum')) {
      testCode = `def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

import json
nums = json.loads(input())
target = int(input())
result = twoSum(nums, target)
print(result[0] + result[1] if len(result) == 2 else 0)`;
    }

    console.log('\n🔍 Testing fallback execution...\n');

    // Test với test case đầu tiên
    const testCase = challenge.testCases[0];
    console.log('📥 Input:', testCase.input);
    console.log('📤 Expected:', testCase.expectedOutput);

    // Test fallback trực tiếp (cần access private method)
    const result = await (judge0Service as any).runCodeFallback(
      testCode,
      challenge.language,
      testCase.input,
      challenge.timeLimit || 2
    );

    console.log('\n📊 Fallback Result:');
    console.log('  stdout:', result.stdout);
    console.log('  stderr:', result.stderr);
    console.log('  executionTime:', result.executionTime, 'ms');

    // So sánh output
    const normalizedActual = result.stdout.trim();
    const normalizedExpected = testCase.expectedOutput.trim();
    const passed = normalizedActual === normalizedExpected;

    console.log('\n✅ So sánh:');
    console.log('  Actual:', normalizedActual);
    console.log('  Expected:', normalizedExpected);
    console.log('  Passed:', passed ? '✅' : '❌');

    // Test với tất cả test cases
    console.log('\n\n🧪 Testing với tất cả test cases...\n');
    const allResults = await judge0Service.runTestCases(
      testCode,
      challenge.language,
      challenge.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      })),
      challenge.timeLimit,
      challenge.memoryLimit
    );

    console.log('\n📊 Kết quả tất cả test cases:');
    allResults.forEach((result: any, index: number) => {
      console.log(`\n  Test case ${index + 1}:`);
      console.log('    Input:', result.input);
      console.log('    Expected:', result.expectedOutput);
      console.log('    Actual:', result.actualOutput);
      console.log('    Passed:', result.passed ? '✅' : '❌');
      console.log('    Status:', result.status);
      if (result.errorMessage) {
        console.log('    Error:', result.errorMessage);
      }
    });

    const passedCount = allResults.filter((r: any) => r.passed).length;
    const totalPoints = challenge.points;
    const score = Math.round((passedCount / allResults.length) * totalPoints);

    console.log('\n\n📊 Tổng kết:');
    console.log(`  Passed: ${passedCount}/${allResults.length}`);
    console.log(`  Score: ${score}/${totalPoints}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run test
testFallback();

