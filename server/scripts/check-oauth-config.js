const config = require('dotenv').config();

console.log('=== OAuth Configuration Check ===\n');

const checks = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GITHUB_CLIENT_ID': process.env.GITHUB_CLIENT_ID,
    'GITHUB_CLIENT_SECRET': process.env.GITHUB_CLIENT_SECRET,
    'FACEBOOK_APP_ID': process.env.FACEBOOK_APP_ID,
    'FACEBOOK_APP_SECRET': process.env.FACEBOOK_APP_SECRET,
};

let allConfigured = true;

for (const [key, value] of Object.entries(checks)) {
    if (value) {
        console.log(`✅ ${key}: Configured (${value.substring(0, 10)}...)`);
    } else {
        console.log(`❌ ${key}: NOT CONFIGURED`);
        allConfigured = false;
    }
}

console.log('\n=== Summary ===');
if (allConfigured) {
    console.log('✅ All OAuth providers are configured!');
} else {
    console.log('❌ Some OAuth providers are missing configuration.');
    console.log('\nTo setup OAuth:');
    console.log('1. Create OAuth apps for Google, GitHub, Facebook');
    console.log('2. Add credentials to server/.env file');
    console.log('3. See OAUTH_SETUP_GUIDE.md for detailed instructions');
}

console.log('\n=== Callback URLs ===');
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${SERVER_URL}/api/auth/google/callback`;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || `${SERVER_URL}/api/auth/github/callback`;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || `${SERVER_URL}/api/auth/facebook/callback`;

console.log(`Google callback: ${GOOGLE_CALLBACK_URL}`);
console.log(`GitHub callback: ${GITHUB_CALLBACK_URL}`);
console.log(`Facebook callback: ${FACEBOOK_CALLBACK_URL}`);

console.log('\n💡 Make sure these URLs are added to your OAuth app settings!');

