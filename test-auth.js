const axios = require('axios');

// Test authentication endpoint
async function testAuth() {
  try {
    console.log('1. Testing login...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'admin@bughunter.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful! Token:', token.substring(0, 20) + '...');
      
      // Test PvP rooms with token
      console.log('2. Testing PvP rooms endpoint...');
      
      const roomsResponse = await axios.get('http://localhost:5000/api/pvp/rooms?limit=20&offset=0', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ PvP rooms endpoint successful!');
      console.log('Rooms data:', roomsResponse.data);
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testAuth();
