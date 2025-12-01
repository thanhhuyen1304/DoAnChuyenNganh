import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Challenge from '../src/models/challenge.model';
import User from '../src/models/user.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';

async function importSumChallenge() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Tìm admin user để gán createdBy
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('⚠️ Không tìm thấy admin user, sẽ tìm user đầu tiên...');
      adminUser = await User.findOne();
    }

    if (!adminUser) {
      console.error('❌ Không tìm thấy user nào trong database!');
      console.log('💡 Vui lòng tạo user trước hoặc đăng ký tài khoản admin');
      process.exit(1);
    }

    console.log(`✅ Sử dụng user: ${adminUser.username} (${adminUser._id})`);

    // Kiểm tra xem bài tập đã tồn tại chưa
    const existingChallenge = await Challenge.findOne({ title: 'Tổng hai số' });
    
    if (existingChallenge) {
      console.log('⚠️ Bài tập "Tổng hai số" đã tồn tại!');
      console.log('🔄 Đang cập nhật bài tập...');
      
      // Cập nhật bài tập hiện có
      existingChallenge.description = 'Viết chương trình nhận vào hai số nguyên và in ra tổng của chúng.';
      existingChallenge.problemStatement = `# Đề bài: Tổng hai số

Viết chương trình nhận vào hai số nguyên và in ra tổng của chúng.

## Input
- Dòng đầu tiên chứa số nguyên **a** (-1000 ≤ a ≤ 1000)
- Dòng thứ hai chứa số nguyên **b** (-1000 ≤ b ≤ 1000)

## Output
In ra một số nguyên duy nhất là tổng của **a** và **b**

## Ví dụ

### Input
\`\`\`
5
3
\`\`\`

### Output
\`\`\`
8
\`\`\`

### Giải thích
5 + 3 = 8`;
      existingChallenge.language = 'Python';
      existingChallenge.difficulty = 'Easy';
      existingChallenge.category = 'Logic';
      existingChallenge.tags = ['math', 'basic', 'beginner', 'addition'];
      existingChallenge.buggyCode = `# Starter code
a = int(input())
b = int(input())
# Viết code của bạn ở đây
`;
      existingChallenge.testCases = [
        {
          input: '5\n3',
          expectedOutput: '8',
          isHidden: false,
          points: 10
        },
        {
          input: '0\n0',
          expectedOutput: '0',
          isHidden: false,
          points: 10
        },
        {
          input: '-10\n15',
          expectedOutput: '5',
          isHidden: false,
          points: 10
        },
        {
          input: '100\n-50',
          expectedOutput: '50',
          isHidden: false,
          points: 10
        },
        {
          input: '-999\n-1',
          expectedOutput: '-1000',
          isHidden: true,
          points: 15
        },
        {
          input: '1000\n-1000',
          expectedOutput: '0',
          isHidden: true,
          points: 15
        }
      ];
      existingChallenge.points = 70;
      existingChallenge.timeLimit = 1;
      existingChallenge.memoryLimit = 256;
      existingChallenge.isActive = true;

      await existingChallenge.save();
      console.log('✅ Đã cập nhật bài tập thành công!');
    } else {
      // Tạo bài tập mới
      const newChallenge = new Challenge({
        title: 'Tổng hai số',
        description: 'Viết chương trình nhận vào hai số nguyên và in ra tổng của chúng.',
        problemStatement: `# Đề bài: Tổng hai số

Viết chương trình nhận vào hai số nguyên và in ra tổng của chúng.

## Input
- Dòng đầu tiên chứa số nguyên **a** (-1000 ≤ a ≤ 1000)
- Dòng thứ hai chứa số nguyên **b** (-1000 ≤ b ≤ 1000)

## Output
In ra một số nguyên duy nhất là tổng của **a** và **b**

## Ví dụ

### Input
\`\`\`
5
3
\`\`\`

### Output
\`\`\`
8
\`\`\`

### Giải thích
5 + 3 = 8`,
        language: 'Python',
        difficulty: 'Easy',
        category: 'Logic',
        tags: ['math', 'basic', 'beginner', 'addition'],
        buggyCode: `# Starter code
a = int(input())
b = int(input())
# Viết code của bạn ở đây
`,
        testCases: [
          {
            input: '5\n3',
            expectedOutput: '8',
            isHidden: false,
            points: 10
          },
          {
            input: '0\n0',
            expectedOutput: '0',
            isHidden: false,
            points: 10
          },
          {
            input: '-10\n15',
            expectedOutput: '5',
            isHidden: false,
            points: 10
          },
          {
            input: '100\n-50',
            expectedOutput: '50',
            isHidden: false,
            points: 10
          },
          {
            input: '-999\n-1',
            expectedOutput: '-1000',
            isHidden: true,
            points: 15
          },
          {
            input: '1000\n-1000',
            expectedOutput: '0',
            isHidden: true,
            points: 15
          }
        ],
        points: 70, // Tổng điểm: 4*10 + 2*15 = 70
        timeLimit: 1, // 1 giây
        memoryLimit: 256, // 256 MB
        isActive: true,
        createdBy: adminUser._id
      });

      await newChallenge.save();
      console.log('✅ Đã tạo bài tập mới thành công!');
    }

    // Hiển thị thông tin bài tập
    const challenge = await Challenge.findOne({ title: 'Tổng hai số' });
    console.log('\n📝 Thông tin bài tập:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${challenge?._id}`);
    console.log(`Tiêu đề: ${challenge?.title}`);
    console.log(`Độ khó: ${challenge?.difficulty}`);
    console.log(`Ngôn ngữ: ${challenge?.language}`);
    console.log(`Điểm: ${challenge?.points}`);
    console.log(`Số test cases: ${challenge?.testCases.length}`);
    console.log(`  - Test cases công khai: ${challenge?.testCases.filter(tc => !tc.isHidden).length}`);
    console.log(`  - Test cases ẩn: ${challenge?.testCases.filter(tc => tc.isHidden).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Import hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi import bài tập:', error);
    process.exit(1);
  }
}

// Chạy script
importSumChallenge();