import axios from 'axios';
import ChatHistory from '../models/chatHistory.model';
import TrainingData from '../models/trainingData.model';
import Challenge from '../models/challenge.model';
import Submission from '../models/submission.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

// ============================================
// CONFIG
// ============================================
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Cache để tránh fetch models nhiều lần
let cachedModel: string | null = null;

// ============================================
// SYSTEM PROMPT (Tùy chỉnh theo dự án)
// ============================================
const SYSTEM_PROMPT = `Bạn là trợ lý AI thân thiện và chuyên nghiệp của BugHunter - một nền tảng học lập trình thông qua việc sửa lỗi code.

NHIỆM VỤ:
- Phân tích dữ liệu và đưa ra lời khuyên cụ thể về lập trình
- Giúp người dùng hiểu rõ thông tin của họ (bài tập, thử thách, tiến độ học tập)
- Đề xuất giải pháp phù hợp cho các vấn đề lập trình
- Hỗ trợ debug code và giải thích các khái niệm lập trình

PHONG CÁCH:
- Nói tiếng Việt tự nhiên, gần gũi
- Dùng emoji phù hợp (💡, 📊, 🎯, ✨, 🐛, 💻)
- Luôn lạc quan và động viên
- Đưa ra lời khuyên cụ thể với số liệu rõ ràng

NGUYÊN TẮC:
- Không đề cập thông tin nhạy cảm
- Không khuyên người dùng làm điều rủi ro
- Luôn khuyến khích hành vi tích cực
- Tập trung vào việc học lập trình và cải thiện kỹ năng`;

// ============================================
// HELPER: Tự động chọn model ổn định
// ============================================
async function getAvailableModel(): Promise<string> {
  if (cachedModel) return cachedModel;
  
  try {
    console.log('[AIChatService] Fetching available Gemini models...');
    const response = await axios.get(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      { timeout: 10000 }
    );
    
    if (response.data?.models) {
      const models = response.data.models;
      
      // Ưu tiên model ổn định (tránh beta/experimental)
      const stable = models.find((m: any) => 
        m.name.includes('gemini-1.5-flash') && 
        !m.name.includes('2.5') &&
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      cachedModel = stable?.name || models.find((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      )?.name;
      
      if (cachedModel) {
        console.log(`[AIChatService] Using model: ${cachedModel}`);
        return cachedModel;
      }
    }
    
    throw new Error('No available models found');
  } catch (error: any) {
    console.error('[AIChatService] Error fetching models:', error.message);
    cachedModel = `models/${GEMINI_MODEL}`;
    return cachedModel;
  }
}

// ============================================
// HELPER: Gọi Gemini API
// ============================================
async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
      console.warn('[AIChatService] GEMINI_API_KEY chưa được cấu hình, sử dụng fallback response');
      return 'Xin lỗi, hệ thống AI chưa được cấu hình. Vui lòng liên hệ quản trị viên. 🙏';
    }

    const modelName = await getAvailableModel();
    const modelPath = typeof modelName === 'string' ? modelName : modelName;
    const cleanModelName = modelPath.replace('models/', '');
    
    const url = `${GEMINI_API_URL}/${cleanModelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(
      url,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,      // Creativity (0-1)
          maxOutputTokens: 4096, // Max response length
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    // Parse response
    if (response.data?.candidates?.[0]) {
      const candidate = response.data.candidates[0];
      
      // Handle safety blocks
      if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
        return 'Xin lỗi, câu hỏi không phù hợp với chính sách an toàn. 🙏';
      }
      
      // Get text response
      if (candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
      }
    }

    console.error('[AIChatService] Invalid Gemini response:', response.data);
    return 'Xin lỗi, tôi không thể xử lý câu hỏi này. Hãy thử lại! 😊';
    
  } catch (error: any) {
    console.error('[AIChatService] Gemini API call failed:', error.message);
    
    // Provide user-friendly error messages
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'Xin lỗi, API key không hợp lệ. Vui lòng liên hệ quản trị viên. 🔑';
    } else if (error.response?.status === 429) {
      return 'Xin lỗi, hệ thống đang quá tải. Vui lòng thử lại sau vài giây. ⏳';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return 'Xin lỗi, không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau. 🌐';
    }
    
    throw error;
  }
}

// ============================================
// MAIN SERVICE CLASS
// ============================================
class AIChatService {
  
  // Lấy context từ database (Tùy chỉnh theo dự án)
  async getUserContext(userId: string) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        return {
          hasData: false,
          message: 'Chưa có dữ liệu người dùng'
        };
      }

      // Lấy thống kê của user
      const completedChallenges = await Challenge.countDocuments({
        _id: { $in: user.completedChallenges || [] }
      });

      const totalSubmissions = await Submission.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });

      return {
        hasData: true,
        data: {
          experience: user.experience || 0,
          rank: user.rank || 'Newbie',
          completedChallenges,
          totalSubmissions,
          badges: user.badges?.length || 0
        }
      };
    } catch (error) {
      console.error('[AIChatService] Error getting user context:', error);
      return { hasData: false, message: 'Không thể lấy dữ liệu' };
    }
  }

  // Format context thành text cho AI
  formatContext(context: any): string {
    if (!context.hasData) return context.message;
    
    const { data } = context;
    return `Thông tin người dùng:
- Điểm kinh nghiệm: ${data.experience}
- Hạng: ${data.rank}
- Số bài tập đã hoàn thành: ${data.completedChallenges}
- Tổng số lần submit: ${data.totalSubmissions}
- Số huy hiệu: ${data.badges}`;
  }

  // Lấy lịch sử chat (giới hạn 3 tin nhắn gần nhất)
  async getChatHistory(userId: string, limit: number = 3) {
    try {
      const chatHistory = await ChatHistory.findOne({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .lean();

      if (!chatHistory || !chatHistory.messages) {
        return [];
      }

      // Lấy tin nhắn gần nhất (loại bỏ system messages)
      const recentMessages = chatHistory.messages
        .filter(msg => msg.role !== 'system')
        .slice(-limit)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      return recentMessages;
    } catch (error) {
      console.error('[AIChatService] Error getting chat history:', error);
      return [];
    }
  }

  // Gửi tin nhắn và nhận response
  async sendMessage(userId: string, userMessage: string) {
    try {
      // 1. Lấy context từ DB
      const context = await this.getUserContext(userId);
      const contextText = this.formatContext(context);
      
      // 2. Lấy lịch sử chat
      const history = await this.getChatHistory(userId, 3);
      
      // 3. Build prompt
      let fullPrompt = SYSTEM_PROMPT + '\n\n';
      
      if (context.hasData) {
        fullPrompt += `Context:\n${contextText}\n\n`;
      }
      
      if (history.length > 0) {
        fullPrompt += 'Recent chat:\n';
        history.forEach(msg => {
          fullPrompt += `${msg.role}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      
      fullPrompt += `User: ${userMessage}\n\nAssistant:`;
      
      // 4. Save user message to chat history (using ChatHistory model)
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      let chatHistory = await ChatHistory.findOne({ userId: userIdObjectId })
        .sort({ updatedAt: -1 });
      
      if (!chatHistory) {
        chatHistory = new ChatHistory({
          userId: userIdObjectId,
          messages: [],
          title: userMessage.substring(0, 50)
        });
      }
      
      chatHistory.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });
      
      // 5. Call AI
      const aiResponse = await callGeminiAPI(fullPrompt);
      
      // 6. Save AI response to chat history
      chatHistory.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      
      await chatHistory.save();
      
      // Also save to ChatMessage model for individual message tracking
      try {
        const ChatMessageModule = await import('../models/chatMessage.model');
        const ChatMessage = ChatMessageModule.default;
        await ChatMessage.create({
          userId: userIdObjectId,
          role: 'user',
          content: userMessage,
          metadata: {
            contextUsed: context.hasData,
            timestamp: new Date()
          }
        });
        await ChatMessage.create({
          userId: userIdObjectId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            contextUsed: context.hasData,
            timestamp: new Date(),
            model: GEMINI_MODEL
          }
        });
      } catch (msgError: any) {
        console.error('[AIChatService] Error saving to ChatMessage:', msgError?.message || msgError);
        // Continue even if ChatMessage save fails
      }
      
      return {
        success: true,
        message: aiResponse,
        hasContext: context.hasData
      };
      
    } catch (error: any) {
      console.error('[AIChatService] Error in sendMessage:', error);
      
      return {
        success: false,
        message: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại! 😔'
      };
    }
  }

  // Xóa lịch sử chat
  async clearHistory(userId: string) {
    try {
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      await ChatHistory.deleteMany({ userId: userIdObjectId });
      
      // Also clear ChatMessage records
      try {
        const ChatMessageModule = await import('../models/chatMessage.model');
        const ChatMessage = ChatMessageModule.default;
        await ChatMessage.deleteMany({ userId: userIdObjectId });
      } catch (msgError: any) {
        console.error('[AIChatService] Error clearing ChatMessage:', msgError?.message || msgError);
      }
      
      return { success: true, message: 'Đã xóa lịch sử' };
    } catch (error) {
      console.error('[AIChatService] Error clearing history:', error);
      return { success: false, message: 'Không thể xóa lịch sử' };
    }
  }
}

export default new AIChatService();

