import axios from 'axios';
import { config } from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY không được cấu hình');
  process.exit(1);
}

async function listModels(version: string) {
  const url = `https://generativelanguage.googleapis.com/${version}/models?key=${GEMINI_API_KEY}`;
  
  try {
    console.log(`\n📋 Listing models for ${version}...`);
    const response = await axios.get(url);
    const models = response.data?.models || [];
    
    console.log(`✅ Found ${models.length} models:`);
    models.forEach((model: any) => {
      const supportedMethods = model.supportedGenerationMethods || [];
      if (supportedMethods.includes('generateContent')) {
        console.log(`  ✅ ${model.name} - supports generateContent`);
      }
    });
    
    return models.filter((m: any) => 
      (m.supportedGenerationMethods || []).includes('generateContent')
    );
  } catch (error: any) {
    console.error(`❌ Error listing ${version}:`, error?.response?.data?.error?.message);
    return [];
  }
}

async function testModel(version: string, modelName: string) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Hello' }]
      }
    ]
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    return response.status === 200;
  } catch (error: any) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking available Gemini models...\n');
  
  // Try v1 first
  const v1Models = await listModels('v1');
  
  // Try v1beta
  const v1betaModels = await listModels('v1beta');
  
  // Test common model names
  console.log('\n🧪 Testing common model names:');
  const testModels = [
    { name: 'gemini-1.5-flash', version: 'v1' },
    { name: 'gemini-1.5-flash-latest', version: 'v1' },
    { name: 'gemini-pro', version: 'v1beta' },
    { name: 'gemini-1.0-pro', version: 'v1' },
  ];
  
  for (const test of testModels) {
    const works = await testModel(test.version, test.name);
    if (works) {
      console.log(`  ✅ ${test.name} (${test.version}) - WORKS!`);
    } else {
      console.log(`  ❌ ${test.name} (${test.version}) - FAILED`);
    }
  }
}

main().catch(console.error);

