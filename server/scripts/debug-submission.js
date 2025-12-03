/**
 * Debug Script để kiểm tra Judge0 và Submission Process
 * Chạy: node server/debug-submission.js
 */

require('dotenv').config({ path: '.env' });
const judge0Service = require('./src/services/judge0Service').default;

async function testJudge0Health() {
  console.log('\n=== 🔍 Testing Judge0 Health ===');
  try {
    const isHealthy = await judge0Service.checkHealth();
    if (isHealthy) {
      console.log('✅ Judge0 is available and healthy');
      return true;
    } else {
      console.log('❌ Judge0 is not available');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking Judge0 health:', error.message);
    return false;
  }
}

async function testSimpleSubmission() {
  console.log('\n=== 🧪 Testing Simple Code Submission ===');
  try {
    const result = await judge0Service.submitCode(
      'print("Hello World")',
      'Python',
      '',
      undefined,
      2,
      128
    );
    
    console.log('✅ Submission successful!');
    console.log('Status:', result.status);
    console.log('Stdout:', result.stdout);
    console.log('Stderr:', result.stderr);
    console.log('Time:', result.time, 's');
    console.log('Memory:', result.memory, 'KB');
    
    return result.status.id === 3; // 3 = Accepted
  } catch (error) {
    console.log('❌ Submission failed:', error.message);
    console.log('Error details:', error);
    return false;
  }
}

async function testMultipleTestCases() {
  console.log('\n=== 🧪 Testing Multiple Test Cases ===');
  try {
    const testCases = [
      { input: '1\n2', expectedOutput: '3' },
      { input: '5\n10', expectedOutput: '15' }
    ];
    
    const code = `a = int(input())
b = int(input())
print(a + b)`;
    
    const results = await judge0Service.runTestCases(
      code,
      'Python',
      testCases,
      2,
      128
    );
    
    console.log(`✅ Ran ${results.length} test cases`);
    results.forEach((result, idx) => {
      console.log(`\nTest Case ${idx + 1}:`);
      console.log('  Status:', result.status);
      console.log('  Passed:', result.passed);
      console.log('  Input:', result.input);
      console.log('  Expected:', result.expectedOutput);
      console.log('  Actual:', result.actualOutput);
      if (result.errorMessage) {
        console.log('  Error:', result.errorMessage);
      }
    });
    
    return results.every(r => r.passed);
  } catch (error) {
    console.log('❌ Multiple test cases failed:', error.message);
    return false;
  }
}

async function checkEnvironment() {
  console.log('\n=== 🔧 Checking Environment Variables ===');
  const required = [
    'JUDGE0_API_URL',
    'MONGODB_URI'
  ];
  
  const optional = [
    'JUDGE0_API_KEY',
    'GEMINI_API_KEY'
  ];
  
  console.log('\nRequired variables:');
  required.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`  ✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${key}: NOT SET`);
    }
  });
  
  console.log('\nOptional variables:');
  optional.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`  ✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ⚠️  ${key}: NOT SET (optional)`);
    }
  });
}

async function main() {
  console.log('🚀 Starting Debug Script...\n');
  
  // Check environment
  await checkEnvironment();
  
  // Test Judge0 health
  const isHealthy = await testJudge0Health();
  
  if (!isHealthy) {
    console.log('\n❌ Judge0 is not available. Please check:');
    console.log('  1. Is Judge0 running? (docker ps | grep judge0)');
    console.log('  2. Is JUDGE0_API_URL correct?');
    console.log('  3. Can you access Judge0 API? (curl http://localhost:2358/health)');
    process.exit(1);
  }
  
  // Test simple submission
  const simpleTest = await testSimpleSubmission();
  
  if (!simpleTest) {
    console.log('\n❌ Simple submission test failed. Judge0 may have issues.');
    process.exit(1);
  }
  
  // Test multiple test cases
  const multipleTest = await testMultipleTestCases();
  
  if (!multipleTest) {
    console.log('\n⚠️  Multiple test cases test failed, but Judge0 is working.');
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\nIf you still have issues with submission:');
  console.log('  1. Check server logs when submitting');
  console.log('  2. Check browser Network tab for request/response');
  console.log('  3. Check browser Console for JavaScript errors');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

