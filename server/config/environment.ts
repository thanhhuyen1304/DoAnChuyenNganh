import { config } from 'dotenv';

// Load environment variables
config();

export const ENV = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  
  // Client Configuration
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Judge0 API
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
  
  // AI Provider Configuration
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini', // 'gemini' | 'openai'
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // External Knowledge APIs
  GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID || '',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  EXTERNAL_RESOURCE_CACHE_TTL: Number(process.env.EXTERNAL_RESOURCE_CACHE_TTL || 900), // seconds
  EXTERNAL_RESOURCE_LIMIT: Number(process.env.EXTERNAL_RESOURCE_LIMIT || 8),
  
  // Admin Configuration
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com',
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && ENV[envVar as keyof typeof ENV] === '') {
    console.warn(`Warning: ${envVar} is not set. Using default value.`);
  }
}
