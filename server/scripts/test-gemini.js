#!/usr/bin/env node

/**
 * Test Gemini Pro API Connection
 * Chạy: node test-gemini.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testGeminiAPI(apiKey) {
  console.log('\n🔍 Testing Gemini Pro API Connection...\n');

  try {
    // Test 1: Simple message
    console.log('📝 Test 1: Simple message...');
    const response1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'xin chào, tôi là ai?' }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response1.ok) {
      console.log(`❌ Test 1 Failed: ${response1.status} ${response1.statusText}`);
      const error = await response1.json();
      console.log('Error:', error);
      return false;
    }

    const data1 = await response1.json();
    const answer1 = data1.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('✅ Test 1 Passed!');
    console.log('Response:', answer1?.substring(0, 100) + '...\n');

    // Test 2: Vietnamese question
    console.log('📝 Test 2: Vietnamese programming question...');
    const response2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'làm sao để debug lỗi undefined trong JavaScript?' }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response2.ok) {
      console.log(`❌ Test 2 Failed: ${response2.status} ${response2.statusText}`);
      const error = await response2.json();
      console.log('Error:', error);
      return false;
    }

    const data2 = await response2.json();
    const answer2 = data2.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('✅ Test 2 Passed!');
    console.log('Response:', answer2?.substring(0, 150) + '...\n');

    // Test 3: Code generation
    console.log('📝 Test 3: Code generation...');
    const response3 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'viết hàm JavaScript để check xem một số là số nguyên tố' }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response3.ok) {
      console.log(`❌ Test 3 Failed: ${response3.status} ${response3.statusText}`);
      const error = await response3.json();
      console.log('Error:', error);
      return false;
    }

    const data3 = await response3.json();
    const answer3 = data3.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('✅ Test 3 Passed!');
    console.log('Response:', answer3?.substring(0, 150) + '...\n');

    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED! Gemini Pro is ready to use.');
    console.log('═══════════════════════════════════════\n');

    console.log('📋 Next steps:');
    console.log('1. Create client/.env.local file');
    console.log(`2. Add: REACT_APP_GEMINI_API_KEY=${apiKey.substring(0, 20)}...`);
    console.log('3. Restart dev server: npm run dev');
    console.log('4. Open ChatBox in browser and start chatting!\n');

    return true;
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Google Gemini Pro API Test Tool    ║');
  console.log('║   For BugHunter ChatBox              ║');
  console.log('╚════════════════════════════════════════╝\n');

  const apiKey = await askQuestion('🔑 Enter your Gemini API Key: ');

  if (!apiKey || apiKey.trim() === '') {
    console.log('\n❌ API Key is required!');
    process.exit(1);
  }

  const success = await testGeminiAPI(apiKey.trim());

  if (!success) {
    console.log('\n❌ Tests failed. Please check:');
    console.log('1. API key is correct');
    console.log('2. Gemini API is enabled in Cloud Console');
    console.log('3. Billing is set up');
    console.log('4. Network connection is working');
  }

  rl.close();
}

main();
