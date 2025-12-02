import axios from 'axios';
import { config } from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY không được cấu hình trong .env');
  process.exit(1);
}

console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 10) + '...');
console.log('');

async function testGeminiAPI() {
  const models = [
    { name: 'gemini-2.5-flash', version: 'v1beta' },
    { name: 'gemini-2.0-flash', version: 'v1beta' },
    { name: 'gemini-flash-latest', version: 'v1beta' }
  ];

  for (const modelConfig of models) {
    const { name: model, version } = modelConfig;
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log(`\n🧪 Testing model: ${model} (${version})`);
    console.log(`📡 URL: ${url.substring(0, 80)}...`);
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Xin chào! Hãy giới thiệu về bạn.' }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    };

    try {
      console.log('📤 Sending request...');
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      console.log(`✅ Status: ${response.status}`);
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`✅ Response: ${text.substring(0, 100)}...`);
        console.log(`\n🎉 Model ${model} hoạt động tốt!`);
        return true;
      } else {
        console.log('⚠️ No text in response');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      }
    } catch (error: any) {
      console.error(`❌ Error with model ${model}:`);
      console.error('Status:', error?.response?.status);
      console.error('Status Text:', error?.response?.statusText);
      console.error('Error Message:', error?.response?.data?.error?.message);
      console.error('Error Code:', error?.response?.data?.error?.code);
      console.error('Full Error:', JSON.stringify(error?.response?.data, null, 2));
    }
  }

  return false;
}

testGeminiAPI()
  .then(success => {
    if (success) {
      console.log('\n✅ Test thành công!');
      process.exit(0);
    } else {
      console.log('\n❌ Tất cả models đều fail. Vui lòng kiểm tra API key và quyền truy cập.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

