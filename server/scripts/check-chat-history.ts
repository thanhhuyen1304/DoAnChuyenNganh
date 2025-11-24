import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as path from 'path';
import ChatHistory from '../src/models/chatHistory.model';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkChatHistory() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    
    console.log('🔍 Đang kết nối MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Đếm tổng số chat history
    const totalChats = await ChatHistory.countDocuments();
    console.log(`📚 Tổng số chat history: ${totalChats}`);

    if (totalChats === 0) {
      console.log('⚠️  Không có chat history nào trong database');
      console.log('   Bạn cần có chat history trước để extract training data\n');
      return;
    }

    // Đếm chat history có rating
    const chatsWithGoodRating = await ChatHistory.find({
      'messages.rating': 'good'
    }).lean();

    const chatsWithBadRating = await ChatHistory.find({
      'messages.rating': 'bad'
    }).lean();

    console.log(`\n📊 Thống kê Rating:`);
    console.log(`   ✅ Good rating: ${chatsWithGoodRating.length} chats`);
    console.log(`   ❌ Bad rating: ${chatsWithBadRating.length} chats`);
    console.log(`   📝 No rating: ${totalChats - chatsWithGoodRating.length - chatsWithBadRating.length} chats`);

    // Đếm số messages có rating = 'good'
    let goodMessagesCount = 0;
    let extractablePairs = 0;

    for (const chat of chatsWithGoodRating) {
      const messages = chat.messages || [];
      for (let i = 0; i < messages.length - 1; i++) {
        const userMessage = messages[i];
        const assistantMessage = messages[i + 1];

        if (
          userMessage.role === 'user' &&
          assistantMessage.role === 'assistant' &&
          assistantMessage.rating === 'good'
        ) {
          goodMessagesCount++;
          const question = userMessage.content.trim();
          const answer = assistantMessage.content.trim();
          
          if (question.length >= 10 && answer.length >= 20) {
            extractablePairs++;
          }
        }
      }
    }

    console.log(`\n📈 Có thể extract:`);
    console.log(`   💬 Messages với rating tốt: ${goodMessagesCount}`);
    console.log(`   ✅ Cặp có thể extract: ${extractablePairs} (question >= 10, answer >= 20)`);

    // Hiển thị một vài mẫu
    if (chatsWithGoodRating.length > 0) {
      console.log(`\n📋 Mẫu chat history có rating tốt (${Math.min(3, chatsWithGoodRating.length)} mẫu):`);
      
      for (let i = 0; i < Math.min(3, chatsWithGoodRating.length); i++) {
        const chat = chatsWithGoodRating[i];
        const messages = chat.messages || [];
        
        // Tìm cặp user-assistant với rating = 'good'
        for (let j = 0; j < messages.length - 1; j++) {
          const userMessage = messages[j];
          const assistantMessage = messages[j + 1];

          if (
            userMessage.role === 'user' &&
            assistantMessage.role === 'assistant' &&
            assistantMessage.rating === 'good'
          ) {
            console.log(`\n   ${i + 1}. Chat ID: ${chat._id}`);
            console.log(`      Question: ${userMessage.content.substring(0, 80)}${userMessage.content.length > 80 ? '...' : ''}`);
            console.log(`      Answer: ${assistantMessage.content.substring(0, 80)}${assistantMessage.content.length > 80 ? '...' : ''}`);
            console.log(`      Rating: ✅ ${assistantMessage.rating}`);
            break;
          }
        }
      }
    } else {
      console.log(`\n⚠️  Không có chat history nào có rating tốt`);
      console.log(`   Bạn cần:`);
      console.log(`   1. Chat với chatbot`);
      console.log(`   2. Đánh giá câu trả lời tốt (rating = 'good')`);
      console.log(`   3. Sau đó chạy lại script này để kiểm tra\n`);
    }

    console.log(`\n💡 Gợi ý:`);
    if (extractablePairs > 0) {
      console.log(`   Bạn có thể extract ${extractablePairs} training data từ ChatHistory`);
      console.log(`   Sử dụng: npm run extract-training-from-chat`);
      console.log(`   Hoặc: Click nút "Extract từ Chat" trong Admin Panel\n`);
    } else {
      console.log(`   Chưa có dữ liệu để extract. Hãy chat và đánh giá câu trả lời tốt trước.\n`);
    }

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

// Run script
checkChatHistory();

