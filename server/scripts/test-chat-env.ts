import { config } from 'dotenv';
import path from 'path';

// Load .env file
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

console.log('=== Testing Chat Environment Variables ===');
console.log(`Loading .env from: ${envPath}`);
console.log('');
console.log('Environment Variables:');
console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER || 'NOT SET'}`);
console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET (' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
console.log('');

if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY is configured');
} else {
  console.log('❌ GEMINI_API_KEY is NOT configured');
}

if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
  console.log('✅ Chat should work with Gemini');
} else if (process.env.AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
  console.log('✅ Chat should work with OpenAI');
} else {
  console.log('❌ Chat will NOT work - no AI provider configured');
}

