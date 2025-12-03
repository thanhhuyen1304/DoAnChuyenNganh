import { Request, Response } from 'express';
import ChatHistory from '../models/chatHistory.model';
import User from '../models/user.model';
import TrainingData from '../models/trainingData.model';
import Challenge from '../models/challenge.model';
import Submission from '../models/submission.model';
import axios from 'axios';
import { word2vecService } from '../services/word2vecService';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { keywordExtractionService } from '../services/keywordExtractionService';
import mongoose from 'mongoose';

// Environment configuration
const ENV = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini', // 'gemini' | 'openai'
};

// Log configuration on startup
console.log('[Chat Controller] AI Configuration:');
console.log(`  - AI_PROVIDER: ${ENV.AI_PROVIDER}`);
console.log(`  - GEMINI_API_KEY: ${ENV.GEMINI_API_KEY ? '✅ Đã cấu hình (' + ENV.GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ Chưa cấu hình'}`);
console.log(`  - OPENAI_API_KEY: ${ENV.OPENAI_API_KEY ? '✅ Đã cấu hình' : '❌ Chưa cấu hình'}`);

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Detect if user is asking about challenges/exercises
function detectChallengeRequest(userMessage: string): { isRequest: boolean; language?: string; difficulty?: string } {
  const lowerMessage = userMessage.toLowerCase();
  
  // Keywords indicating challenge request
  const challengeKeywords = [
    'bài tập', 'baitap', 'challenge', 'thử thách', 'exercise', 'bài luyện',
    'gợi ý', 'gợi ý bài', 'tìm bài', 'cho tôi bài', 'suggest', 'recommend',
    'bài nào', 'challenges', 'đề bài', 'de bai'
  ];
  
  const isRequest = challengeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!isRequest) {
    return { isRequest: false };
  }
  
  // Extract language
  const languageMap: { [key: string]: string } = {
    'python': 'Python',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'java': 'Java',
    'c++': 'C++',
    'cpp': 'C++',
    'c#': 'C#',
    'csharp': 'C#',
    'c': 'C'
  };
  
  let detectedLanguage: string | undefined;
  for (const [key, value] of Object.entries(languageMap)) {
    if (lowerMessage.includes(key)) {
      detectedLanguage = value;
      break;
    }
  }
  
  // Extract difficulty
  let detectedDifficulty: string | undefined;
  if (lowerMessage.includes('cơ bản') || lowerMessage.includes('coban') || lowerMessage.includes('basic') || lowerMessage.includes('dễ') || lowerMessage.includes('easy')) {
    detectedDifficulty = 'Easy';
  } else if (lowerMessage.includes('trung bình') || lowerMessage.includes('trungbinh') || lowerMessage.includes('medium') || lowerMessage.includes('vừa')) {
    detectedDifficulty = 'Medium';
  } else if (lowerMessage.includes('khó') || lowerMessage.includes('nâng cao') || lowerMessage.includes('nangcao') || lowerMessage.includes('hard') || lowerMessage.includes('advanced')) {
    detectedDifficulty = 'Hard';
  }
  
  return {
    isRequest: true,
    language: detectedLanguage,
    difficulty: detectedDifficulty,
  };
}

// Find challenges based on user request
async function findChallenges(userMessage: string, limit: number = 5): Promise<any[]> {
  try {
    const detection = detectChallengeRequest(userMessage);
    
    if (!detection.isRequest) {
      return [];
    }
    
    console.log('[Challenges] User requested challenges:', detection);
    
    const filter: any = {
      isActive: true,
    };
    
    // Nếu có language được detect, filter theo language
    if (detection.language) {
      filter.language = detection.language;
      console.log(`[Challenges] Filtering by language: ${detection.language}`);
    }
    
    // Nếu có difficulty được detect, filter theo difficulty
    if (detection.difficulty) {
      filter.difficulty = detection.difficulty;
      console.log(`[Challenges] Filtering by difficulty: ${detection.difficulty}`);
    }
    
    // Query challenges
    let challenges = await Challenge.find(filter)
      .select('title description language difficulty category points tags _id')
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Lấy nhiều hơn để có thể ưu tiên
      .lean();
    
    // Nếu không có language được detect, ưu tiên các ngôn ngữ phổ biến
    if (!detection.language && challenges.length > 0) {
      const popularLanguages = ['Python', 'JavaScript', 'Java', 'C++'];
      const challengesByLang: { [key: string]: any[] } = {};
      const otherChallenges: any[] = [];
      
      challenges.forEach((challenge: any) => {
        if (popularLanguages.includes(challenge.language)) {
          if (!challengesByLang[challenge.language]) {
            challengesByLang[challenge.language] = [];
          }
          challengesByLang[challenge.language].push(challenge);
        } else {
          otherChallenges.push(challenge);
        }
      });
      
      // Sắp xếp lại: ưu tiên các ngôn ngữ phổ biến, mỗi ngôn ngữ lấy 1-2 bài
      challenges = [];
      popularLanguages.forEach(lang => {
        if (challengesByLang[lang] && challenges.length < limit) {
          challenges.push(...challengesByLang[lang].slice(0, Math.ceil(limit / popularLanguages.length)));
        }
      });
      
      // Thêm các bài tập từ ngôn ngữ khác nếu còn chỗ
      if (challenges.length < limit) {
        challenges.push(...otherChallenges.slice(0, limit - challenges.length));
      }
      
      // Giới hạn lại số lượng
      challenges = challenges.slice(0, limit);
    } else {
      // Giới hạn lại số lượng nếu có filter
      challenges = challenges.slice(0, limit);
    }
    
    console.log(`[Challenges] Found ${challenges.length} challenges to recommend`);
    
    return challenges;
  } catch (error) {
    console.error('[Challenges] Error finding challenges:', error);
    return [];
  }
}

// Find relevant training data based on user message
async function findRelevantTrainingData(userMessage: string, limit: number = 3): Promise<any[]> {
  try {
    // Ưu tiên sử dụng Word2Vec nếu model đã được train
    if (word2vecService.isModelTrained()) {
      console.log('[Training Data] Sử dụng Word2Vec để tìm training data tương tự');
      const similarResults = await word2vecService.findSimilarTrainingData(userMessage, limit);
      
      if (similarResults && similarResults.length > 0) {
        console.log(`[Training Data] Word2Vec tìm thấy ${similarResults.length} kết quả tương tự`);
        return similarResults.map(r => r.trainingData);
      }
    }

    // Fallback về keyword matching nếu Word2Vec không khả dụng hoặc không có kết quả
    console.log('[Training Data] Sử dụng keyword matching (fallback)');
    const keywords = userMessage.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const query: any = {
      isActive: true,
      $or: [
        { question: { $regex: userMessage, $options: 'i' } },
        { answer: { $regex: userMessage, $options: 'i' } },
        { tags: { $in: keywords } },
      ],
    };

    const trainingData = await TrainingData.find(query)
      .sort({ priority: -1, usageCount: -1 })
      .limit(limit)
      .lean();

    // Increment usage count
    if (trainingData.length > 0) {
      const ids = trainingData.map(td => td._id);
      await TrainingData.updateMany(
        { _id: { $in: ids } },
        { $inc: { usageCount: 1 } }
      );
    }

    return trainingData;
  } catch (error) {
    console.error('[Training Data] Error finding relevant data:', error);
    return [];
  }
}

// Generate AI response using Gemini
async function generateGeminiResponse(messages: ChatMessage[]): Promise<string> {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình');
  }

  try {
    // Separate system message from conversation
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    // Convert to Gemini format
    const contents = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Try different models in order of preference
    // Updated to use available models (gemini-2.5-flash, gemini-2.0-flash, etc.)
    const models = [
      { name: 'gemini-2.5-flash', version: 'v1beta' },
      { name: 'gemini-2.0-flash', version: 'v1beta' },
      { name: 'gemini-flash-latest', version: 'v1beta' },
      { name: 'gemini-pro-latest', version: 'v1beta' }
    ];
    let lastError: any = null;

    for (const modelConfig of models) {
      try {
        const { name: model, version } = modelConfig;
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`;
        
        console.log(`[Gemini] Trying model: ${model} (${version})`);
        console.log(`[Gemini] URL: ${url.substring(0, 100)}...`);
        
        // Create a copy of contents for this model attempt
        let modelContents = [...contents];
        
        // Build request body - start simple
        const requestBody: any = {
          contents: modelContents,
        };

        // Add generation config
        requestBody.generationConfig = {
          temperature: 0.7,
          maxOutputTokens: 2048,
        };

        // Add system instruction if available (for 2.0+ models)
        if (systemMessage && (model.includes('2.0') || model.includes('2.5'))) {
          requestBody.systemInstruction = {
            parts: [{ text: systemMessage.content }],
          };
        } else if (systemMessage) {
          // For older models, prepend system message as first user message
          modelContents.unshift({
            role: 'user',
            parts: [{ text: systemMessage.content }],
          });
          requestBody.contents = modelContents;
        }
        
        console.log(`[Gemini] Request body:`, JSON.stringify(requestBody, null, 2).substring(0, 500));

        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        });

        console.log(`[Gemini] Response status: ${response.status}`);
        console.log(`[Gemini] Response data keys:`, Object.keys(response.data || {}));

        const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          console.log(`[Gemini] ✅ Success with model: ${model}`);
          return generatedText;
        } else {
          console.warn(`[Gemini] ⚠️ No text in response for model: ${model}`);
          console.warn('[Gemini] Full response:', JSON.stringify(response.data, null, 2));
          
          // Check for finish reason
          const finishReason = response.data?.candidates?.[0]?.finishReason;
          if (finishReason) {
            console.warn(`[Gemini] Finish reason: ${finishReason}`);
          }
        }
      } catch (modelError: any) {
        const errorDetails = {
          status: modelError?.response?.status,
          statusText: modelError?.response?.statusText,
          errorMessage: modelError?.response?.data?.error?.message,
          errorCode: modelError?.response?.data?.error?.code,
          fullError: modelError?.response?.data
        };
        console.warn(`[Gemini] ⚠️ Model ${modelConfig.name} failed:`, errorDetails);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed, throw the last error
    if (lastError) {
      const errorMessage = lastError?.response?.data?.error?.message || lastError?.message || 'Unknown error';
      const statusCode = lastError?.response?.status || 'N/A';
      throw new Error(`Lỗi khi gọi Gemini API (${statusCode}): ${errorMessage}`);
    }

    throw new Error('Không nhận được phản hồi từ bất kỳ model nào');
  } catch (error: any) {
    console.error('[Gemini] ❌ API Error:');
    console.error('[Gemini] Status:', error?.response?.status);
    console.error('[Gemini] Status Text:', error?.response?.statusText);
    console.error('[Gemini] Response Data:', JSON.stringify(error?.response?.data, null, 2));
    console.error('[Gemini] Message:', error?.message);
    
    const errorMessage = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    const statusCode = error?.response?.status || 'N/A';
    throw new Error(`Lỗi khi gọi Gemini API (${statusCode}): ${errorMessage}`);
  }
}

// Generate AI response using OpenAI
async function generateOpenAIResponse(messages: ChatMessage[]): Promise<string> {
  if (!ENV.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY chưa được cấu hình');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        },
      }
    );

    const generatedText = response.data?.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('Không nhận được phản hồi từ OpenAI');
    }

    return generatedText;
  } catch (error: any) {
    console.error('OpenAI API Error:', error?.response?.data || error?.message);
    throw new Error(`Lỗi khi gọi OpenAI API: ${error?.message || 'Unknown error'}`);
  }
}

// Detect if user is asking about errors or debugging
function detectErrorRequest(userMessage: string): { isRequest: boolean; errorTypes?: string[] } {
  const lowerMessage = userMessage.toLowerCase();
  
  const errorKeywords = [
    'lỗi', 'error', 'bug', 'sai', 'không chạy', 'crash', 'exception',
    'undefined', 'null', 'syntax error', 'runtime error', 'compile error',
    'cách sửa', 'làm sao fix', 'giúp debug', 'gợi ý', 'hướng dẫn'
  ];
  
  const isRequest = errorKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!isRequest) {
    return { isRequest: false };
  }

  // Extract error types
  const errorTypes: string[] = [];
  const commonErrorTypes = ['syntax', 'logic', 'runtime', 'performance', 'timeout', 'memory'];
  commonErrorTypes.forEach(type => {
    if (lowerMessage.includes(type)) {
      errorTypes.push(type);
    }
  });

  return { isRequest: true, errorTypes };
}

// Get user's recent errors from submissions
async function getUserRecentErrors(userId: string): Promise<{
  errorTypes: Record<string, number>;
  errorMessages: string[];
  recentSubmissions: any[];
}> {
  try {
    const recentSubmissions = await Submission.find({
      user: new mongoose.Types.ObjectId(userId),
      status: { $ne: 'Accepted' }
    })
      .sort({ submittedAt: -1 })
      .limit(10)
      .lean();

    const errorTypes: Record<string, number> = {};
    const errorMessages: string[] = [];

    recentSubmissions.forEach(sub => {
      if (sub.aiAnalysis?.errorAnalyses) {
        sub.aiAnalysis.errorAnalyses.forEach((error: any) => {
          errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1;
          if (error.errorMessage) {
            errorMessages.push(error.errorMessage);
          }
        });
      }
      if (sub.errorMessage) {
        errorMessages.push(sub.errorMessage);
      }
    });

    return {
      errorTypes,
      errorMessages: [...new Set(errorMessages)].slice(0, 5),
      recentSubmissions: recentSubmissions.slice(0, 5),
    };
  } catch (error) {
    console.error('[Chat] Error getting user errors:', error);
    return { errorTypes: {}, errorMessages: [], recentSubmissions: [] };
  }
}

// Generate AI response (wrapper) with training data context
async function generateAIResponse(messages: ChatMessage[], userMessage?: string, userId?: string): Promise<string> {
  const startTime = Date.now();
  console.log('[Chat] generateAIResponse called');
  console.log(`[Chat] AI_PROVIDER: ${ENV.AI_PROVIDER}`);
  
  // Sử dụng Keyword Extraction Service để tạo context tự động
  let responseContext: any = null;
  let trainingContext = '';
  let challengesContext = '';
  let errorBasedContext = '';
  
  if (userMessage) {
    try {
      // OPTIMIZATION: Use Promise.race with timeout to prevent hanging
      // If keyword extraction takes too long, use fallback
      const contextPromise = keywordExtractionService.createResponseContext(userMessage, userId);
      responseContext = await Promise.race([
        contextPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Keyword extraction timeout')), 8000) // 8s timeout
        ),
      ]);
      
      const contextTime = Date.now() - startTime;
      console.log(`[Performance] Keyword extraction completed in ${contextTime}ms`);
      
      console.log('[Keyword Extraction] Created response context:', {
        trainingDataCount: responseContext?.trainingData?.length || 0,
        challengesCount: responseContext?.challenges?.length || 0,
        keywords: responseContext?.keywords || {},
      });

      // Build training context
      if (responseContext && responseContext.trainingData && responseContext.trainingData.length > 0) {
        trainingContext = '\n\n=== Training Data (Context từ BugHunter) ===\n';
        responseContext.trainingData.forEach((td: any, index: number) => {
          trainingContext += `\n[Ví dụ ${index + 1}]\nQ: ${td.question}\nA: ${td.answer}\n`;
        });
        trainingContext += '\n=== End Training Data ===\n\n';
        trainingContext += '⚠️ QUAN TRỌNG: Hãy sử dụng các ví dụ trên làm tham khảo. Nếu câu hỏi tương tự, hãy trả lời theo phong cách và nội dung tương tự.\n';
      }

      // Build challenges context
      if (responseContext && responseContext.challenges && responseContext.challenges.length > 0) {
        challengesContext = '\n\n=== DANH SÁCH BÀI TẬP (CHALLENGES TỪ BUGHUNTER) ===\n';
        challengesContext += 'Người dùng đang hỏi về bài tập/challenges. Bạn CẦN giới thiệu các bài tập sau:\n\n';
        responseContext.challenges.forEach((challenge: any, index: number) => {
          challengesContext += `📝 [Bài ${index + 1}] ${challenge.title}\n`;
          challengesContext += `   • Ngôn ngữ: ${challenge.language}\n`;
          challengesContext += `   • Độ khó: ${challenge.difficulty}\n`;
          challengesContext += `   • Điểm: ${challenge.points} điểm\n`;
          if (challenge.description) {
            challengesContext += `   • Mô tả: ${challenge.description.substring(0, 200)}${challenge.description.length > 200 ? '...' : ''}\n`;
          }
          challengesContext += '\n';
        });
        challengesContext += '=== HẾT DANH SÁCH BÀI TẬP ===\n\n';
        challengesContext += '⚠️ QUAN TRỌNG: Khi người dùng hỏi về bài tập/challenges, bạn CẦN:\n';
        challengesContext += '1. ✅ Giới thiệu các bài tập trên một cách hấp dẫn và chi tiết\n';
        challengesContext += '2. ✅ Liệt kê đầy đủ thông tin về mỗi bài tập\n';
        challengesContext += '3. ✅ Gợi ý người dùng thử làm các bài tập này trên BugHunter platform\n';
        challengesContext += '4. ✅ Khuyến khích và động viên người dùng\n';
      }

      // Build error-based context
      if (responseContext && responseContext.errorBasedRecommendations && responseContext.errorBasedRecommendations.length > 0) {
        errorBasedContext = '\n\n=== GỢI Ý DỰA TRÊN LỖI CỦA NGƯỜI DÙNG ===\n';
        errorBasedContext += 'Người dùng đã gặp các lỗi liên quan. Dưới đây là các gợi ý:\n\n';
        responseContext.errorBasedRecommendations.forEach((td: any, index: number) => {
          errorBasedContext += `[Gợi ý ${index + 1}]\nQ: ${td.question}\nA: ${td.answer}\n\n`;
        });
        errorBasedContext += '=== HẾT GỢI Ý ===\n\n';
        errorBasedContext += '⚠️ QUAN TRỌNG: Hãy tham khảo các gợi ý trên để trả lời câu hỏi về lỗi.\n';
      }
    } catch (error: any) {
      console.error('[Keyword Extraction] Error creating context, falling back to old method:', error?.message);
      
      // Fallback to old method with timeout
      try {
        const relevantData: any = await Promise.race([
          findRelevantTrainingData(userMessage, 3),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fallback timeout')), 5000)
          ),
        ]);
        
        if (relevantData.length > 0) {
          trainingContext = '\n\n=== Training Data (Context) ===\n';
          relevantData.forEach((td: any, index: number) => {
            trainingContext += `\n[Example ${index + 1}]\nQ: ${td.question}\nA: ${td.answer}\n`;
          });
          trainingContext += '\n=== End Training Data ===\n\n';
          trainingContext += 'Hãy sử dụng các ví dụ trên làm tham khảo khi trả lời. Nếu câu hỏi tương tự, hãy trả lời theo phong cách và nội dung tương tự.\n';
        }
      } catch (fallbackError: any) {
        console.error('[Chat] Fallback method also failed:', fallbackError?.message);
        // Continue without context - AI will still work
      }
    }
  }

  // Enhance system message với context từ keyword extraction
  let enhancedMessages = [...messages];
  const systemMessageIndex = enhancedMessages.findIndex(msg => msg.role === 'system');
  
  // Sử dụng system prompt từ keyword extraction service nếu có context
  if (responseContext) {
    try {
      const systemPrompt = keywordExtractionService.createSystemPrompt(responseContext as any);
      
      if (systemMessageIndex >= 0) {
        enhancedMessages[systemMessageIndex].content = systemPrompt;
      } else {
        enhancedMessages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }
    } catch (error: any) {
      console.error('[Chat] Error creating system prompt:', error);
      // Fallback to default system message
      if (systemMessageIndex < 0) {
        enhancedMessages.unshift({
          role: 'system',
          content: 'Bạn là trợ lý AI thông minh của BugHunter - một nền tảng học lập trình thông qua việc sửa lỗi code. Hãy trả lời một cách thân thiện, chính xác và hữu ích.',
        });
      }
    }
  } else {
    // Fallback: sử dụng context cũ nếu không có responseContext
    const additionalContext = trainingContext + challengesContext + errorBasedContext;
    
    if (systemMessageIndex >= 0 && additionalContext) {
      enhancedMessages[systemMessageIndex].content += additionalContext;
    } else if (additionalContext) {
      enhancedMessages.unshift({
        role: 'system',
        content: 'Bạn là trợ lý AI thông minh của BugHunter - một nền tảng học lập trình thông qua việc sửa lỗi code. Hãy trả lời một cách thân thiện, chính xác và hữu ích. Bạn có thể giúp người dùng học lập trình, debug code, giải thích các khái niệm, và trả lời các câu hỏi về lập trình.' + additionalContext,
      });
    }
  }
  
  if (ENV.AI_PROVIDER === 'openai' && ENV.OPENAI_API_KEY) {
    console.log('[Chat] Using OpenAI');
    return generateOpenAIResponse(enhancedMessages);
  } else if (ENV.GEMINI_API_KEY) {
    console.log('[Chat] Using Gemini');
    return generateGeminiResponse(enhancedMessages);
  } else {
    console.error('[Chat] ❌ No AI provider configured');
    console.error(`[Chat] ENV object:`, { 
      AI_PROVIDER: ENV.AI_PROVIDER, 
      hasGeminiKey: !!ENV.GEMINI_API_KEY,
      hasOpenAIKey: !!ENV.OPENAI_API_KEY 
    });
    throw new Error('Chưa cấu hình AI provider (GEMINI_API_KEY hoặc OPENAI_API_KEY)');
  }
}

export class ChatController {
  // Send message and get AI response
  async sendMessage(req: Request, res: Response): Promise<any> {
    const startTime = Date.now();
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        });
      }

      const { message, chatId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tin nhắn không được để trống',
        });
      }

      let chatHistory;
      
      // Nếu có chatId, tìm chat history hiện có
      if (chatId) {
        chatHistory = await ChatHistory.findOne({
          _id: chatId,
          userId,
        });

        if (!chatHistory) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy cuộc trò chuyện',
          });
        }
      } else {
        // Tạo chat history mới
        chatHistory = new ChatHistory({
          userId,
          messages: [],
          title: message.substring(0, 50), // Tạo title từ câu hỏi đầu tiên
        });
      }

      // Thêm tin nhắn của user
      chatHistory.messages.push({
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      });

      // Tạo context messages cho AI (chỉ lấy 10 tin nhắn gần nhất để tránh quá dài)
      const recentMessages = chatHistory.messages.slice(-10);
      const contextMessages: ChatMessage[] = [
        {
          role: 'system',
          content: 'Bạn là trợ lý AI thông minh của BugHunter - một nền tảng học lập trình thông qua việc sửa lỗi code. Hãy trả lời một cách thân thiện, chính xác và hữu ích. Bạn có thể giúp người dùng học lập trình, debug code, giải thích các khái niệm, và trả lời các câu hỏi về lập trình.',
        },
        ...recentMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      // Generate AI response with training data context using timeout
      let aiResponse: string;
      try {
        // Set timeout to prevent hanging (max 30 seconds)
        const responsePromise = generateAIResponse(contextMessages, message.trim(), userId);
        aiResponse = await Promise.race([
          responsePromise,
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Chat response timeout - please try again')), 30000)
          ),
        ]);
      } catch (error: any) {
        console.error('AI Response Error:', error);
        const elapsedTime = Date.now() - startTime;
        console.error(`[Chat Performance] Failed after ${elapsedTime}ms`);
        return res.status(500).json({
          success: false,
          message: error.message || 'Lỗi khi tạo phản hồi AI',
        });
      }

      // Thêm phản hồi của AI
      chatHistory.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      });

      // Cập nhật title nếu đây là tin nhắn đầu tiên
      if (chatHistory.messages.length === 2 && !chatHistory.title) {
        chatHistory.title = message.substring(0, 50);
      }

      // Lưu chat history (async, không cần chờ)
      chatHistory.save().catch(err => console.error('[Chat] Error saving history:', err));

      const elapsedTime = Date.now() - startTime;
      console.log(`[Chat Performance] Response generated in ${elapsedTime}ms`);

      return res.json({
        success: true,
        data: {
          chatId: chatHistory._id,
          message: {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Get chat history
  async getChatHistory(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        });
      }

      const { chatId } = req.params;

      const chatHistory = await ChatHistory.findOne({
        _id: chatId,
        userId,
      });

      if (!chatHistory) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc trò chuyện',
        });
      }

      return res.json({
        success: true,
        data: {
          chatId: chatHistory._id,
          title: chatHistory.title,
          messages: chatHistory.messages,
          createdAt: chatHistory.createdAt,
          updatedAt: chatHistory.updatedAt,
        },
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Get all chat histories for user
  async getAllChatHistories(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const chatHistories = await ChatHistory.find({ userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title messages createdAt updatedAt')
        .lean();

      const total = await ChatHistory.countDocuments({ userId });

      return res.json({
        success: true,
        data: {
          chats: chatHistories.map(chat => ({
            chatId: chat._id,
            title: chat.title,
            preview: chat.messages[0]?.content?.substring(0, 100) || '',
            messageCount: chat.messages.length,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all chat histories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Delete chat history
  async deleteChatHistory(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        });
      }

      const { chatId } = req.params;

      const chatHistory = await ChatHistory.findOneAndDelete({
        _id: chatId,
        userId,
      });

      if (!chatHistory) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc trò chuyện',
        });
      }

      return res.json({
        success: true,
        message: 'Đã xóa cuộc trò chuyện',
      });
    } catch (error) {
      console.error('Delete chat history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Rate message
  async rateMessage(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        });
      }

      const { chatId, messageIndex, rating } = req.body;

      if (!chatId || messageIndex === undefined || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin: chatId, messageIndex, rating',
        });
      }

      if (!['good', 'bad'].includes(rating)) {
        return res.status(400).json({
          success: false,
          message: 'Rating phải là "good" hoặc "bad"',
        });
      }

      const chatHistory = await ChatHistory.findOne({
        _id: chatId,
        userId,
      });

      if (!chatHistory) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc trò chuyện',
        });
      }

      if (messageIndex < 0 || messageIndex >= chatHistory.messages.length) {
        return res.status(400).json({
          success: false,
          message: 'Message index không hợp lệ',
        });
      }

      const message = chatHistory.messages[messageIndex];
      if (message.role !== 'assistant') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể rate message của AI',
        });
      }

      // Cập nhật rating
      chatHistory.messages[messageIndex].rating = rating as 'good' | 'bad';
      await chatHistory.save();

      console.log(`[Rating] User ${userId} rated message ${messageIndex} in chat ${chatId} as ${rating}`);

      return res.json({
        success: true,
        message: 'Đã lưu đánh giá',
        data: {
          rating,
        },
      });
    } catch (error) {
      console.error('Rate message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }
}

