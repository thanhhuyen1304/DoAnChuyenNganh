import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as path from 'path';
import ChatHistory from '../src/models/chatHistory.model';
import TrainingData from '../src/models/trainingData.model';
import User from '../src/models/user.model';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Script để extract training data từ ChatHistory
 * Lấy các câu hỏi và câu trả lời từ lịch sử chat để làm training data
 */
async function extractTrainingFromChat() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    
    console.log('🔍 Đang kết nối MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Tìm admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ Không tìm thấy admin user');
      process.exit(1);
    }

    // Lấy tất cả chat history có rating = 'good'
    console.log('📚 Đang tìm chat history có rating tốt...');
    const chatHistories = await ChatHistory.find({
      'messages.rating': 'good'
    })
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`   Tìm thấy ${chatHistories.length} chat histories có rating tốt\n`);

    if (chatHistories.length === 0) {
      console.log('⚠️  Không có chat history nào có rating tốt để extract');
      console.log('   Bạn cần có chat history với rating = "good" trước');
      return;
    }

    let extractedCount = 0;
    let skippedCount = 0;

    console.log('📝 Đang extract training data từ chat history...\n');

    for (const chat of chatHistories) {
      const messages = chat.messages || [];
      
      // Tìm các cặp user message và assistant message với rating = 'good'
      for (let i = 0; i < messages.length - 1; i++) {
        const userMessage = messages[i];
        const assistantMessage = messages[i + 1];

        // Chỉ lấy nếu:
        // 1. User message trước
        // 2. Assistant message sau
        // 3. Assistant message có rating = 'good'
        if (
          userMessage.role === 'user' &&
          assistantMessage.role === 'assistant' &&
          assistantMessage.rating === 'good'
        ) {
          const question = userMessage.content.trim();
          const answer = assistantMessage.content.trim();

          // Bỏ qua nếu quá ngắn
          if (question.length < 10 || answer.length < 20) {
            skippedCount++;
            continue;
          }

          // Kiểm tra xem đã tồn tại chưa
          const existing = await TrainingData.findOne({
            question: question
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          // Tạo training data mới
          // Extract category và tags từ câu hỏi (đơn giản)
          const category = extractCategory(question);
          const tags = extractTags(question, answer);

          const trainingData = new TrainingData({
            question: question,
            answer: answer,
            category: category,
            tags: tags,
            priority: 5, // Default priority
            isActive: true,
            createdBy: adminUser._id,
          });

          await trainingData.save();
          extractedCount++;
          console.log(`   ✅ Đã extract: "${question.substring(0, 60)}${question.length > 60 ? '...' : ''}"`);
        }
      }
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   ✅ Đã extract: ${extractedCount} training data`);
    console.log(`   ⏭️  Đã bỏ qua: ${skippedCount} (trùng hoặc quá ngắn)`);

    // Thống kê
    const totalCount = await TrainingData.countDocuments();
    console.log(`\n📈 Tổng số training data hiện có: ${totalCount}`);

    console.log(`\n✅ Hoàn thành! Bây giờ bạn có thể train lại model: npm run train-word2vec\n`);

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Đã ngắt kết nối MongoDB');
    }
  }
}

/**
 * Extract category từ câu hỏi (simple keyword matching)
 */
function extractCategory(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('react') || lowerQuestion.includes('useState') || lowerQuestion.includes('useEffect')) {
    return 'react';
  }
  if (lowerQuestion.includes('javascript') || lowerQuestion.includes('js')) {
    return 'javascript';
  }
  if (lowerQuestion.includes('debug') || lowerQuestion.includes('lỗi') || lowerQuestion.includes('error')) {
    return 'debugging';
  }
  if (lowerQuestion.includes('bughunter') || lowerQuestion.includes('submit')) {
    return 'bughunter';
  }
  
  return 'general';
}

/**
 * Extract tags từ câu hỏi và câu trả lời
 */
function extractTags(question: string, answer: string): string[] {
  const tags: Set<string> = new Set();
  const text = `${question} ${answer}`.toLowerCase();
  
  // Common programming keywords
  const keywords = [
    'javascript', 'react', 'node', 'python', 'java', 'typescript',
    'useState', 'useEffect', 'hooks', 'async', 'await', 'promise',
    'debug', 'error', 'console', 'api', 'fetch', 'json',
    'array', 'object', 'function', 'component', 'state', 'props',
    'bughunter', 'submit', 'challenge', 'code', 'fix', 'bug'
  ];

  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}

// Run script
extractTrainingFromChat();

