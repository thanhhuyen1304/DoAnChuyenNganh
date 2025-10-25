import mongoose from 'mongoose';
import User from '../src/models/user.model';
import Challenge from '../src/models/challenge.model';

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com',
  PORT: process.env.PORT || 5000
};

// Sample challenge data
const sampleChallenges = [
  {
    title: "Lỗi Syntax Python - Thiếu dấu hai chấm",
    description: "Tìm và sửa lỗi syntax thiếu dấu hai chấm trong Python",
    problemStatement: "Code sau có lỗi syntax, hãy tìm và sửa lỗi:",
    language: "Python",
    difficulty: "Easy",
    category: "Syntax",
    tags: ["python", "syntax", "beginner"],
    buggyCode: `def calculate_sum(a, b)
    return a + b

result = calculate_sum(5, 3)
print(result)`,
    correctCode: `def calculate_sum(a, b):
    return a + b

result = calculate_sum(5, 3)
print(result)`,
    testCases: [
      {
        input: "5 3",
        expectedOutput: "8",
        isHidden: false,
        points: 10
      },
      {
        input: "10 5",
        expectedOutput: "15",
        isHidden: true,
        points: 10
      }
    ],
    points: 20,
    timeLimit: 5,
    memoryLimit: 64,
    isActive: true
  },
  {
    title: "Lỗi Logic JavaScript - Vòng lặp vô hạn",
    description: "Tìm và sửa lỗi logic gây ra vòng lặp vô hạn",
    problemStatement: "Code sau có lỗi logic, hãy tìm và sửa lỗi:",
    language: "JavaScript",
    difficulty: "Medium",
    category: "Logic",
    tags: ["javascript", "logic", "loop"],
    buggyCode: `function countDown(n) {
    while (n > 0) {
        console.log(n);
        n = n + 1; // Lỗi: nên là n - 1
    }
    return "Done!";
}

console.log(countDown(5));`,
    correctCode: `function countDown(n) {
    while (n > 0) {
        console.log(n);
        n = n - 1; // Sửa lỗi
    }
    return "Done!";
}

console.log(countDown(5));`,
    testCases: [
      {
        input: "5",
        expectedOutput: "5\n4\n3\n2\n1\nDone!",
        isHidden: false,
        points: 15
      }
    ],
    points: 15,
    timeLimit: 10,
    memoryLimit: 128,
    isActive: true
  },
  {
    title: "Lỗi Logic Java - Thuật toán sắp xếp sai",
    description: "Tìm và sửa lỗi trong thuật toán sắp xếp bubble sort",
    problemStatement: "Code sau có lỗi logic trong thuật toán sắp xếp, hãy tìm và sửa lỗi:",
    language: "Java",
    difficulty: "Hard",
    category: "Logic",
    tags: ["java", "algorithm", "sorting"],
    buggyCode: `public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] < arr[j + 1]) { // Lỗi: nên là arr[j] > arr[j + 1]
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
        for (int i : arr) {
            System.out.print(i + " ");
        }
    }
}`,
    correctCode: `public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) { // Sửa lỗi
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
        for (int i : arr) {
            System.out.print(i + " ");
        }
    }
}`,
    testCases: [
      {
        input: "64 34 25 12 22 11 90",
        expectedOutput: "11 12 22 25 34 64 90",
        isHidden: false,
        points: 20
      }
    ],
    points: 20,
    timeLimit: 15,
    memoryLimit: 256,
    isActive: true
  }
];

async function setupDatabase() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Tạo admin user
    console.log('👤 Đang tạo admin user...');
    const adminExists = await User.findOne({ email: ENV.ADMIN_EMAIL });
    
    if (!adminExists) {
      const adminUser = new User({
        email: ENV.ADMIN_EMAIL,
        username: 'admin',
        password: 'admin123', // Mật khẩu mặc định, nên thay đổi sau
        favoriteLanguages: ['Python', 'JavaScript', 'Java'],
        experience: 1000,
        rank: 'Expert',
        badges: ['admin', 'founder']
      });
      
      await adminUser.save();
      console.log('✅ Admin user đã được tạo:');
      console.log(`   Email: ${ENV.ADMIN_EMAIL}`);
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
    } else {
      console.log('ℹ️  Admin user đã tồn tại');
    }

    // Tạo sample challenges
    console.log('📝 Đang tạo sample challenges...');
    const challengeCount = await Challenge.countDocuments();
    
    if (challengeCount === 0) {
      const adminUser = await User.findOne({ email: ENV.ADMIN_EMAIL });
      
      for (const challengeData of sampleChallenges) {
        const challenge = new Challenge({
          ...challengeData,
          createdBy: adminUser?._id
        });
        await challenge.save();
      }
      
      console.log(`✅ Đã tạo ${sampleChallenges.length} sample challenges`);
    } else {
      console.log(`ℹ️  Đã có ${challengeCount} challenges trong database`);
    }

    // Hiển thị thống kê
    console.log('\n📊 Thống kê database:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Challenges: ${await Challenge.countDocuments()}`);
    console.log(`   Active Challenges: ${await Challenge.countDocuments({ isActive: true })}`);

    console.log('\n🎉 Setup database hoàn tất!');
    console.log('\n📋 Thông tin đăng nhập admin:');
    console.log(`   URL: http://localhost:${ENV.PORT}/api/auth/login`);
    console.log(`   Email: ${ENV.ADMIN_EMAIL}`);
    console.log(`   Password: admin123`);
    console.log('\n⚠️  Lưu ý: Hãy thay đổi mật khẩu admin sau khi đăng nhập lần đầu!');

  } catch (error) {
    console.error('❌ Lỗi setup database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

// Chạy setup nếu file được gọi trực tiếp
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
