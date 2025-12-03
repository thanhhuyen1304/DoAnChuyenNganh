/**
 * Script Seed Challenges Mẫu
 * Tạo 10+ challenges với các ngôn ngữ và độ khó khác nhau
 * 
 * Usage:
 *   npx ts-node scripts/seed-challenges.ts
 */

import mongoose from 'mongoose';
import Challenge from '../src/models/challenge.model';
import User from '../src/models/user.model';

// Lấy MONGODB_URI từ env, nếu không có thì dùng default
// Xử lý case sensitivity của database name
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
// Nếu URI có /bughunter, thử thay bằng /BugHunter (case sensitivity)
if (MONGODB_URI.includes('/bughunter') && !MONGODB_URI.includes('/BugHunter')) {
  // Thử với BugHunter trước
  const uriWithBugHunter = MONGODB_URI.replace('/bughunter', '/BugHunter');
  MONGODB_URI = uriWithBugHunter;
}

const challengeSamples = [
  // Python Challenges
  {
    title: 'Tính Tổng Hai Số',
    description: 'Viết hàm tính tổng hai số nguyên',
    problemStatement: 'Viết hàm sum(a, b) nhận vào hai số nguyên a và b, trả về tổng của chúng.',
    language: 'Python',
    difficulty: 'Easy',
    category: 'Logic',
    tags: ['python', 'basic', 'function', 'math'],
    buggyCode: 'def sum(a, b):\n    return a - b  # Bug: dùng phép trừ thay vì cộng',
    testCases: [
      { input: '2\n3', expectedOutput: '5', isHidden: false, points: 20 },
      { input: '10\n20', expectedOutput: '30', isHidden: false, points: 20 },
      { input: '-5\n5', expectedOutput: '0', isHidden: false, points: 20 },
      { input: '0\n0', expectedOutput: '0', isHidden: true, points: 20 },
      { input: '100\n200', expectedOutput: '300', isHidden: true, points: 20 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Kiểm Tra Số Chẵn',
    description: 'Viết hàm kiểm tra số chẵn',
    problemStatement: 'Viết hàm is_even(n) nhận vào một số nguyên n, trả về True nếu n là số chẵn, False nếu n là số lẻ.',
    language: 'Python',
    difficulty: 'Easy',
    category: 'Logic',
    tags: ['python', 'basic', 'condition', 'modulo'],
    buggyCode: 'def is_even(n):\n    return n % 2 == 1  # Bug: logic ngược',
    testCases: [
      { input: '2', expectedOutput: 'True', isHidden: false, points: 25 },
      { input: '3', expectedOutput: 'False', isHidden: false, points: 25 },
      { input: '0', expectedOutput: 'True', isHidden: false, points: 25 },
      { input: '-4', expectedOutput: 'True', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Tìm Số Lớn Nhất',
    description: 'Tìm số lớn nhất trong danh sách',
    problemStatement: 'Viết hàm find_max(numbers) nhận vào một danh sách các số nguyên, trả về số lớn nhất trong danh sách.',
    language: 'Python',
    difficulty: 'Easy',
    category: 'Logic',
    tags: ['python', 'list', 'algorithm', 'max'],
    buggyCode: 'def find_max(numbers):\n    if not numbers:\n        return None\n    max_num = numbers[0]\n    for num in numbers:\n        if num < max_num:  # Bug: dùng < thay vì >\n            max_num = num\n    return max_num',
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expectedOutput: '5', isHidden: false, points: 20 },
      { input: '[10, 5, 20, 15]', expectedOutput: '20', isHidden: false, points: 20 },
      { input: '[-5, -2, -10]', expectedOutput: '-2', isHidden: false, points: 20 },
      { input: '[42]', expectedOutput: '42', isHidden: true, points: 20 },
      { input: '[1, 1, 1, 1]', expectedOutput: '1', isHidden: true, points: 20 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Đảo Ngược Chuỗi',
    description: 'Viết hàm đảo ngược chuỗi',
    problemStatement: 'Viết hàm reverse_string(s) nhận vào một chuỗi s, trả về chuỗi đã được đảo ngược.',
    language: 'Python',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['python', 'string', 'algorithm'],
    buggyCode: 'def reverse_string(s):\n    return s  # Bug: không đảo ngược',
    testCases: [
      { input: '"hello"', expectedOutput: 'olleh', isHidden: false, points: 25 },
      { input: '"world"', expectedOutput: 'dlrow', isHidden: false, points: 25 },
      { input: '""', expectedOutput: '""', isHidden: false, points: 25 },
      { input: '"a"', expectedOutput: 'a', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Tính Giai Thừa',
    description: 'Viết hàm tính giai thừa',
    problemStatement: 'Viết hàm factorial(n) nhận vào một số nguyên dương n, trả về giai thừa của n (n!).',
    language: 'Python',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['python', 'recursion', 'math', 'algorithm'],
    buggyCode: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 2)  # Bug: n-2 thay vì n-1',
    testCases: [
      { input: '5', expectedOutput: '120', isHidden: false, points: 25 },
      { input: '3', expectedOutput: '6', isHidden: false, points: 25 },
      { input: '1', expectedOutput: '1', isHidden: false, points: 25 },
      { input: '0', expectedOutput: '1', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  
  // JavaScript Challenges
  {
    title: 'Tính Tổng Mảng',
    description: 'Tính tổng các phần tử trong mảng',
    problemStatement: 'Viết hàm sumArray(arr) nhận vào một mảng các số, trả về tổng của tất cả các phần tử trong mảng.',
    language: 'JavaScript',
    difficulty: 'Easy',
    category: 'Logic',
    tags: ['javascript', 'array', 'basic', 'math'],
    buggyCode: 'function sumArray(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum -= arr[i];  // Bug: dùng phép trừ\n  }\n  return sum;\n}',
    testCases: [
      { input: '[1, 2, 3, 4]', expectedOutput: '10', isHidden: false, points: 25 },
      { input: '[10, 20, 30]', expectedOutput: '60', isHidden: false, points: 25 },
      { input: '[-5, 5, 10]', expectedOutput: '10', isHidden: false, points: 25 },
      { input: '[0]', expectedOutput: '0', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Tìm Số Nhỏ Nhất',
    description: 'Tìm số nhỏ nhất trong mảng',
    problemStatement: 'Viết hàm findMin(arr) nhận vào một mảng các số, trả về số nhỏ nhất trong mảng.',
    language: 'JavaScript',
    difficulty: 'Easy',
    category: 'Logic',
    tags: ['javascript', 'array', 'algorithm', 'min'],
    buggyCode: 'function findMin(arr) {\n  if (arr.length === 0) return null;\n  let min = arr[0];\n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] > min) {  // Bug: dùng > thay vì <\n      min = arr[i];\n    }\n  }\n  return min;\n}',
    testCases: [
      { input: '[5, 2, 8, 1]', expectedOutput: '1', isHidden: false, points: 25 },
      { input: '[10, 20, 5, 15]', expectedOutput: '5', isHidden: false, points: 25 },
      { input: '[-5, -2, -10]', expectedOutput: '-10', isHidden: false, points: 25 },
      { input: '[42]', expectedOutput: '42', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Kiểm Tra Palindrome',
    description: 'Kiểm tra chuỗi có phải palindrome không',
    problemStatement: 'Viết hàm isPalindrome(s) nhận vào một chuỗi s, trả về true nếu s là palindrome (đọc xuôi và ngược giống nhau), false nếu không.',
    language: 'JavaScript',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['javascript', 'string', 'algorithm', 'palindrome'],
    buggyCode: 'function isPalindrome(s) {\n  const reversed = s.split("").reverse().join("");\n  return s !== reversed;  // Bug: logic ngược\n}',
    testCases: [
      { input: '"racecar"', expectedOutput: 'true', isHidden: false, points: 25 },
      { input: '"hello"', expectedOutput: 'false', isHidden: false, points: 25 },
      { input: '"a"', expectedOutput: 'true', isHidden: false, points: 25 },
      { input: '""', expectedOutput: 'true', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Đếm Số Ký Tự',
    description: 'Đếm số lần xuất hiện của ký tự trong chuỗi',
    problemStatement: 'Viết hàm countChar(str, char) nhận vào một chuỗi str và một ký tự char, trả về số lần char xuất hiện trong str.',
    language: 'JavaScript',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['javascript', 'string', 'algorithm', 'counting'],
    buggyCode: 'function countChar(str, char) {\n  let count = 0;\n  for (let i = 0; i < str.length; i++) {\n    if (str[i] !== char) {  // Bug: dùng !== thay vì ===\n      count++;\n    }\n  }\n  return count;\n}',
    testCases: [
      { input: '"hello", "l"', expectedOutput: '2', isHidden: false, points: 25 },
      { input: '"javascript", "a"', expectedOutput: '2', isHidden: false, points: 25 },
      { input: '"test", "x"', expectedOutput: '0', isHidden: false, points: 25 },
      { input: '"aaa", "a"', expectedOutput: '3', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Tính Fibonacci',
    description: 'Tính số Fibonacci thứ n',
    problemStatement: 'Viết hàm fibonacci(n) nhận vào một số nguyên n, trả về số Fibonacci thứ n. Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)',
    language: 'JavaScript',
    difficulty: 'Hard',
    category: 'Logic',
    tags: ['javascript', 'algorithm', 'fibonacci', 'recursion'],
    buggyCode: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 3);  // Bug: n-3 thay vì n-2\n}',
    testCases: [
      { input: '5', expectedOutput: '5', isHidden: false, points: 20 },
      { input: '7', expectedOutput: '13', isHidden: false, points: 20 },
      { input: '0', expectedOutput: '0', isHidden: false, points: 20 },
      { input: '1', expectedOutput: '1', isHidden: false, points: 20 },
      { input: '10', expectedOutput: '55', isHidden: true, points: 20 },
    ],
    points: 100,
    timeLimit: 10,
    memoryLimit: 128,
  },
  
  // More Python Challenges
  {
    title: 'Kiểm Tra Số Nguyên Tố',
    description: 'Viết hàm kiểm tra số nguyên tố',
    problemStatement: 'Viết hàm is_prime(n) nhận vào một số nguyên dương n, trả về True nếu n là số nguyên tố, False nếu không.',
    language: 'Python',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['python', 'math', 'algorithm', 'prime'],
    buggyCode: 'def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, n):\n        if n % i == 0:\n            return True  # Bug: return True thay vì False\n    return False',
    testCases: [
      { input: '7', expectedOutput: 'True', isHidden: false, points: 25 },
      { input: '10', expectedOutput: 'False', isHidden: false, points: 25 },
      { input: '2', expectedOutput: 'True', isHidden: false, points: 25 },
      { input: '1', expectedOutput: 'False', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Tìm Ước Chung Lớn Nhất',
    description: 'Tìm GCD của hai số',
    problemStatement: 'Viết hàm gcd(a, b) nhận vào hai số nguyên dương a và b, trả về ước chung lớn nhất (GCD) của chúng.',
    language: 'Python',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['python', 'math', 'algorithm', 'gcd'],
    buggyCode: 'def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return b  # Bug: return b thay vì a',
    testCases: [
      { input: '48\n18', expectedOutput: '6', isHidden: false, points: 25 },
      { input: '17\n13', expectedOutput: '1', isHidden: false, points: 25 },
      { input: '100\n25', expectedOutput: '25', isHidden: false, points: 25 },
      { input: '7\n7', expectedOutput: '7', isHidden: true, points: 25 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  
  // Syntax Error Challenges
  {
    title: 'Sửa Lỗi Syntax - Thiếu Dấu Hai Chấm',
    description: 'Sửa lỗi syntax thiếu dấu hai chấm',
    problemStatement: 'Code sau có lỗi syntax. Hãy sửa lỗi:\n```python\nif x > 0\n    print("Positive")\n```',
    language: 'Python',
    difficulty: 'Easy',
    category: 'Syntax',
    tags: ['python', 'syntax', 'error', 'fix'],
    buggyCode: 'if x > 0\n    print("Positive")',
    testCases: [
      { input: '5', expectedOutput: 'Positive', isHidden: false, points: 50 },
      { input: '-5', expectedOutput: 'False', isHidden: false, points: 50 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
  {
    title: 'Sửa Lỗi Syntax - Thiếu Dấu Ngoặc',
    description: 'Sửa lỗi syntax thiếu dấu ngoặc',
    problemStatement: 'Code sau có lỗi syntax. Hãy sửa lỗi:\n```javascript\nfunction add(a, b {\n  return a + b;\n}\n```',
    language: 'JavaScript',
    difficulty: 'Easy',
    category: 'Syntax',
    tags: ['javascript', 'syntax', 'error', 'fix'],
    buggyCode: 'function add(a, b {\n  return a + b;\n}',
    testCases: [
      { input: '2\n3', expectedOutput: '5', isHidden: false, points: 50 },
      { input: '10\n20', expectedOutput: '30', isHidden: false, points: 50 },
    ],
    points: 100,
    timeLimit: 5,
    memoryLimit: 64,
  },
];

async function seedChallenges() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Tìm hoặc tạo admin user để làm createdBy
    let adminUser = await User.findOne({ role: 'admin' }).lean();
    
    if (!adminUser) {
      // Thử tìm user đầu tiên và set làm admin
      const firstUser = await User.findOne({}).lean();
      if (firstUser) {
        // Cập nhật user đầu tiên thành admin
        await User.updateOne({ _id: firstUser._id }, { role: 'admin' });
        adminUser = await User.findOne({ _id: firstUser._id }).lean();
        console.log(`   ℹ️  Đã set user "${firstUser.email}" làm admin`);
      } else {
        // Tạo admin user mới
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newAdmin = new User({
          email: 'admin@bughunter.com',
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          favoriteLanguages: ['Python', 'JavaScript'],
          experience: 1000,
          rank: 'Expert',
        });
        await newAdmin.save();
        adminUser = await User.findOne({ _id: newAdmin._id }).lean();
        console.log(`   ✅ Đã tạo admin user: admin@bughunter.com`);
      }
    }

    console.log('🏆 Đang seed Challenges...');
    console.log(`   Sẽ tạo ${challengeSamples.length} challenges\n`);

    let created = 0;
    let skipped = 0;

    for (const challengeData of challengeSamples) {
      // Kiểm tra xem đã tồn tại chưa
      const existing = await Challenge.findOne({
        title: challengeData.title,
        language: challengeData.language,
      });

      if (existing) {
        console.log(`   ⏭️  Đã tồn tại: "${challengeData.title}" (${challengeData.language})`);
        skipped++;
        continue;
      }

      if (!adminUser) {
        console.error('❌ Không thể tạo admin user. Vui lòng tạo admin user trước.');
        return;
      }

      const challenge = new Challenge({
        ...challengeData,
        createdBy: adminUser._id,
        isActive: true,
      });

      await challenge.save();
      created++;
      console.log(`   ✅ Đã tạo: "${challengeData.title}" (${challengeData.language}, ${challengeData.difficulty})`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('📊 KẾT QUẢ SEED CHALLENGES');
    console.log('='.repeat(70));
    console.log(`✅ Đã tạo: ${created} challenges`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} challenges (đã tồn tại)`);
    console.log(`🏆 Tổng số challenges: ${await Challenge.countDocuments({ isActive: true })} active`);
    console.log('='.repeat(70));

  } catch (error: any) {
    console.error('❌ Lỗi khi seed challenges:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

// Run seed
if (require.main === module) {
  seedChallenges()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedChallenges };

