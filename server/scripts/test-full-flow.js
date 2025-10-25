const axios = require('axios');

async function testFullFlow() {
  try {
    console.log('🚀 Testing full flow from login to getting challenges...\n');
    
    // Step 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bughunter.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful');
    console.log(`   User: ${user.username} (${user.role})`);
    console.log(`   Token: ${token.substring(0, 30)}...\n`);
    
    // Step 2: Test public endpoint
    console.log('2️⃣ Testing public endpoint...');
    try {
      const publicResponse = await axios.get('http://localhost:5000/api/challenges');
      console.log('✅ Public endpoint works');
      console.log(`   Status: ${publicResponse.status}`);
      console.log(`   Challenges: ${publicResponse.data.data.challenges.length}`);
      console.log(`   First challenge: ${publicResponse.data.data.challenges[0]?.title || 'None'}\n`);
    } catch (error) {
      console.log('❌ Public endpoint failed:', error.response?.data?.message || error.message);
    }
    
    // Step 3: Test admin endpoint
    console.log('3️⃣ Testing admin endpoint...');
    try {
      const adminResponse = await axios.get('http://localhost:5000/api/challenges/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin endpoint works');
      console.log(`   Status: ${adminResponse.status}`);
      console.log(`   Total challenges: ${adminResponse.data.data.challenges.length}`);
      
      // Show all challenges
      console.log('\n📋 All challenges in database:');
      adminResponse.data.data.challenges.forEach((challenge, index) => {
        console.log(`   ${index + 1}. ${challenge.title}`);
        console.log(`      - Active: ${challenge.isActive}`);
        console.log(`      - Language: ${challenge.language}`);
        console.log(`      - Difficulty: ${challenge.difficulty}`);
        console.log(`      - Created: ${new Date(challenge.createdAt).toLocaleString()}`);
        console.log('');
      });
      
    } catch (error) {
      console.log('❌ Admin endpoint failed:', error.response?.data?.message || error.message);
      console.log(`   Status: ${error.response?.status}`);
    }
    
    // Step 4: Test scraping
    console.log('4️⃣ Testing scraping...');
    try {
      const scrapeResponse = await axios.post('http://localhost:5000/api/scraper/cses', {
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
      
      console.log('✅ Scraping successful');
      console.log(`   Message: ${scrapeResponse.data.message}`);
      console.log(`   Count: ${scrapeResponse.data.data.count}\n`);
      
    } catch (error) {
      console.log('❌ Scraping failed:', error.response?.data?.message || error.message);
      console.log(`   Status: ${error.response?.status}\n`);
    }
    
    // Step 5: Check challenges again
    console.log('5️⃣ Checking challenges after scraping...');
    try {
      const finalResponse = await axios.get('http://localhost:5000/api/challenges/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Final check successful');
      console.log(`   Total challenges now: ${finalResponse.data.data.challenges.length}`);
      
    } catch (error) {
      console.log('❌ Final check failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullFlow();
