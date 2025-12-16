const axios = require('axios');

async function testScraper() {
  try {
    console.log('🚀 Testing scraper endpoints...\n');
    
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    // Backend /auth/login yêu cầu field "identifier" (email hoặc username)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'admin@bughunter.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 30)}...\n`);
    
    // Step 2: Test CSES scraper
    console.log('2️⃣ Testing CSES scraper...');
    try {
      const csesResponse = await axios.post('http://localhost:5000/api/scraper/cses', {
        classification: {
          language: 'C++',
          difficulty: 'Medium',
          category: 'Logic',
          points: 25
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ CSES scraper response:');
      console.log(`   Status: ${csesResponse.status}`);
      console.log(`   Success: ${csesResponse.data.success}`);
      console.log(`   Message: ${csesResponse.data.message}`);
      console.log(`   Count: ${csesResponse.data.data?.count || 0}\n`);
      
    } catch (error) {
      console.log('❌ CSES scraper failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }
    
    // Step 3: Test AtCoder scraper
    console.log('3️⃣ Testing AtCoder scraper...');
    try {
      const atcoderResponse = await axios.post('http://localhost:5000/api/scraper/atcoder', {
        classification: {
          language: 'C++',
          difficulty: 'Medium',
          category: 'Logic',
          points: 25
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ AtCoder scraper response:');
      console.log(`   Status: ${atcoderResponse.status}`);
      console.log(`   Success: ${atcoderResponse.data.success}`);
      console.log(`   Message: ${atcoderResponse.data.message}`);
      console.log(`   Count: ${atcoderResponse.data.data?.count || 0}\n`);
      
    } catch (error) {
      console.log('❌ AtCoder scraper failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }
    
    // Step 4: Test LeetCode scraper
    console.log('4️⃣ Testing LeetCode scraper...');
    try {
      const leetcodeResponse = await axios.post('http://localhost:5000/api/scraper/leetcode', {
        classification: {
          language: 'JavaScript',
          difficulty: 'Medium',
          category: 'Logic',
          points: 25
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ LeetCode scraper response:');
      console.log(`   Status: ${leetcodeResponse.status}`);
      console.log(`   Success: ${leetcodeResponse.data.success}`);
      console.log(`   Message: ${leetcodeResponse.data.message}`);
      console.log(`   Count: ${leetcodeResponse.data.data?.count || 0}\n`);
      
    } catch (error) {
      console.log('❌ LeetCode scraper failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }
    
    // Step 5: Check total challenges after scraping
    console.log('5️⃣ Checking total challenges after scraping...');
    try {
      const challengesResponse = await axios.get('http://localhost:5000/api/challenges/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Current challenges:');
      console.log(`   Total: ${challengesResponse.data.data.challenges.length}`);
      
      // Show recent challenges
      const recentChallenges = challengesResponse.data.data.challenges
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      console.log('\n📋 Most recent challenges:');
      recentChallenges.forEach((challenge, index) => {
        console.log(`   ${index + 1}. ${challenge.title} (${challenge.language}) - ${new Date(challenge.createdAt).toLocaleString()}`);
      });
      
    } catch (error) {
      console.log('❌ Failed to check challenges:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScraper();
