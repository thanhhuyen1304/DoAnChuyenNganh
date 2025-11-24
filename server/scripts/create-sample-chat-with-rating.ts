import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as path from 'path';
import ChatHistory from '../src/models/chatHistory.model';
import User from '../src/models/user.model';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createSampleChatWithRating() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    
    console.log('🔍 Đang kết nối MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Tìm một user (bất kỳ user nào)
    const user = await User.findOne();
    if (!user) {
      console.error('❌ Không tìm thấy user nào. Cần có ít nhất 1 user để tạo chat history.');
      process.exit(1);
    }

    console.log(`👤 Sử dụng user: ${user.email || user.username}\n`);

    // Kiểm tra xem đã có chat history với rating chưa
    const existingWithRating = await ChatHistory.countDocuments({
      'messages.rating': 'good'
    });

    if (existingWithRating > 0) {
      console.log(`ℹ️  Đã có ${existingWithRating} chat history với rating tốt`);
      console.log('   Không cần tạo thêm mẫu\n');
      
      // Hiển thị thống kê hiện có
      const totalChats = await ChatHistory.countDocuments();
      console.log(`📊 Tổng số chat history: ${totalChats}`);
      return;
    }

    // Tạo một số chat history mẫu với rating tốt
    console.log('📝 Đang tạo chat history mẫu với rating tốt...\n');

    const sampleChats = [
      {
        userId: user._id,
        title: 'Làm sao debug lỗi JavaScript?',
        messages: [
          {
            role: 'user' as const,
            content: 'Làm sao debug lỗi JavaScript?',
            timestamp: new Date(),
          },
          {
            role: 'assistant' as const,
            content: 'Để debug lỗi JavaScript, bạn có thể:\n\n1. **Sử dụng console.log()**: In giá trị biến để kiểm tra\n   ```javascript\n   console.log(\'Variable:\', myVariable);\n   ```\n\n2. **Sử dụng debugger statement**: Dừng code tại điểm cụ thể\n   ```javascript\n   debugger; // Code sẽ dừng ở đây khi mở DevTools\n   ```\n\n3. **Sử dụng DevTools**: Nhấn F12 để mở Developer Tools\n   - Console tab: Xem logs và errors\n   - Sources tab: Đặt breakpoints\n   - Network tab: Kiểm tra API calls',
            timestamp: new Date(),
            rating: 'good' as const,
          },
        ],
      },
      {
        userId: user._id,
        title: 'React hooks là gì?',
        messages: [
          {
            role: 'user' as const,
            content: 'React hooks là gì?',
            timestamp: new Date(),
          },
          {
            role: 'assistant' as const,
            content: 'React Hooks là các functions cho phép bạn sử dụng state và các tính năng React khác trong functional components.\n\n**Các hooks phổ biến:**\n\n1. **useState**: Quản lý state\n   ```javascript\n   const [count, setCount] = useState(0);\n   ```\n\n2. **useEffect**: Side effects (API calls, subscriptions)\n   ```javascript\n   useEffect(() => {\n     // Code chạy sau mỗi render\n   }, [dependencies]);\n   ```\n\n3. **useContext**: Truy cập context\n4. **useReducer**: Quản lý state phức tạp\n5. **useMemo**: Memoize giá trị\n6. **useCallback**: Memoize function',
            timestamp: new Date(),
            rating: 'good' as const,
          },
        ],
      },
      {
        userId: user._id,
        title: 'Cách sử dụng async/await?',
        messages: [
          {
            role: 'user' as const,
            content: 'Cách xử lý async/await trong JavaScript?',
            timestamp: new Date(),
          },
          {
            role: 'assistant' as const,
            content: 'async/await là cách hiện đại để xử lý asynchronous code trong JavaScript.\n\n**Cú pháp:**\n```javascript\nasync function myFunction() {\n  try {\n    const result = await someAsyncOperation();\n    return result;\n  } catch (error) {\n    console.error(\'Error:\', error);\n  }\n}\n```\n\n**Ví dụ với fetch API:**\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch(\'https://api.example.com/data\');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(\'Fetch error:\', error);\n    throw error;\n  }\n}\n```',
            timestamp: new Date(),
            rating: 'good' as const,
          },
        ],
      },
    ];

    let createdCount = 0;

    for (const chatData of sampleChats) {
      // Kiểm tra xem đã tồn tại chưa
      const existing = await ChatHistory.findOne({
        userId: chatData.userId,
        title: chatData.title,
      });

      if (existing) {
        console.log(`   ⏭️  Đã bỏ qua: "${chatData.title}" (đã tồn tại)`);
        continue;
      }

      const chatHistory = new ChatHistory(chatData);
      await chatHistory.save();
      createdCount++;
      console.log(`   ✅ Đã tạo: "${chatData.title}"`);
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   ✅ Đã tạo: ${createdCount} chat history với rating tốt`);

    // Thống kê
    const totalChats = await ChatHistory.countDocuments();
    const chatsWithGoodRating = await ChatHistory.countDocuments({
      'messages.rating': 'good'
    });

    console.log(`\n📈 Thống kê:`);
    console.log(`   Tổng số chat history: ${totalChats}`);
    console.log(`   Chat với rating tốt: ${chatsWithGoodRating}`);

    console.log(`\n✅ Hoàn thành! Bây giờ bạn có thể:`);
    console.log(`   1. Chạy: npm run check-chat-history`);
    console.log(`   2. Chạy: npm run extract-training-from-chat`);
    console.log(`   3. Hoặc: Click nút "Extract từ Chat" trong Admin Panel\n`);

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
createSampleChatWithRating();

