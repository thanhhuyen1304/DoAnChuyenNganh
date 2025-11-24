// Gemini Pro AI Integration
// Tích hợp Google Gemini Pro vào ChatBox
// ==========================================

interface GeminiConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

interface GeminiMessage {
  role: 'user' | 'model'
  parts: string
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
      role: string
    }
    finishReason: string
  }>
}

export class GeminiProAI {
  private apiKey: string
  private model: string
  private temperature: number
  private maxOutputTokens: number
  private conversationHistory: GeminiMessage[] = []
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API Key is required')
    }

    this.apiKey = config.apiKey
    this.model = config.model || 'gemini-1.5-flash'
    this.temperature = config.temperature ?? 0.7
    this.maxOutputTokens = config.maxOutputTokens ?? 2048
  }

  /**
   * Tạo system prompt cho Vietnamese BugHunter ChatBox
   */
  private getSystemPrompt(): string {
    return `Bạn là một trợ lý AI thông minh cho nền tảng BugHunter - một website giải quyết các bài tập lập trình.

Đặc điểm của bạn:
- Luôn trả lời bằng tiếng Việt tự nhiên và thân thiện
- Chuyên sâu về lập trình (Python, JavaScript, Java, C++, v.v.)
- Giúp debug code, giải thích lỗi, và đưa ra mẹo lập trình
- Hiểu về các chủ đề: algorithm, data structure, OOP, web development
- Tính cách: thân thiện, kiên nhẫn, giáo dục
- Luôn cố gắng hiểu ngữ cảnh từ các câu hỏi trước

Khi trả lời:
1. Nếu là câu hỏi về debug: Hãy đưa ra nguyên nhân có thể và cách fix
2. Nếu là câu hỏi về học: Giải thích chi tiết, có ví dụ code
3. Nếu là câu hỏi mơ hồ: Hãy hỏi lại để hiểu rõ hơn
4. Luôn giúp người dùng hiểu, không chỉ cho code sẵn
5. Nếu không biết: Thành thật nói là không biết, đừng bịa

Format trả lời:
- Ngắn gọn (1-3 đoạn) trừ khi cần chi tiết
- Dùng markdown nếu có code (với language tag)
- Dùng emoji phù hợp để làm cho chat vui hơn
- Nếu có code: cung cấp code snippet + giải thích

Ví dụ:
Câu hỏi: "tôi gặp lỗi undefined"
Trả lời: "Lỗi undefined thường xảy ra khi:
1. Biến chưa được khai báo
2. Hàm trả về undefined
3. Object property không tồn tại

Bạn có thể share code để tôi giúp xác định nguyên nhân? 🔍"`
  }

  /**
   * Gửi tin nhắn đến Gemini Pro
   */
  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Thêm user message vào history
      this.conversationHistory.push({
        role: 'user',
        parts: userMessage
      })

      // Prepare messages cho API
      const messages = this.conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      }))

      // Thêm system prompt vào đầu
      const systemPrompt = this.getSystemPrompt()

      // Gọi Gemini API
      const response = await fetch(
        `${this.API_URL}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: messages,
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: this.maxOutputTokens,
              topP: 0.95,
              topK: 40
            }
          })
        }
      )

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${text}`)
      }

      const data: GeminiResponse = await response.json()

      // Trích xuất response text
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không thể trả lời bây giờ'

      // Thêm AI response vào history
      this.conversationHistory.push({
        role: 'model',
        parts: aiResponse
      })

      // Giữ lịch sử conversation tối đa 20 messages
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }

      return aiResponse
    } catch (error) {
      console.error('Gemini AI Error:', error)
      throw error
    }
  }

  /**
   * Xóa lịch sử conversation
   */
  clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * Lấy lịch sử conversation
   */
  getHistory(): GeminiMessage[] {
    return [...this.conversationHistory]
  }

  /**
   * Đếm tokens (ước tính)
   */
  estimateTokens(text: string): number {
    // Ước tính: 1 token ≈ 4 ký tự
    return Math.ceil(text.length / 4)
  }

  /**
   * Kiểm tra connection (test API)
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_URL}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'xin chào' }]
              }
            ]
          })
        }
      )

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.error(`Gemini connection test failed: ${response.status} ${response.statusText} - ${text}`)
        return false
      }

      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}

/**
 * Hybrid AI: Kết hợp Gemini + Adaptive Learning
 * ============================================
 * - Dùng Gemini để trả lời câu hỏi phức tạp
 * - Lưu kết quả vào adaptive learning
 * - Tối ưu hóa chi phí API
 */

export class HybridAI {
  private geminiAI: GeminiProAI | null = null
  private useGemini: boolean = true
  private geminiCost: number = 0 // Tracking chi phí

  constructor(geminiApiKey?: string) {
    if (geminiApiKey) {
      try {
        this.geminiAI = new GeminiProAI({
          apiKey: geminiApiKey,
          temperature: 0.7,
          maxOutputTokens: 1024
        })
      } catch (error) {
        console.warn('Gemini initialization failed:', error)
        this.useGemini = false
      }
    }
  }

  /**
   * Tạo response với hybrid strategy
   * ==============================
   * Priority:
   * 1. Adaptive Learning (nhanh, free)
   * 2. Static Training Data (nhanh, free)
   * 3. Gemini Pro (slow, paid) - chỉ dùng khi cần
   */
  async generateHybridResponse(
    question: string,
    adaptiveAIResponse?: string,
    trainingDataResponse?: string
  ): Promise<{ answer: string; source: 'adaptive' | 'training' | 'gemini' }> {
    // Ưu tiên 1: Nếu adaptive learning có answer + confidence cao → dùng adaptive
    if (adaptiveAIResponse && this.shouldUseQuick(question)) {
      return {
        answer: adaptiveAIResponse,
        source: 'adaptive'
      }
    }

    // Ưu tiên 2: Nếu training data có answer → dùng training
    if (trainingDataResponse && this.shouldUseQuick(question)) {
      return {
        answer: trainingDataResponse,
        source: 'training'
      }
    }

    // Ưu tiên 3: Dùng Gemini Pro cho câu hỏi phức tạp
    if (this.useGemini && this.geminiAI) {
      try {
        const geminiResponse = await this.geminiAI.sendMessage(question)

        // Tracking chi phí
        const estimatedCost = this.calculateCost(question, geminiResponse)
        this.geminiCost += estimatedCost

        return {
          answer: geminiResponse,
          source: 'gemini'
        }
      } catch (error) {
        console.error('Gemini failed, fallback to training data:', error)
        return {
          answer: trainingDataResponse || 'Xin lỗi, tôi gặp vấn đề. Bạn có thể cụ thể hóa thêm không?',
          source: 'training'
        }
      }
    }

    // Fallback: Trả lời mặc định
    return {
      answer: trainingDataResponse || 'Tôi chưa có câu trả lời cho câu hỏi này. Bạn có thể chi tiết hơn không?',
      source: 'training'
    }
  }

  /**
   * Quyết định có nên dùng quick response (adaptive/training) không
   */
  private shouldUseQuick(question: string): boolean {
    // Những câu hỏi ngắn, đơn giản có thể dùng quick response
    const quickKeywords = ['gì', 'nào', 'sao', 'ai', 'đâu', 'khi nào', 'như thế nào']
    const isSimple = question.length < 50
    const hasQuickKeyword = quickKeywords.some(kw => question.includes(kw))

    return isSimple || hasQuickKeyword
  }

  /**
   * Tính chi phí API
   * Gemini Pro: $0.5 per 1M input tokens, $1.5 per 1M output tokens
   */
  private calculateCost(input: string, output: string): number {
    const geminiAI = this.geminiAI!
    const inputTokens = geminiAI.estimateTokens(input)
    const outputTokens = geminiAI.estimateTokens(output)

    const inputCost = (inputTokens / 1000000) * 0.5
    const outputCost = (outputTokens / 1000000) * 1.5

    return inputCost + outputCost
  }

  /**
   * Lấy tổng chi phí API
   */
  getTotalCost(): number {
    return this.geminiCost
  }

  /**
   * Reset chi phí (debug)
   */
  resetCost(): void {
    this.geminiCost = 0
  }

  /**
   * Kiểm tra Gemini connection
   */
  async testGemini(): Promise<boolean> {
    if (!this.geminiAI) return false
    return this.geminiAI.testConnection()
  }
}

export default GeminiProAI
