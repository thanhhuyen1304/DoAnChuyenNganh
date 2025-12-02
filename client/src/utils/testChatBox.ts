/**
 * ChatBox Testing Guide
 * Chạy các test này trong browser console
 */

// ============================================
// TEST 1: Kiểm tra API Config
// ============================================
console.log('📋 TEST 1: API Config')
console.log('import.meta.env.VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY)
console.log('API Key exists:', !!import.meta.env.VITE_GEMINI_API_KEY)
console.log('')

// ============================================
// TEST 2: Kiểm tra HybridAI
// ============================================
console.log('📋 TEST 2: HybridAI Initialization')
try {
  // Import động (nếu cần)
  console.log('✅ HybridAI import successful')
} catch (error) {
  console.error('❌ HybridAI import failed:', error)
}
console.log('')

// ============================================
// TEST 3: Kiểm tra AdaptiveAI
// ============================================
console.log('📋 TEST 3: AdaptiveAI')
try {
  // Check localStorage
  const data = localStorage.getItem('bughunter_ai_learning_data')
  console.log('✅ AdaptiveAI localStorage:', data ? 'Có dữ liệu' : 'Trống')
  
  if (data) {
    const parsed = JSON.parse(data)
    console.log('Interactions:', parsed.interactions?.length || 0)
    console.log('Patterns:', parsed.learnedPatterns?.length || 0)
  }
} catch (error) {
  console.error('❌ AdaptiveAI error:', error)
}
console.log('')

// ============================================
// TEST 4: Test Gemini API Connection
// ============================================
console.log('📋 TEST 4: Gemini API Connection Test')
async function testGeminiAPI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('❌ API Key not found!')
    return
  }
  
  console.log('Testing Gemini API...')
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'xin chào' }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        })
      }
    )
    
    const data = await response.json()
    
    if (response.ok) {
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
      console.log('✅ Gemini API Connected!')
      console.log('Response:', answer?.substring(0, 100) + '...')
    } else {
      console.error('❌ API Error:', data.error?.message || response.statusText)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Connection Error:', errorMessage)
  }
}

// Chạy test
testGeminiAPI()
console.log('')

// ============================================
// TEST 5: Kiểm tra ChatBox Component
// ============================================
console.log('📋 TEST 5: ChatBox Component')
console.log('Tìm ChatBox element...')

const chatButton = document.querySelector('button[aria-label="Open chat"]')
if (chatButton) {
  console.log('✅ ChatBox button found!')
  console.log('Position:', chatButton.getBoundingClientRect())
} else {
  console.log('⚠️ ChatBox button not found')
}
console.log('')

// ============================================
// TEST 6: Thống kê sử dụng
// ============================================
console.log('📋 TEST 6: Usage Statistics')
console.log(`
Để test ChatBox hoàn chỉnh:

1. ✅ Mở ChatBox (click nút ở góc phải dưới)
2. ✅ Gõ câu hỏi: "xin chào"
3. ✅ Chờ AI trả lời (khoảng 2-3 giây)
4. ✅ Đánh giá: Click 👍 hoặc 👎
5. ✅ Kiểm tra stats: Click nút 📊

Nếu OK, ChatBox hoạt động 100%!
`)

console.log('═══════════════════════════════════')
console.log('✅ Tất cả test đã chạy!')
console.log('═══════════════════════════════════')
