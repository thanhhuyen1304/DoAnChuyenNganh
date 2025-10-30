require('dotenv').config();
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

console.log('=== Testing OAuth Configuration ===\n');

// Test 1: Check Environment Variables
console.log('1. Checking Environment Variables:');
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || clientId.includes('your_googl')) {
    console.log('   ❌ GOOGLE_CLIENT_ID: NOT SET or PLACEHOLDER');
    console.log('   → Need to set real client ID in .env file');
} else {
    console.log(`   ✅ GOOGLE_CLIENT_ID: ${clientId.substring(0, 20)}...`);
}

if (!clientSecret || clientSecret.includes('your_googl')) {
    console.log('   ❌ GOOGLE_CLIENT_SECRET: NOT SET or PLACEHOLDER');
    console.log('   → Need to set real client secret in .env file');
} else {
    console.log(`   ✅ GOOGLE_CLIENT_SECRET: ${clientSecret.substring(0, 10)}...`);
}

// Test 2: Check Callback URL
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const callbackURL = `${SERVER_URL}/api/auth/google/callback`;
console.log('\n2. Callback URL Configuration:');
console.log(`   SERVER_URL: ${SERVER_URL}`);
console.log(`   Callback URL: ${callbackURL}`);
console.log('\n   ⚠️  Make sure this EXACT URL is in your Google Console:');
console.log(`   → https://console.cloud.google.com/apis/credentials`);
console.log(`   → Click on your OAuth Client`);
console.log(`   → Under "Authorized redirect URIs"`);
console.log(`   → Should have: ${callbackURL}`);

// Test 3: Expected OAuth Flow
console.log('\n3. Expected OAuth Flow:');
console.log('   1. User clicks "Đăng nhập với Google"');
console.log('   2. Frontend redirects to: http://localhost:5000/api/auth/google');
console.log('   3. Backend redirects to: https://accounts.google.com/o/oauth2/v2/auth?...');
console.log('   4. User logs in with Google');
console.log('   5. Google redirects back to: ' + callbackURL);
console.log('   6. Backend processes callback and generates JWT');
console.log('   7. Backend redirects to frontend with token');

// Test 4: Verification Steps
console.log('\n4. Verification Steps:');
console.log('   □ Backend is running on port 5000');
console.log('   □ Frontend is running on port 3000');
console.log('   □ MongoDB is running');
console.log('   □ Google OAuth app exists in Google Console');
console.log('   □ Callback URL added in Google Console');
console.log('   □ .env file has real credentials (not placeholder)');

// Test 5: Manual Test URLs
console.log('\n5. Manual Test URLs:');
console.log('   Test backend OAuth endpoint:');
console.log(`   → http://localhost:5000/api/auth/google`);
console.log('\n   This should redirect you to Google login page.');
console.log('   If it doesn\'t redirect, there\'s a problem with backend config.');

// Test 6: Next Steps
console.log('\n=== Next Steps ===');
console.log('\nIf you see errors above, fix them first.');
console.log('\nThen test OAuth by:');
console.log('1. Open: http://localhost:5000/api/auth/google');
console.log('2. Should redirect to Google login');
console.log('3. After login, should redirect back to your app');
console.log('\nIf still not working, check TROUBLESHOOTING_OAUTH.md');

