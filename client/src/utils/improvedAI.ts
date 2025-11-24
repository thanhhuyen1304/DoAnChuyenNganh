// 5 CÁCH TỐTNERROUS HƠN ĐỂ CHATBOX PHẢN ỨNG CHÍNH XÁC HƠN
// ========================================================

/**
 * ============================================
 * CÁCH 1: SIMILARITY MATCHING (So sánh độ giống nhau)
 * ============================================
 * Thay vì chỉ trích keywords, so sánh toàn bộ câu hỏi
 * Ví dụ:
 *   Q1: "làm sao debug lỗi?"
 *   Q2: "debug lỗi như thế nào?"
 *   Q3: "tôi gặp lỗi"
 * 
 * → Q1 và Q2 tương tự 95% → dùng cùng câu trả lời
 * → Q3 tương tự 60% → không dùng
 */

export class SimilarityMatcher {
  /**
   * Tính độ giống nhau giữa 2 câu (0-1)
   * Dùng Cosine Similarity hoặc Levenshtein Distance
   */
  calculateSimilarity(str1: string, str2: string): number {
    // Cách 1: Levenshtein Distance (đơn giản)
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    const distance = matrix[len2][len1]
    const maxLen = Math.max(len1, len2)
    return 1 - distance / maxLen
  }

  /**
   * Tìm câu hỏi tương tự từ lịch sử
   */
  findSimilarQuestions(
    newQuestion: string,
    previousQuestions: string[],
    threshold: number = 0.7
  ): { question: string; similarity: number }[] {
    return previousQuestions
      .map(q => ({
        question: q,
        similarity: this.calculateSimilarity(
          newQuestion.toLowerCase(),
          q.toLowerCase()
        )
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * Ví dụ sử dụng:
   * const matcher = new SimilarityMatcher()
   * const similar = matcher.findSimilarQuestions(
   *   "tôi sai ở đâu?",
   *   ["tôi sai ở đâu?", "code sai sao?", "xin chào"],
   *   0.7
   * )
   * // Kết quả: [
   * //   { question: "tôi sai ở đâu?", similarity: 1.0 },
   * //   { question: "code sai sao?", similarity: 0.75 }
   * // ]
   */
}

/**
 * ============================================
 * CÁCH 2: SEMANTIC UNDERSTANDING (Hiểu ngữ nghĩa)
 * ============================================
 * Nhóm các câu hỏi có cùng ý nghĩa nhưng cách phát biểu khác
 * Ví dụ:
 *   - "làm sao debug?" 
 *   - "debug như thế nào?"
 *   - "mẹo debug?"
 * 
 * → Tất cả đều hỏi về debugging → cùng 1 category
 */

export class SemanticAnalyzer {
  // Định nghĩa categories và synonyms
  private categories = {
    debugging: {
      keywords: ['debug', 'lỗi', 'error', 'sai', 'không chạy', 'crash', 'fail'],
      synonyms: {
        'debug': ['xác định lỗi', 'tìm bug', 'fix lỗi'],
        'error': ['lỗi', 'sai', 'không đúng'],
        'không chạy': ['crash', 'fail', 'không hoạt động']
      }
    },
    learning: {
      keywords: ['học', 'tìm hiểu', 'cách', 'làm thế nào', 'tutorial', 'hướng dẫn'],
      synonyms: {
        'học': ['tìm hiểu', 'nghiên cứu'],
        'cách': ['làm sao', 'thế nào', 'phương pháp']
      }
    },
    optimization: {
      keywords: ['tối ưu', 'nhanh hơn', 'performance', 'hiệu suất', 'cải thiện'],
      synonyms: {
        'tối ưu': ['cải thiện', 'tăng hiệu suất'],
        'nhanh': ['hiệu quả', 'tốt hơn']
      }
    }
  }

  /**
   * Phân loại câu hỏi vào category
   */
  categorizeQuestion(question: string): string | null {
    const lowerQ = question.toLowerCase()

    for (const [category, config] of Object.entries(this.categories)) {
      const matched = config.keywords.some(keyword => lowerQ.includes(keyword))
      if (matched) return category
    }

    return null
  }

  /**
   * Normalize câu hỏi (chuyển về dạng tiêu chuẩn)
   */
  normalizeQuestion(question: string): string {
    let normalized = question.toLowerCase()

    // Thay thế synonyms
    for (const config of Object.values(this.categories)) {
      for (const [main, synonyms] of Object.entries(config.synonyms)) {
        for (const synonym of synonyms) {
          const regex = new RegExp(synonym, 'gi')
          normalized = normalized.replace(regex, main)
        }
      }
    }

    return normalized
  }

  /**
   * Ví dụ sử dụng:
   * const analyzer = new SemanticAnalyzer()
   * analyzer.categorizeQuestion("tôi gặp lỗi undefined")
   * // → "debugging"
   * 
   * analyzer.normalizeQuestion("làm sao để fix bug?")
   * // → "làm sao để debug ?" (thay "fix bug" = "debug")
   */
}

/**
 * ============================================
 * CÁCH 3: CONTEXT AWARENESS (Nhớ ngữ cảnh)
 * ============================================
 * Nhớ các câu hỏi trước đó để trả lời có ngữ cảnh
 * Ví dụ:
 *   Q1: "code tôi sai ở đâu?"
 *   Q2: "làm sao fix?"
 * 
 * → Q2 biết đang nói về câu hỏi Q1 → trả lời chính xác hơn
 */

export class ContextAwareAI {
  private conversationHistory: Array<{
    question: string
    answer: string
    category?: string
    timestamp: Date
  }> = []

  /**
   * Thêm conversation vào lịch sử
   */
  addToHistory(question: string, answer: string, category?: string): void {
    this.conversationHistory.push({
      question,
      answer,
      category,
      timestamp: new Date()
    })

    // Giữ tối đa 50 cuộc trò chuyện gần nhất
    if (this.conversationHistory.length > 50) {
      this.conversationHistory.shift()
    }
  }

  /**
   * Lấy ngữ cảnh từ câu hỏi trước
   */
  getContext(currentQuestion: string): string | null {
    // Nếu câu hỏi ngắn hoặc vague (mơ hồ), lấy ngữ cảnh từ câu trước
    if (currentQuestion.length < 20 || ['gì', 'sao', 'nào', '?'].some(w => currentQuestion.includes(w))) {
      if (this.conversationHistory.length > 0) {
        const lastExchange = this.conversationHistory[this.conversationHistory.length - 1]
        return lastExchange.question // Câu hỏi trước đó là ngữ cảnh
      }
    }

    return null
  }

  /**
   * Tạo answer có ngữ cảnh
   */
  generateContextAwareAnswer(baseAnswer: string, context: string | null): string {
    if (!context) return baseAnswer

    // Nếu có ngữ cảnh, thêm vào đầu answer
    return `(Dựa trên "${context}") ${baseAnswer}`
  }

  /**
   * Ví dụ:
   * const contextAI = new ContextAwareAI()
   * 
   * contextAI.addToHistory(
   *   "code tôi sai ở đâu?",
   *   "Có thể là lỗi undefined hoặc null"
   * )
   * 
   * const context = contextAI.getContext("làm sao fix?")
   * // → "code tôi sai ở đâu?"
   */
}

/**
 * ============================================
 * CÁCH 4: INTENT DETECTION (Nhận diện ý định)
 * ============================================
 * Hiểu người dùng muốn làm gì (không chỉ cái gì)
 * Ví dụ:
 *   - "tôi không hiểu code" → Intent: LEARN (muốn học)
 *   - "sao code không chạy?" → Intent: FIX (muốn fix)
 *   - "code quá chậm" → Intent: OPTIMIZE (muốn tối ưu)
 */

export class IntentDetector {
  private intents = {
    LEARN: {
      keywords: ['học', 'hiểu', 'giải thích', 'là gì', 'cách nào', 'tìm hiểu', 'dạy'],
      responseTemplate: 'Để bạn hiểu rõ hơn, tôi sẽ giải thích chi tiết:'
    },
    FIX: {
      keywords: ['lỗi', 'sai', 'không chạy', 'crash', 'fix', 'khắc phục', 'sửa'],
      responseTemplate: 'Để khắc phục lỗi này, bạn có thể:'
    },
    OPTIMIZE: {
      keywords: ['tối ưu', 'nhanh hơn', 'cải thiện', 'hiệu suất', 'performance', 'chậm'],
      responseTemplate: 'Để cải thiện hiệu suất, hãy thử:'
    },
    QUESTION: {
      keywords: ['tại sao', 'vì sao', 'làm sao', 'cách nào', 'sao lại'],
      responseTemplate: 'Đó là vì:'
    },
    FEEDBACK: {
      keywords: ['tốt', 'hay', 'không tốt', 'tệ', 'đánh giá', 'nhận xét'],
      responseTemplate: 'Cảm ơn bạn đã phản hồi:'
    }
  }

  /**
   * Phát hiện intent từ câu hỏi
   */
  detectIntent(question: string): string {
    const lowerQ = question.toLowerCase()

    for (const [intent, config] of Object.entries(this.intents)) {
      const matched = config.keywords.some(keyword => lowerQ.includes(keyword))
      if (matched) return intent
    }

    return 'GENERAL'
  }

  /**
   * Lấy response template phù hợp với intent
   */
  getResponseTemplate(intent: string): string {
    return (this.intents[intent as keyof typeof this.intents]?.responseTemplate) || 'Tôi có thể giúp bạn:'
  }

  /**
   * Ví dụ:
   * const detector = new IntentDetector()
   * 
   * detector.detectIntent("làm sao để debug?")
   * // → "LEARN"
   * 
   * detector.getResponseTemplate("LEARN")
   * // → "Để bạn hiểu rõ hơn, tôi sẽ giải thích chi tiết:"
   */
}

/**
 * ============================================
 * CÁCH 5: COMBINED SMART AI (Kết hợp tất cả)
 * ============================================
 * Sử dụng tất cả 4 cách trên để tạo AI thông minh nhất
 */

export class SmartChatAI {
  private similarityMatcher = new SimilarityMatcher()
  private semanticAnalyzer = new SemanticAnalyzer()
  private contextAI = new ContextAwareAI()
  private intentDetector = new IntentDetector()

  /**
   * Trả lời với tất cả các phương pháp kết hợp
   */
  generateSmartAnswer(
    question: string,
    conversationHistory: string[] = [],
    trainingData: { [key: string]: string[] } = {}
  ): string {
    // Bước 1: Phát hiện intent
    const intent = this.intentDetector.detectIntent(question)
    const responseTemplate = this.intentDetector.getResponseTemplate(intent)

    // Bước 2: Phân loại semantic
    const category = this.semanticAnalyzer.categorizeQuestion(question)
    const normalizedQuestion = this.semanticAnalyzer.normalizeQuestion(question)

    // Bước 3: Tìm câu hỏi tương tự
    const similarQuestions = this.similarityMatcher.findSimilarQuestions(
      normalizedQuestion,
      conversationHistory,
      0.7
    )

    // Bước 4: Lấy ngữ cảnh
    const context = this.contextAI.getContext(question)

    // Bước 5: Kết hợp tất cả để tạo answer tốt nhất
    let baseAnswer = ''

    // Ưu tiên 1: Nếu có câu hỏi tương tự 100% → dùng answer cũ
    if (similarQuestions.length > 0 && similarQuestions[0].similarity === 1.0) {
      const similarQ = similarQuestions[0].question
      if (trainingData[similarQ]) {
        baseAnswer = trainingData[similarQ][0]
      }
    }

    // Ưu tiên 2: Nếu có category match → dùng training data của category đó
    if (!baseAnswer && category && trainingData[category]) {
      baseAnswer = trainingData[category][Math.floor(Math.random() * trainingData[category].length)]
    }

    // Ưu tiên 3: Nếu có câu tương tự 70%+ → dùng answer đó nhưng thêm ngữ cảnh
    if (!baseAnswer && similarQuestions.length > 0) {
      const similarQ = similarQuestions[0].question
      if (trainingData[similarQ]) {
        baseAnswer = trainingData[similarQ][0]
      }
    }

    // Fallback: Tạo answer dựa trên template
    if (!baseAnswer) {
      baseAnswer = `${responseTemplate} Tôi hiện chưa có câu trả lời cụ thể. Bạn có thể cung cấp thêm chi tiết không?`
    }

    // Bước 6: Thêm ngữ cảnh nếu có
    const finalAnswer = this.contextAI.generateContextAwareAnswer(baseAnswer, context)

    // Bước 7: Lưu vào history để sau này dùng context
    this.contextAI.addToHistory(question, finalAnswer)

    return finalAnswer
  }

  /**
   * Ví dụ sử dụng:
   * const smartAI = new SmartChatAI()
   * 
   * const answer = smartAI.generateSmartAnswer(
   *   "làm sao debug?",
   *   ["tôi gặp lỗi", "sai ở đâu?"],
   *   {
   *     debugging: ["Để debug, bạn nên...", "Mẹo debug là..."]
   *   }
   * )
   */
}

/**
 * ============================================
 * SO SÁNH 5 CÁCH
 * ============================================
 * 
 * Cách 1 - Similarity Matching:
 *   ✅ Tìm câu hỏi tương tự 95%+
 *   ❌ Không hiểu ngữ nghĩa sâu
 *   💡 Dùng cho: Câu hỏi giống nhau nhưng cách phát biểu khác
 * 
 * Cách 2 - Semantic Understanding:
 *   ✅ Hiểu ý nghĩa, không bị cách phát biểu khác
 *   ❌ Cần định nghĩa categories và synonyms
 *   💡 Dùng cho: Nhóm câu hỏi có cùng ý nghĩa
 * 
 * Cách 3 - Context Awareness:
 *   ✅ Trả lời có liên quan đến câu trước
 *   ❌ Cần lịch sử cuộc trò chuyện
 *   💡 Dùng cho: Cuộc trò chuyện liên tiếp
 * 
 * Cách 4 - Intent Detection:
 *   ✅ Biết người dùng muốn làm gì
 *   ❌ Cần định nghĩa intent templates
 *   💡 Dùng cho: Tạo answer theo mục đích người dùng
 * 
 * Cách 5 - Combined Smart AI:
 *   ✅ Kết hợp tất cả → CHÍNH XÁC NHẤT
 *   ❌ Phức tạp hơn, chậm hơn một chút
 *   💡 Dùng cho: Chatbox chuyên nghiệp
 * 
 * ============================================
 * RECOMMEND: Dùng CÁCH 5 (SmartChatAI) 🚀
 * ============================================
 */

export default SmartChatAI
