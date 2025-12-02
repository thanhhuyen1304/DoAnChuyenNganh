// Adaptive AI Learning System
// Tự động học từ câu hỏi và phản hồi của người dùng
// Không cần phải code training data thủ công

import axios from 'axios'
import { getApiBase } from '../lib/apiBase'

interface UserInteraction {
  id: string
  question: string
  answer: string
  rating: 'good' | 'bad' | null
  timestamp: Date
  category?: string
  language: 'vi' | 'en'
}

interface LearnedPattern {
  keywords: string[]
  responses: string[]
  category: string
  frequency: number
  avgRating: number
  lastUpdated: Date
}

interface AdaptiveAIStore {
  interactions: UserInteraction[]
  learnedPatterns: Map<string, LearnedPattern>
}

// Store dữ liệu học tập locally
class AdaptiveAI {
  private store: AdaptiveAIStore
  private dbKey = 'bughunter_ai_learning_data'
  // Lấy từ env VITE_API_URL nếu có, đảm bảo kết thúc bằng '/api'
  private readonly API_BASE: string = getApiBase()

  constructor() {
    this.store = this.loadFromLocalStorage() || {
      interactions: [],
      learnedPatterns: new Map()
    }
  }

  /**
   * Lưu câu hỏi và câu trả lời
   * Tự động trích xuất keywords từ câu hỏi
   */
  saveInteraction(
    question: string,
    answer: string,
    language: 'vi' | 'en',
    rating?: 'good' | 'bad'
  ): void {
    const interaction: UserInteraction = {
      id: Date.now().toString(),
      question,
      answer,
      rating: rating || null,
      timestamp: new Date(),
      language
    }

    this.store.interactions.push(interaction)

    // Trích xuất keywords tự động
    const keywords = this.extractKeywords(question, language)
    
    // Học từ câu hỏi này
    this.learnFromInteraction(keywords, answer, language, rating)

    // Lưu vào LocalStorage
    this.saveToLocalStorage()

    // Gửi lên server để phân tích chi tiết (optional)
    this.sendToServer(interaction).catch(() => console.log('Server sync failed'))
  }

  /**
   * Trích xuất keywords từ câu hỏi tự động
   * Dùng NLP đơn giản - tách từ, loại bỏ stopwords
   */
  private extractKeywords(text: string, language: 'vi' | 'en'): string[] {
    const stopwords = {
      vi: ['là', 'cái', 'tôi', 'bạn', 'có', 'không', 'gì', 'nào', 'được', 'cách', 'sao', 'làm', 'hỏi', 'muốn', 'cần', 'nó', 'nên', 'thì', 'này', 'kia', 'ở', 'đó', 'đây', 'và', 'hay', 'hay là', 'hoặc', 'nhưng', 'mà', 'vì', 'cho', 'để', 'nếu', 'khi', 'giống', 'như', 'cũng', 'lại', 'chỉ', 'khoảng', 'từ', 'đến'],
      en: ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'if', 'what', 'which', 'who', 'how', 'why', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']
    }

    // Tách từ
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Xóa dấu câu
      .split(/\s+/)
      .filter(word => word.length > 2) // Loại từ ngắn
      .filter(word => !stopwords[language].includes(word))

    // Lọc từ lặp lại
    return [...new Set(words)]
  }

  /**
   * Học từ mỗi interaction
   * Cập nhật hoặc tạo pattern mới
   */
  private learnFromInteraction(
    keywords: string[],
    answer: string,
    language: 'vi' | 'en',
    rating?: 'good' | 'bad'
  ): void {
    for (const keyword of keywords) {
      const key = `${keyword}_${language}`
      
      if (this.store.learnedPatterns.has(key)) {
        // Cập nhật pattern hiện có
        const pattern = this.store.learnedPatterns.get(key)!
        
        if (!pattern.responses.includes(answer)) {
          pattern.responses.push(answer)
        }
        
        pattern.frequency += 1
        pattern.lastUpdated = new Date()
        
        // Cập nhật rating
        if (rating) {
          const ratingValue = rating === 'good' ? 1 : 0
          pattern.avgRating = (pattern.avgRating * (pattern.frequency - 1) + ratingValue) / pattern.frequency
        }
      } else {
        // Tạo pattern mới
        const newPattern: LearnedPattern = {
          keywords: [keyword],
          responses: [answer],
          category: 'user_learned',
          frequency: 1,
          avgRating: rating === 'good' ? 1 : (rating === 'bad' ? 0 : 0.5),
          lastUpdated: new Date()
        }
        
        this.store.learnedPatterns.set(key, newPattern)
      }
    }
  }

  /**
   * Tìm câu trả lời dựa trên câu hỏi
   * Ưu tiên responses có rating cao (good)
   */
  findAnswer(question: string, language: 'vi' | 'en'): string | null {
    const keywords = this.extractKeywords(question, language)
    
    if (keywords.length === 0) return null

    // Tìm pattern phù hợp nhất
    let bestMatch: LearnedPattern | null = null
    let bestScore = 0

    for (const keyword of keywords) {
      const key = `${keyword}_${language}`
      const pattern = this.store.learnedPatterns.get(key)

      if (pattern) {
        // Score = frequency * avgRating
        const score = pattern.frequency * (pattern.avgRating || 0.5)
        
        if (score > bestScore) {
          bestScore = score
          bestMatch = pattern
        }
      }
    }

    if (bestMatch && bestMatch.responses.length > 0) {
      // Trả lời ngẫu nhiên từ danh sách responses
      return bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)]
    }

    return null
  }

  /**
   * Cập nhật rating cho câu trả lời
   */
  updateRating(questionIndex: number, rating: 'good' | 'bad'): void {
    if (this.store.interactions[questionIndex]) {
      this.store.interactions[questionIndex].rating = rating
      
      // Tái học từ interaction này với rating mới
      const interaction = this.store.interactions[questionIndex]
      const keywords = this.extractKeywords(interaction.question, interaction.language)
      this.learnFromInteraction(keywords, interaction.answer, interaction.language, rating)
      
      this.saveToLocalStorage()
    }
  }

  /**
   * Lấy thống kê học tập
   */
  getStats() {
    const totalInteractions = this.store.interactions.length
    const goodRatings = this.store.interactions.filter(i => i.rating === 'good').length
    const badRatings = this.store.interactions.filter(i => i.rating === 'bad').length
    const totalPatterns = this.store.learnedPatterns.size

    return {
      totalInteractions,
      goodRatings,
      badRatings,
      totalPatterns,
      accuracy: totalInteractions > 0 ? (goodRatings / totalInteractions * 100).toFixed(2) + '%' : 'N/A'
    }
  }

  /**
   * Xuất danh sách pattern đã học
   */
  getLearnedPatterns(): LearnedPattern[] {
    const patterns = Array.from(this.store.learnedPatterns.values())
    // Sắp xếp theo frequency giảm dần
    return patterns.sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * Xóa toàn bộ dữ liệu học tập
   */
  clearAllData(): void {
    this.store = {
      interactions: [],
      learnedPatterns: new Map()
    }
    this.saveToLocalStorage()
  }

  /**
   * Lưu vào LocalStorage
   */
  private saveToLocalStorage(): void {
    try {
      const data = {
        interactions: this.store.interactions,
        learnedPatterns: Array.from(this.store.learnedPatterns.entries()).map(([key, value]) => ({
          key,
          ...value
        }))
      }
      localStorage.setItem(this.dbKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  /**
   * Tải từ LocalStorage
   */
  private loadFromLocalStorage(): AdaptiveAIStore | null {
    try {
      const data = localStorage.getItem(this.dbKey)
      if (data) {
        const parsed = JSON.parse(data)
        const learnedPatterns = new Map<string, LearnedPattern>(
          parsed.learnedPatterns.map((p: any) => {
            const { key, ...pattern } = p
            return [key, pattern as LearnedPattern]
          })
        )
        return {
          interactions: parsed.interactions,
          learnedPatterns
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    return null
  }

  /**
   * Gửi dữ liệu lên server để phân tích (optional)
   */
  private async sendToServer(interaction: UserInteraction): Promise<void> {
    try {
      await axios.post(`${this.API_BASE}/ai/learn`, {
        question: interaction.question,
        answer: interaction.answer,
        rating: interaction.rating,
        language: interaction.language
      })
    } catch (error) {
      // Bỏ qua nếu server không available
      console.log('Could not sync to server')
    }
  }

  /**
   * Import dữ liệu training từ file
   */
  importTrainingData(file: File): void {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.interactions) {
          this.store.interactions.push(...data.interactions)
        }
        this.saveToLocalStorage()
      } catch (error) {
        console.error('Failed to import data:', error)
      }
    }
    reader.readAsText(file)
  }

  /**
   * Export dữ liệu đã học
   */
  exportLearnedData(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      interactions: this.store.interactions,
      patterns: Array.from(this.store.learnedPatterns.values())
    }
    return JSON.stringify(data, null, 2)
  }
}

// Export singleton instance
export const adaptiveAI = new AdaptiveAI()
export type { UserInteraction, LearnedPattern }
