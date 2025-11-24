import mongoose from 'mongoose';
import Challenge from '../src/models/challenge.model';
import User from '../src/models/user.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com'
};

// Bài tập: Tìm số lớn nhất trong 2 số
const newChallenge = {
  title: "Test: Tìm số lớn nhất",
  description: "Bài tập đơn giản để test tính năng submit - tìm số lớn nhất trong 2 số",
  problemStatement: `Viết hàm \`find_max(a, b)\` nhận vào 2 số nguyên và trả về số lớn nhất.

Ví dụ:
- find_max(5, 3) → 5
- find_max(-1, 10) → 10
- find_max(7, 7) → 7

Code mẫu để chạy:
\`\`\`python
def find_max(a, b):
    # Your code here
    pass

a = int(input())
b = int(input())
print(find_max(a, b))
\`\`\``,
  language: "Python",
  difficulty: "Easy" as const,
  category: "Logic" as const,
  tags: ["test", "simple", "comparison"],
  buggyCode: `def find_max(a, b):
    if a > b:
        return a
    else:
        return a  # Bug: nên return b

a = int(input())
b = int(input())
print(find_max(a, b))`,
  correctCode: `def find_max(a, b):
    if a > b:
        return a
    else:
        return b

a = int(input())
b = int(input())
print(find_max(a, b))`,
  testCases: [
    {
      input: "5\n3",
      expectedOutput: "5",
      isHidden: false,
      points: 10
    },
    {
      input: "-1\n10",
      expectedOutput: "10",
      isHidden: false,
      points: 10
    },
    {
      input: "7\n7",
      expectedOutput: "7",
      isHidden: false,
      points: 10
    },
    {
      input: "100\n-50",
      expectedOutput: "100",
      isHidden: false,
      points: 10
    }
  ],
  points: 40,
  timeLimit: 2,
  memoryLimit: 128,
  isActive: true
};

async function addChallenge() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Tìm admin user
    const admin = await User.findOne({ email: ENV.ADMIN_EMAIL });
    if (!admin) {
      console.error('❌ Không tìm thấy admin user');
      console.log('💡 Hãy chạy setup-database.ts trước để tạo admin user');
      return;
    }

    console.log(`👤 Tìm thấy admin: ${admin.username} (${admin.email})`);

    // Kiểm tra xem challenge đã tồn tại chưa
    const existing = await Challenge.findOne({ title: newChallenge.title });
    if (existing) {
      console.log(`⏭️  Challenge "${newChallenge.title}" đã tồn tại`);
      console.log(`   ID: ${existing._id}`);
      console.log(`   Active: ${existing.isActive}`);
      
      // Hỏi có muốn cập nhật không
      console.log('\n💡 Nếu muốn cập nhật, hãy xóa challenge cũ trước hoặc sửa script này');
      return;
    }

    // Tạo challenge mới
    console.log('\n📝 Đang tạo challenge mới...');
    const challenge = new Challenge({
      ...newChallenge,
      createdBy: admin._id
    });

    await challenge.save();
    console.log('✅ Đã tạo challenge thành công!');
    console.log(`\n📋 Thông tin challenge:`);
    console.log(`   ID: ${challenge._id}`);
    console.log(`   Title: ${challenge.title}`);
    console.log(`   Language: ${challenge.language}`);
    console.log(`   Difficulty: ${challenge.difficulty}`);
    console.log(`   Test Cases: ${challenge.testCases.length}`);
    console.log(`   Points: ${challenge.points}`);
    console.log(`   Active: ${challenge.isActive}`);

    // Hiển thị thống kê
    const totalChallenges = await Challenge.countDocuments();
    const activeChallenges = await Challenge.countDocuments({ isActive: true });
    
    console.log('\n📊 Thống kê database:');
    console.log(`   Tổng challenges: ${totalChallenges}`);
    console.log(`   Active challenges: ${activeChallenges}`);

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

// Chạy script
addChallenge();

