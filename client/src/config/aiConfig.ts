// Environment Configuration
// Lưu Gemini API Key và các config khác
// ===========================================

export const AI_CONFIG = {
  // Lấy API Key từ import.meta.env (Vite) thay vì process.env
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  GEMINI_MODEL: 'gemini-pro',
  
  // AI Settings
  AI_SETTINGS: {
    temperature: 0.7,
    maxOutputTokens: 1024,
    enableGemini: true,
    enableAdaptiveLearning: true,
    enableTrainingData: true,
    
    // Strategy ưu tiên
    strategy: 'hybrid' as const // 'hybrid' | 'adaptive_only' | 'gemini_only'
  },
  
  // Response Settings
  RESPONSE_CONFIG: {
    showSource: true, // Hiển thị nguồn trả lời (gemini/adaptive/training)
    showTokens: false, // Hiển thị số tokens (debug)
    showCost: false, // Hiển thị chi phí API (debug)
    maxRetries: 2 // Số lần retry nếu API fail
  },
  
  // Cache Settings
  CACHE_CONFIG: {
    enableCache: true,
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 giờ
    maxCacheSize: 100 // Tối đa 100 responses cached
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    enabled: true,
    requestsPerMinute: 30,
    requestsPerHour: 300
  }
}

/**
 * Cách thiết lập API Key:
 * 
 * OPTION 1: File .env.local (recommended)
 * =====================================
 * Tạo file: client/.env.local
 * 
 * REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
 * 
 * Thêm .env.local vào .gitignore:
 * *.env.local
 * *.env.*.local
 * 
 * 
 * OPTION 2: Environment Variables (production)
 * ============================================
 * Set trong server:
 * export REACT_APP_GEMINI_API_KEY="your_key"
 * 
 * Hoặc trong .env file:
 * REACT_APP_GEMINI_API_KEY=your_key
 * 
 * 
 * OPTION 3: Runtime Configuration
 * ===============================
 * Pass vào khi khởi tạo:
 * const gemini = new GeminiProAI({ apiKey: userProvidedKey })
 */

// ✅ Hàm validate config
export function validateAIConfig(): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (AI_CONFIG.AI_SETTINGS.enableGemini && !AI_CONFIG.GEMINI_API_KEY) {
    errors.push('❌ GEMINI_API_KEY không được set. Dùng .env.local hoặc environment variables')
  }

  if (AI_CONFIG.AI_SETTINGS.temperature < 0 || AI_CONFIG.AI_SETTINGS.temperature > 2) {
    errors.push('❌ Temperature phải từ 0 đến 2')
  }

  if (AI_CONFIG.AI_SETTINGS.maxOutputTokens < 1 || AI_CONFIG.AI_SETTINGS.maxOutputTokens > 8000) {
    errors.push('❌ maxOutputTokens phải từ 1 đến 8000')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ✅ Hàm kiểm tra config khi app start
export function initializeAIConfig(): void {
  const validation = validateAIConfig()

  if (!validation.valid) {
    console.warn('⚠️ AI Configuration Issues:')
    validation.errors.forEach(error => console.warn(error))
  } else {
    console.log('✅ AI Configuration is valid')
    console.log(`   - Gemini Enabled: ${AI_CONFIG.AI_SETTINGS.enableGemini}`)
    console.log(`   - Adaptive Learning: ${AI_CONFIG.AI_SETTINGS.enableAdaptiveLearning}`)
    console.log(`   - Strategy: ${AI_CONFIG.AI_SETTINGS.strategy}`)
  }
}

export default AI_CONFIG
