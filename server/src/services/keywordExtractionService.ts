/**
 * Keyword Extraction Service
 * Tự động extract keywords từ câu hỏi của user và tạo context phù hợp với BugHunter project
 */

import TrainingData from '../models/trainingData.model';
import Challenge from '../models/challenge.model';
import { word2vecService } from './word2vecService';
import { knowledgeGraphService } from './knowledgeGraphService';

export interface ExtractedKeywords {
  // Programming concepts
  concepts: string[]; // ['array', 'function', 'recursion', ...]
  
  // Languages
  languages: string[]; // ['Python', 'JavaScript', ...]
  
  // Error types
  errorTypes: string[]; // ['syntax', 'runtime', 'logic', ...]
  
  // Topics
  topics: string[]; // ['debug', 'algorithm', 'data-structure', ...]
  
  // Intent
  intent: 'question' | 'exercise' | 'error' | 'learning' | 'general';
  
  // Difficulty level
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  
  // Raw keywords for search
  rawKeywords: string[];
}

export interface ResponseContext {
  trainingData: any[];
  challenges: any[];
  errorBasedRecommendations?: any[];
  keywords: ExtractedKeywords;
  suggestedTopics: string[];
}

class KeywordExtractionService {
  // Programming concepts keywords
  private conceptKeywords: { [key: string]: string[] } = {
    'array': ['array', 'mảng', 'list', 'danh sách'],
    'function': ['function', 'hàm', 'method', 'phương thức'],
    'object': ['object', 'đối tượng', 'class', 'lớp'],
    'loop': ['loop', 'vòng lặp', 'for', 'while', 'foreach'],
    'condition': ['if', 'else', 'condition', 'điều kiện'],
    'variable': ['variable', 'biến', 'var', 'let', 'const'],
    'string': ['string', 'chuỗi', 'text'],
    'number': ['number', 'số', 'integer', 'float'],
    'boolean': ['boolean', 'bool', 'true', 'false'],
    'recursion': ['recursion', 'đệ quy', 'recursive'],
    'closure': ['closure', 'đóng'],
    'promise': ['promise', 'async', 'await', 'asynchronous'],
    'generator': ['generator', 'yield'],
    'decorator': ['decorator', 'decorator pattern'],
    'class': ['class', 'lớp', 'object-oriented', 'oop'],
    'inheritance': ['inheritance', 'kế thừa', 'extends'],
    'polymorphism': ['polymorphism', 'đa hình'],
    'encapsulation': ['encapsulation', 'đóng gói'],
    'algorithm': ['algorithm', 'thuật toán', 'algo'],
    'data-structure': ['data structure', 'cấu trúc dữ liệu', 'stack', 'queue', 'tree', 'graph'],
    'sorting': ['sort', 'sắp xếp', 'quicksort', 'mergesort'],
    'searching': ['search', 'tìm kiếm', 'binary search', 'linear search'],
  };

  // Language keywords
  private languageKeywords: { [key: string]: string[] } = {
    'Python': ['python', 'py'],
    'JavaScript': ['javascript', 'js', 'nodejs', 'node.js'],
    'Java': ['java'],
    'C++': ['c++', 'cpp', 'cplusplus'],
    'C#': ['c#', 'csharp', 'c-sharp'],
    'C': ['c language', 'c programming'],
  };

  // Error type keywords
  private errorTypeKeywords: { [key: string]: string[] } = {
    'syntax': ['syntax error', 'lỗi cú pháp', 'syntax'],
    'runtime': ['runtime error', 'lỗi runtime', 'runtime'],
    'logic': ['logic error', 'lỗi logic', 'logic'],
    'type': ['typeerror', 'type error', 'lỗi kiểu'],
    'reference': ['referenceerror', 'reference error', 'undefined', 'null'],
    'index': ['indexerror', 'index error', 'out of range'],
    'key': ['keyerror', 'key error'],
    'attribute': ['attributeerror', 'attribute error'],
    'indentation': ['indentationerror', 'indentation error', 'indent'],
    'name': ['nameerror', 'name error', 'not defined'],
    'zero-division': ['zerodivisionerror', 'division by zero', 'chia cho 0'],
    'timeout': ['timeout', 'timeout error'],
    'memory': ['memory error', 'out of memory'],
    'performance': ['performance', 'slow', 'chậm'],
  };

  // Topic keywords
  private topicKeywords: { [key: string]: string[] } = {
    'debug': ['debug', 'sửa lỗi', 'fix', 'troubleshoot', 'gỡ lỗi'],
    'algorithm': ['algorithm', 'thuật toán', 'algo'],
    'data-structure': ['data structure', 'cấu trúc dữ liệu'],
    'best-practices': ['best practice', 'tốt nhất', 'clean code', 'code quality'],
    'testing': ['test', 'testing', 'unit test', 'pytest', 'jest'],
    'git': ['git', 'version control', 'github'],
    'optimization': ['optimize', 'tối ưu', 'performance'],
    'learning': ['học', 'learn', 'tutorial', 'hướng dẫn'],
    'exercise': ['bài tập', 'exercise', 'challenge', 'practice'],
  };

  // Intent keywords
  private intentKeywords: { [key: string]: string[] } = {
    'question': ['là gì', 'what is', 'giải thích', 'explain', 'tại sao', 'why', 'như thế nào', 'how'],
    'exercise': ['bài tập', 'exercise', 'challenge', 'gợi ý', 'suggest', 'recommend', 'bài nào'],
    'error': ['lỗi', 'error', 'bug', 'sai', 'fix', 'sửa', 'debug'],
    'learning': ['học', 'learn', 'tutorial', 'course', 'lộ trình', 'roadmap'],
    'general': ['hello', 'xin chào', 'help', 'giúp'],
  };

  /**
   * Extract keywords từ câu hỏi của user
   */
  extractKeywords(userMessage: string): ExtractedKeywords {
    const lowerMessage = userMessage.toLowerCase();
    const words = lowerMessage.split(/\s+/).filter(w => w.length > 2);
    
    const keywords: ExtractedKeywords = {
      concepts: [],
      languages: [],
      errorTypes: [],
      topics: [],
      intent: 'general',
      rawKeywords: words,
    };

    // Extract concepts
    Object.entries(this.conceptKeywords).forEach(([concept, keywords_list]) => {
      if (keywords_list.some(kw => lowerMessage.includes(kw))) {
        keywords.concepts.push(concept);
      }
    });

    // Extract languages
    Object.entries(this.languageKeywords).forEach(([lang, keywords_list]) => {
      if (keywords_list.some(kw => lowerMessage.includes(kw))) {
        keywords.languages.push(lang);
      }
    });

    // Extract error types
    Object.entries(this.errorTypeKeywords).forEach(([errorType, keywords_list]) => {
      if (keywords_list.some(kw => lowerMessage.includes(kw))) {
        keywords.errorTypes.push(errorType);
      }
    });

    // Extract topics
    Object.entries(this.topicKeywords).forEach(([topic, keywords_list]) => {
      if (keywords_list.some(kw => lowerMessage.includes(kw))) {
        keywords.topics.push(topic);
      }
    });

    // Detect intent
    let maxMatches = 0;
    Object.entries(this.intentKeywords).forEach(([intent, keywords_list]) => {
      const matches = keywords_list.filter(kw => lowerMessage.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        keywords.intent = intent as any;
      }
    });

    // Extract difficulty
    if (lowerMessage.includes('dễ') || lowerMessage.includes('easy') || lowerMessage.includes('cơ bản') || lowerMessage.includes('basic')) {
      keywords.difficulty = 'Easy';
    } else if (lowerMessage.includes('trung bình') || lowerMessage.includes('medium') || lowerMessage.includes('vừa')) {
      keywords.difficulty = 'Medium';
    } else if (lowerMessage.includes('khó') || lowerMessage.includes('hard') || lowerMessage.includes('nâng cao') || lowerMessage.includes('advanced')) {
      keywords.difficulty = 'Hard';
    }

    return keywords;
  }

  /**
   * Tìm training data dựa trên keywords
   */
  async findTrainingDataByKeywords(keywords: ExtractedKeywords, limit: number = 5): Promise<any[]> {
    try {
      // Ưu tiên sử dụng Word2Vec nếu có
      if (word2vecService.isModelTrained()) {
        const query = keywords.rawKeywords.join(' ');
        const similarResults = await word2vecService.findSimilarTrainingData(query, limit);
        if (similarResults && similarResults.length > 0) {
          return similarResults.map(r => r.trainingData);
        }
      }

      // Fallback: keyword matching với priority
      const searchTerms: string[] = [
        ...keywords.concepts,
        ...keywords.languages,
        ...keywords.errorTypes,
        ...keywords.topics,
        ...keywords.rawKeywords.slice(0, 5), // Top 5 raw keywords
      ];

      const query: any = {
        isActive: true,
        $or: [
          // Match concepts, languages, error types, topics
          { tags: { $in: searchTerms } },
          // Match in question
          { question: { $regex: searchTerms.join('|'), $options: 'i' } },
          // Match in answer
          { answer: { $regex: searchTerms.join('|'), $options: 'i' } },
        ],
      };

      const trainingData = await TrainingData.find(query)
        .sort({ 
          priority: -1, 
          usageCount: -1,
          createdAt: -1 
        })
        .limit(limit * 2) // Lấy nhiều hơn để filter
        .lean();

      // Score và sort lại dựa trên relevance
      const scored = trainingData.map(td => {
        let score = 0;
        const tdText = `${td.question} ${td.answer}`.toLowerCase();
        const tdTags = (td.tags || []).map((t: string) => t.toLowerCase());

        // Score based on keyword matches
        searchTerms.forEach(term => {
          if (tdText.includes(term.toLowerCase())) score += 2;
          if (tdTags.includes(term.toLowerCase())) score += 3;
        });

        return { ...td, _relevanceScore: score };
      });

      // Sort by score và return top results
      return scored
        .sort((a, b) => (b as any)._relevanceScore - (a as any)._relevanceScore)
        .slice(0, limit)
        .map(({ _relevanceScore, ...td }) => td);
    } catch (error) {
      console.error('[Keyword Extraction] Error finding training data:', error);
      return [];
    }
  }

  /**
   * Tìm challenges dựa trên keywords
   */
  async findChallengesByKeywords(keywords: ExtractedKeywords, limit: number = 5): Promise<any[]> {
    try {
      const filter: any = {
        isActive: true,
      };

      // Filter by language
      if (keywords.languages.length > 0) {
        filter.language = { $in: keywords.languages };
      }

      // Filter by difficulty
      if (keywords.difficulty) {
        filter.difficulty = keywords.difficulty;
      }

      // Filter by tags (concepts, topics)
      if (keywords.concepts.length > 0 || keywords.topics.length > 0) {
        const tags = [...keywords.concepts, ...keywords.topics];
        filter.tags = { $in: tags };
      }

      let challenges = await Challenge.find(filter)
        .select('title description language difficulty category points tags _id')
        .sort({ createdAt: -1 })
        .limit(limit * 2)
        .lean();

      // Score challenges based on relevance
      if (keywords.concepts.length > 0 || keywords.topics.length > 0) {
        const searchTerms = [...keywords.concepts, ...keywords.topics];
        const scored = challenges.map(challenge => {
          let score = 0;
          const challengeText = `${challenge.title} ${challenge.description}`.toLowerCase();
          const challengeTags = (challenge.tags || []).map((t: string) => t.toLowerCase());

          searchTerms.forEach(term => {
            if (challengeText.includes(term.toLowerCase())) score += 2;
            if (challengeTags.includes(term.toLowerCase())) score += 3;
          });

          return { ...challenge, _relevanceScore: score };
        });

        challenges = scored
          .sort((a, b) => (b as any)._relevanceScore - (a as any)._relevanceScore)
          .slice(0, limit)
          .map(({ _relevanceScore, ...challenge }) => challenge);
      } else {
        challenges = challenges.slice(0, limit);
      }

      return challenges;
    } catch (error) {
      console.error('[Keyword Extraction] Error finding challenges:', error);
      return [];
    }
  }

  /**
   * Tạo response context từ keywords
   */
  async createResponseContext(userMessage: string, userId?: string): Promise<ResponseContext> {
    try {
      const keywords = this.extractKeywords(userMessage);
      
      console.log('[Keyword Extraction] Extracted keywords:', keywords);

      // Tìm training data với error handling
      let trainingData: any[] = [];
      try {
        trainingData = await this.findTrainingDataByKeywords(keywords, 5);
      } catch (error) {
        console.error('[Keyword Extraction] Error finding training data:', error);
        trainingData = [];
      }
      
      // Tìm challenges nếu intent là exercise hoặc có keywords liên quan
      let challenges: any[] = [];
      if (keywords.intent === 'exercise' || keywords.topics.includes('exercise')) {
        try {
          challenges = await this.findChallengesByKeywords(keywords, 5);
        } catch (error) {
          console.error('[Keyword Extraction] Error finding challenges:', error);
          challenges = [];
        }
      }

      // Tìm error-based recommendations nếu có error keywords
      let errorBasedRecommendations: any[] = [];
      if (keywords.errorTypes.length > 0 && userId) {
        try {
          errorBasedRecommendations = await knowledgeGraphService.findTrainingDataForErrors(
            keywords.rawKeywords.filter(kw => kw.length > 3), // Use longer keywords as error messages
            keywords.errorTypes,
            5
          );
        } catch (error) {
          console.error('[Keyword Extraction] Error finding error-based recommendations:', error);
          errorBasedRecommendations = [];
        }
      }

      // Suggest topics based on keywords
      const suggestedTopics: string[] = [
        ...keywords.concepts,
        ...keywords.topics,
        ...keywords.languages,
      ].slice(0, 5);

      return {
        trainingData: trainingData || [],
        challenges: challenges || [],
        errorBasedRecommendations: errorBasedRecommendations.length > 0 ? errorBasedRecommendations : undefined,
        keywords,
        suggestedTopics: suggestedTopics || [],
      };
    } catch (error: any) {
      console.error('[Keyword Extraction] Error creating response context:', error);
      // Return empty context on error
      return {
        trainingData: [],
        challenges: [],
        keywords: this.extractKeywords(userMessage), // At least extract keywords
        suggestedTopics: [],
      };
    }
  }

  /**
   * Tạo system prompt dựa trên context
   */
  createSystemPrompt(context: ResponseContext): string {
    let prompt = 'Bạn là trợ lý AI thông minh của **BugHunter** - một nền tảng học lập trình thông qua việc sửa lỗi code.\n\n';
    prompt += '**Vai trò của bạn:**\n';
    prompt += '- Giúp người dùng học lập trình, debug code, giải thích các khái niệm\n';
    prompt += '- Gợi ý bài tập và challenges phù hợp\n';
    prompt += '- Hỗ trợ người dùng sửa lỗi và cải thiện kỹ năng lập trình\n';
    prompt += '- Trả lời một cách thân thiện, chính xác và hữu ích\n\n';

    // Add keywords context
    if (context.keywords.concepts.length > 0 || context.keywords.topics.length > 0) {
      prompt += '**Keywords được phát hiện từ câu hỏi:**\n';
      if (context.keywords.concepts.length > 0) {
        prompt += `- Khái niệm: ${context.keywords.concepts.join(', ')}\n`;
      }
      if (context.keywords.languages.length > 0) {
        prompt += `- Ngôn ngữ: ${context.keywords.languages.join(', ')}\n`;
      }
      if (context.keywords.errorTypes.length > 0) {
        prompt += `- Loại lỗi: ${context.keywords.errorTypes.join(', ')}\n`;
      }
      if (context.keywords.topics.length > 0) {
        prompt += `- Chủ đề: ${context.keywords.topics.join(', ')}\n`;
      }
      prompt += `- Intent: ${context.keywords.intent}\n\n`;
    }

    // Add training data context
    if (context.trainingData.length > 0) {
      prompt += '**Training Data (Context từ BugHunter):**\n';
      context.trainingData.forEach((td, index) => {
        prompt += `\n[Ví dụ ${index + 1}]\nQ: ${td.question}\nA: ${td.answer}\n`;
      });
      prompt += '\n⚠️ QUAN TRỌNG: Hãy sử dụng các ví dụ trên làm tham khảo. Nếu câu hỏi tương tự, hãy trả lời theo phong cách và nội dung tương tự.\n\n';
    }

    // Add challenges context
    if (context.challenges.length > 0) {
      prompt += '**Danh sách Bài tập (Challenges từ BugHunter):**\n';
      context.challenges.forEach((challenge, index) => {
        prompt += `\n📝 [Bài ${index + 1}] ${challenge.title}\n`;
        prompt += `   • Ngôn ngữ: ${challenge.language}\n`;
        prompt += `   • Độ khó: ${challenge.difficulty}\n`;
        prompt += `   • Điểm: ${challenge.points} điểm\n`;
        if (challenge.description) {
          prompt += `   • Mô tả: ${challenge.description.substring(0, 200)}${challenge.description.length > 200 ? '...' : ''}\n`;
        }
      });
      prompt += '\n⚠️ QUAN TRỌNG: Khi người dùng hỏi về bài tập, bạn CẦN giới thiệu các bài tập trên một cách hấp dẫn và chi tiết.\n\n';
    }

    // Add error-based recommendations
    if (context.errorBasedRecommendations && context.errorBasedRecommendations.length > 0) {
      prompt += '**Gợi ý dựa trên lỗi:**\n';
      context.errorBasedRecommendations.forEach((td, index) => {
        prompt += `\n[Gợi ý ${index + 1}]\nQ: ${td.question}\nA: ${td.answer}\n`;
      });
      prompt += '\n⚠️ QUAN TRỌNG: Hãy tham khảo các gợi ý trên để trả lời câu hỏi về lỗi.\n\n';
    }

    prompt += '**Hướng dẫn trả lời:**\n';
    prompt += '1. ✅ Trả lời bằng tiếng Việt, thân thiện và dễ hiểu\n';
    prompt += '2. ✅ Sử dụng context từ BugHunter (training data, challenges) để tạo câu trả lời phù hợp\n';
    prompt += '3. ✅ Nếu có challenges, hãy giới thiệu một cách tự nhiên như một người bạn đang tư vấn\n';
    prompt += '4. ✅ Khuyến khích người dùng thử làm các challenges trên BugHunter platform\n';
    prompt += '5. ✅ Đưa ra ví dụ code cụ thể khi cần thiết\n';
    prompt += '6. ✅ Giải thích rõ ràng, từng bước một\n';

    return prompt;
  }
}

export const keywordExtractionService = new KeywordExtractionService();

