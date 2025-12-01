import express from 'express';
import judge0Service from '../services/judge0Service';
import { config } from 'dotenv';

// Load environment variables
config();

const ENV = {
  JUDGE0_API_URL: process.env.JUDGE0_API_URL,
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MONGODB_URI: process.env.MONGODB_URI
};

const router = express.Router();

// Debug endpoint - không cần authentication để dễ test
router.get('/test/judge0', async (req, res) => {
  try {
    console.log('🔍 Testing Judge0 connection...');
    const isHealthy = await judge0Service.checkHealth();
    
    if (!isHealthy) {
      return res.json({
        success: false,
        message: 'Judge0 không available',
        details: {
          apiUrl: ENV.JUDGE0_API_URL,
          apiKey: ENV.JUDGE0_API_KEY ? 'Set' : 'Not set'
        }
      });
    }

    // Test simple submission
    try {
      const result = await judge0Service.submitCode({
        code: 'print("Hello World")',
        language: 'Python',
        input: '',
        expectedOutput: undefined,
        timeLimit: 2,
        memoryLimit: 128
      });

      return res.json({
        success: true,
        message: 'Judge0 is working',
        details: {
          apiUrl: ENV.JUDGE0_API_URL,
          testResult: {
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            time: result.time,
            memory: result.memory
          }
        }
      });
    } catch (error: any) {
      return res.json({
        success: false,
        message: 'Judge0 health check passed but submission failed',
        error: error.message,
        details: {
          apiUrl: ENV.JUDGE0_API_URL
        }
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error testing Judge0',
      error: error.message
    });
  }
});

router.get('/test/env', (req, res) => {
  res.json({
    success: true,
    env: {
      JUDGE0_API_URL: ENV.JUDGE0_API_URL || 'Not set',
      JUDGE0_API_KEY: ENV.JUDGE0_API_KEY ? 'Set' : 'Not set',
      GEMINI_API_KEY: ENV.GEMINI_API_KEY ? 'Set' : 'Not set',
      MONGODB_URI: ENV.MONGODB_URI ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });
});

export default router;

