import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model';
import Challenge from '../src/models/challenge.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';

const pythonChallenges = [
  // ============= BÀI DỄ 1: Tính tổng hai số =============
  {
    title: 'Tính Tổng Hai Số',
    titleEn: 'Sum of Two Numbers',
    description: 'Viết hàm tính tổng của hai số nguyên',
    descriptionEn: 'Write a function to calculate the sum of two integers',
    problemStatement: `Cho hai số nguyên a và b, hãy viết hàm sum_two_numbers(a, b) trả về tổng của chúng.

**Input:**
- Hai số nguyên a và b (-1000 ≤ a, b ≤ 1000)

**Output:**
- Trả về tổng a + b

**Ví dụ:**
\`\`\`
Input: 5, 3
Output: 8

Input: -10, 20
Output: 10
\`\`\``,
    problemStatementEn: `Given two integers a and b, write a function sum_two_numbers(a, b) that returns their sum.

**Input:**
- Two integers a and b (-1000 ≤ a, b ≤ 1000)

**Output:**
- Return a + b

**Example:**
\`\`\`
Input: 5, 3
Output: 8

Input: -10, 20
Output: 10
\`\`\``,
    language: 'Python',
    difficulty: 'Easy',
    category: 'Syntax',
    tags: ['basic', 'arithmetic', 'beginner'],
    buggyCode: `def sum_two_numbers(a, b):
    # Viết code của bạn ở đây
    pass`,
    correctCode: `def sum_two_numbers(a, b):
    return a + b`,
    testCases: [
      { input: '5\n3', expectedOutput: '8', isHidden: false, points: 20 },
      { input: '-10\n20', expectedOutput: '10', isHidden: false, points: 20 },
      { input: '0\n0', expectedOutput: '0', isHidden: false, points: 20 },
      { input: '100\n-50', expectedOutput: '50', isHidden: true, points: 20 },
      { input: '-999\n-1', expectedOutput: '-1000', isHidden: true, points: 20 },
    ],
    solutions: [
      {
        title: 'Giải pháp cơ bản',
        content: 'Sử dụng toán tử cộng (+) để tính tổng hai số',
        language: 'Python',
        code: `def sum_two_numbers(a, b):
    return a + b`,
        explanation: 'Đây là cách đơn giản nhất để tính tổng hai số trong Python. Toán tử + hoạt động với mọi kiểu số (int, float).',
        tokenCost: 1,
        order: 1,
      },
    ],
    tokenReward: 1,
    points: 100,
    timeLimit: 5,
    memoryLimit: 128,
    isActive: true,
  },

  // ============= BÀI DỄ 2: Kiểm tra số chẵn lẻ =============
  {
    title: 'Kiểm Tra Số Chẵn Lẻ',
    titleEn: 'Check Even or Odd',
    description: 'Viết hàm kiểm tra một số là chẵn hay lẻ',
    descriptionEn: 'Write a function to check if a number is even or odd',
    problemStatement: `Viết hàm is_even(n) kiểm tra số nguyên n có phải là số chẵn hay không.

**Input:**
- Một số nguyên n (-1000 ≤ n ≤ 1000)

**Output:**
- Trả về True nếu n là số chẵn, False nếu n là số lẻ

**Ví dụ:**
\`\`\`
Input: 4
Output: True

Input: 7
Output: False

Input: 0
Output: True
\`\`\``,
    problemStatementEn: `Write a function is_even(n) to check if integer n is even.

**Input:**
- An integer n (-1000 ≤ n ≤ 1000)

**Output:**
- Return True if n is even, False if n is odd

**Example:**
\`\`\`
Input: 4
Output: True

Input: 7
Output: False

Input: 0
Output: True
\`\`\``,
    language: 'Python',
    difficulty: 'Easy',
    category: 'Logic',
    tags: ['basic', 'modulo', 'conditional'],
    buggyCode: `def is_even(n):
    # Viết code của bạn ở đây
    pass`,
    correctCode: `def is_even(n):
    return n % 2 == 0`,
    testCases: [
      { input: '4', expectedOutput: 'True', isHidden: false, points: 20 },
      { input: '7', expectedOutput: 'False', isHidden: false, points: 20 },
      { input: '0', expectedOutput: 'True', isHidden: false, points: 20 },
      { input: '-6', expectedOutput: 'True', isHidden: true, points: 20 },
      { input: '-15', expectedOutput: 'False', isHidden: true, points: 20 },
    ],
    solutions: [
      {
        title: 'Sử dụng toán tử modulo',
        content: 'Kiểm tra số dư khi chia cho 2',
        language: 'Python',
        code: `def is_even(n):
    return n % 2 == 0`,
        explanation: 'Số chẵn chia hết cho 2 (dư 0). Toán tử % trả về số dư của phép chia. Nếu n % 2 == 0 thì n là số chẵn.',
        tokenCost: 1,
        order: 1,
      },
    ],
    tokenReward: 1,
    points: 100,
    timeLimit: 5,
    memoryLimit: 128,
    isActive: true,
  },

  // ============= BÀI DỄ 3: Đếm số ký tự trong chuỗi =============
  {
    title: 'Đếm Ký Tự Trong Chuỗi',
    titleEn: 'Count Characters in String',
    description: 'Viết hàm đếm số lượng ký tự trong một chuỗi',
    descriptionEn: 'Write a function to count the number of characters in a string',
    problemStatement: `Viết hàm count_chars(s) đếm số lượng ký tự (không tính khoảng trắng) trong chuỗi s.

**Input:**
- Một chuỗi s (độ dài ≤ 1000)

**Output:**
- Số nguyên biểu thị số lượng ký tự không phải khoảng trắng

**Ví dụ:**
\`\`\`
Input: "Hello World"
Output: 10

Input: "Python Programming"
Output: 17

Input: "   "
Output: 0
\`\`\``,
    problemStatementEn: `Write a function count_chars(s) to count the number of characters (excluding spaces) in string s.

**Input:**
- A string s (length ≤ 1000)

**Output:**
- An integer representing the count of non-space characters

**Example:**
\`\`\`
Input: "Hello World"
Output: 10

Input: "Python Programming"
Output: 17

Input: "   "
Output: 0
\`\`\``,
    language: 'Python',
    difficulty: 'Easy',
    category: 'Syntax',
    tags: ['string', 'basic', 'counting'],
    buggyCode: `def count_chars(s):
    # Viết code của bạn ở đây
    pass`,
    correctCode: `def count_chars(s):
    return len(s.replace(' ', ''))`,
    testCases: [
      { input: 'Hello World', expectedOutput: '10', isHidden: false, points: 20 },
      { input: 'Python Programming', expectedOutput: '17', isHidden: false, points: 20 },
      { input: '   ', expectedOutput: '0', isHidden: false, points: 20 },
      { input: 'a b c d e', expectedOutput: '5', isHidden: true, points: 20 },
      { input: 'NoSpacesHere', expectedOutput: '12', isHidden: true, points: 20 },
    ],
    solutions: [
      {
        title: 'Sử dụng replace và len',
        content: 'Loại bỏ khoảng trắng rồi đếm độ dài',
        language: 'Python',
        code: `def count_chars(s):
    return len(s.replace(' ', ''))`,
        explanation: 'Sử dụng replace() để loại bỏ tất cả khoảng trắng, sau đó dùng len() để đếm số ký tự còn lại.',
        tokenCost: 1,
        order: 1,
      },
    ],
    tokenReward: 1,
    points: 100,
    timeLimit: 5,
    memoryLimit: 128,
    isActive: true,
  },

  // ============= BÀI TRUNG BÌNH 1: Tìm số lớn nhất trong list =============
  {
    title: 'Tìm Số Lớn Nhất Trong Danh Sách',
    titleEn: 'Find Maximum in List',
    description: 'Viết hàm tìm số lớn nhất trong một danh sách số nguyên',
    descriptionEn: 'Write a function to find the maximum number in a list of integers',
    problemStatement: `Viết hàm find_max(numbers) tìm và trả về số lớn nhất trong danh sách numbers.

**Input:**
- Một danh sách numbers chứa ít nhất 1 số nguyên (1 ≤ len(numbers) ≤ 1000)
- Các số trong khoảng [-10000, 10000]

**Output:**
- Số nguyên lớn nhất trong danh sách

**Ví dụ:**
\`\`\`
Input: [1, 5, 3, 9, 2]
Output: 9

Input: [-5, -2, -10, -1]
Output: -1

Input: [42]
Output: 42
\`\`\``,
    problemStatementEn: `Write a function find_max(numbers) to find and return the maximum number in the list.

**Input:**
- A list numbers containing at least 1 integer (1 ≤ len(numbers) ≤ 1000)
- Numbers in range [-10000, 10000]

**Output:**
- The maximum integer in the list

**Example:**
\`\`\`
Input: [1, 5, 3, 9, 2]
Output: 9

Input: [-5, -2, -10, -1]
Output: -1

Input: [42]
Output: 42
\`\`\``,
    language: 'Python',
    difficulty: 'Medium',
    category: 'Logic',
    tags: ['list', 'iteration', 'comparison'],
    buggyCode: `def find_max(numbers):
    # Viết code của bạn ở đây
    pass`,
    correctCode: `def find_max(numbers):
    return max(numbers)`,
    testCases: [
      { input: '1 5 3 9 2', expectedOutput: '9', isHidden: false, points: 20 },
      { input: '-5 -2 -10 -1', expectedOutput: '-1', isHidden: false, points: 20 },
      { input: '42', expectedOutput: '42', isHidden: false, points: 20 },
      { input: '100 200 150 175 225', expectedOutput: '225', isHidden: true, points: 20 },
      { input: '-1000 -999 -1001 -500', expectedOutput: '-500', isHidden: true, points: 20 },
    ],
    solutions: [
      {
        title: 'Sử dụng hàm max built-in',
        content: 'Python cung cấp hàm max() để tìm giá trị lớn nhất',
        language: 'Python',
        code: `def find_max(numbers):
    return max(numbers)`,
        explanation: 'Hàm max() của Python tự động tìm giá trị lớn nhất trong iterable. Đây là cách đơn giản và hiệu quả nhất.',
        tokenCost: 1,
        order: 1,
      },
      {
        title: 'Giải pháp thủ công với vòng lặp',
        content: 'Duyệt qua từng phần tử để tìm max',
        language: 'Python',
        code: `def find_max(numbers):
    max_num = numbers[0]
    for num in numbers:
        if num > max_num:
            max_num = num
    return max_num`,
        explanation: 'Khởi tạo max_num bằng phần tử đầu tiên, sau đó duyệt qua từng phần tử và cập nhật max_num nếu tìm thấy số lớn hơn.',
        tokenCost: 2,
        order: 2,
      },
    ],
    tokenReward: 2,
    points: 200,
    timeLimit: 10,
    memoryLimit: 256,
    isActive: true,
  },

  // ============= BÀI TRUNG BÌNH 2: Đảo ngược chuỗi =============
  {
    title: 'Đảo Ngược Chuỗi',
    titleEn: 'Reverse String',
    description: 'Viết hàm đảo ngược một chuỗi ký tự',
    descriptionEn: 'Write a function to reverse a string',
    problemStatement: `Viết hàm reverse_string(s) trả về chuỗi s sau khi đảo ngược.

**Input:**
- Một chuỗi s (0 ≤ len(s) ≤ 1000)

**Output:**
- Chuỗi s sau khi đảo ngược

**Ví dụ:**
\`\`\`
Input: "hello"
Output: "olleh"

Input: "Python"
Output: "nohtyP"

Input: "12345"
Output: "54321"
\`\`\``,
    problemStatementEn: `Write a function reverse_string(s) to return the reversed string s.

**Input:**
- A string s (0 ≤ len(s) ≤ 1000)

**Output:**
- The reversed string s

**Example:**
\`\`\`
Input: "hello"
Output: "olleh"

Input: "Python"
Output: "nohtyP"

Input: "12345"
Output: "54321"
\`\`\``,
    language: 'Python',
    difficulty: 'Medium',
    category: 'Syntax',
    tags: ['string', 'slicing', 'manipulation'],
    buggyCode: `def reverse_string(s):
    # Viết code của bạn ở đây
    pass`,
    correctCode: `def reverse_string(s):
    return s[::-1]`,
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false, points: 20 },
      { input: 'Python', expectedOutput: 'nohtyP', isHidden: false, points: 20 },
      { input: '12345', expectedOutput: '54321', isHidden: false, points: 20 },
      { input: 'a', expectedOutput: 'a', isHidden: true, points: 20 },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true, points: 20 },
    ],
    solutions: [
      {
        title: 'Sử dụng slicing',
        content: 'Python slicing với bước -1 để đảo ngược',
        language: 'Python',
        code: `def reverse_string(s):
    return s[::-1]`,
        explanation: 'Slicing [::-1] là cách pythonic để đảo ngược chuỗi. Bước -1 nghĩa là đi ngược từ cuối về đầu.',
        tokenCost: 1,
        order: 1,
      },
      {
        title: 'Sử dụng reversed() và join()',
        content: 'Kết hợp reversed() với join()',
        language: 'Python',
        code: `def reverse_string(s):
    return ''.join(reversed(s))`,
        explanation: 'Hàm reversed() trả về iterator đảo ngược, sau đó join() ghép các ký tự lại thành chuỗi.',
        tokenCost: 2,
        order: 2,
      },
    ],
    tokenReward: 2,
    points: 200,
    timeLimit: 10,
    memoryLimit: 256,
    isActive: true,
  },

  // ============= BÀI KHÓ: Tìm chuỗi con palindrome dài nhất =============
  {
    title: 'Chuỗi Con Palindrome Dài Nhất',
    titleEn: 'Longest Palindromic Substring',
    description: 'Tìm chuỗi con palindrome (đối xứng) dài nhất trong một chuỗi',
    descriptionEn: 'Find the longest palindromic substring in a string',
    problemStatement: `Viết hàm longest_palindrome(s) tìm chuỗi con palindrome dài nhất trong chuỗi s.

**Palindrome** là chuỗi đọc xuôi và đọc ngược giống nhau (ví dụ: "aba", "racecar").

**Input:**
- Một chuỗi s (1 ≤ len(s) ≤ 1000)

**Output:**
- Chuỗi con palindrome dài nhất. Nếu có nhiều chuỗi cùng độ dài, trả về chuỗi xuất hiện đầu tiên.

**Ví dụ:**
\`\`\`
Input: "babad"
Output: "bab" (hoặc "aba")

Input: "cbbd"
Output: "bb"

Input: "racecar"
Output: "racecar"

Input: "abc"
Output: "a" (hoặc "b" hoặc "c")
\`\`\`

**Gợi ý:**
- Có thể mở rộng từ tâm (expand around center)
- Xem xét cả palindrome độ dài chẵn và lẻ`,
    problemStatementEn: `Write a function longest_palindrome(s) to find the longest palindromic substring in string s.

**Palindrome** is a string that reads the same forward and backward (e.g., "aba", "racecar").

**Input:**
- A string s (1 ≤ len(s) ≤ 1000)

**Output:**
- The longest palindromic substring. If multiple exist, return the first one.

**Example:**
\`\`\`
Input: "babad"
Output: "bab" (or "aba")

Input: "cbbd"
Output: "bb"

Input: "racecar"
Output: "racecar"

Input: "abc"
Output: "a" (or "b" or "c")
\`\`\`

**Hints:**
- Can expand around center
- Consider both even and odd length palindromes`,
    language: 'Python',
    difficulty: 'Hard',
    category: 'Logic',
    tags: ['string', 'algorithm', 'two-pointers', 'palindrome'],
    buggyCode: `def longest_palindrome(s):
    # Viết code của bạn ở đây
    pass`,
    correctCode: `def longest_palindrome(s):
    if not s:
        return ""
    
    def expand_around_center(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]
    
    longest = ""
    for i in range(len(s)):
        # Palindrome độ dài lẻ (tâm là 1 ký tự)
        palindrome1 = expand_around_center(i, i)
        # Palindrome độ dài chẵn (tâm là 2 ký tự)
        palindrome2 = expand_around_center(i, i + 1)
        
        # Cập nhật longest
        longest = max([longest, palindrome1, palindrome2], key=len)
    
    return longest`,
    testCases: [
      { input: 'babad', expectedOutput: 'bab', isHidden: false, points: 20 },
      { input: 'cbbd', expectedOutput: 'bb', isHidden: false, points: 20 },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: false, points: 20 },
      { input: 'abc', expectedOutput: 'a', isHidden: true, points: 20 },
      { input: 'abacabad', expectedOutput: 'abacaba', isHidden: true, points: 20 },
    ],
    solutions: [
      {
        title: 'Expand Around Center',
        content: 'Mở rộng từ tâm để tìm palindrome',
        language: 'Python',
        code: `def longest_palindrome(s):
    if not s:
        return ""
    
    def expand_around_center(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]
    
    longest = ""
    for i in range(len(s)):
        # Palindrome độ dài lẻ
        palindrome1 = expand_around_center(i, i)
        # Palindrome độ dài chẵn
        palindrome2 = expand_around_center(i, i + 1)
        
        longest = max([longest, palindrome1, palindrome2], key=len)
    
    return longest`,
        explanation: 'Thuật toán mở rộng từ tâm: với mỗi vị trí, ta mở rộng ra hai bên để tìm palindrome. Xét cả trường hợp độ dài chẵn và lẻ. Time complexity: O(n²), Space: O(1).',
        tokenCost: 3,
        order: 1,
      },
      {
        title: 'Dynamic Programming',
        content: 'Sử dụng DP để lưu trạng thái palindrome',
        language: 'Python',
        code: `def longest_palindrome(s):
    n = len(s)
    if n < 2:
        return s
    
    # dp[i][j] = True nếu s[i:j+1] là palindrome
    dp = [[False] * n for _ in range(n)]
    start = 0
    max_len = 1
    
    # Mọi ký tự đơn là palindrome
    for i in range(n):
        dp[i][i] = True
    
    # Kiểm tra chuỗi độ dài 2
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            dp[i][i + 1] = True
            start = i
            max_len = 2
    
    # Kiểm tra chuỗi độ dài >= 3
    for length in range(3, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j] and dp[i + 1][j - 1]:
                dp[i][j] = True
                start = i
                max_len = length
    
    return s[start:start + max_len]`,
        explanation: 'Dynamic Programming: Lưu trạng thái palindrome của mọi chuỗi con. Nếu s[i] == s[j] và s[i+1:j] là palindrome, thì s[i:j+1] cũng là palindrome. Time: O(n²), Space: O(n²).',
        tokenCost: 4,
        order: 2,
      },
    ],
    tokenReward: 3,
    points: 300,
    timeLimit: 15,
    memoryLimit: 256,
    isActive: true,
  },
];

async function seedPythonChallenges() {
  try {
    console.log('🔌 Kết nối tới MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối tới MongoDB');

    // Lấy admin user để làm createdBy
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Không tìm thấy admin user. Vui lòng tạo admin trước.');
      process.exit(1);
    }

    console.log('📚 Bắt đầu import các bài tập Python...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const challengeData of pythonChallenges) {
      // Kiểm tra xem challenge đã tồn tại chưa
      const existingChallenge = await Challenge.findOne({ title: challengeData.title });
      
      if (existingChallenge) {
        console.log(`⏭️  Bỏ qua "${challengeData.title}" - đã tồn tại`);
        skippedCount++;
        continue;
      }

      // Tạo challenge mới
      const challenge = new Challenge({
        ...challengeData,
        createdBy: admin._id,
      });

      await challenge.save();
      createdCount++;
      
      console.log(`✅ Đã tạo: "${challengeData.title}"`);
      console.log(`   - Độ khó: ${challengeData.difficulty}`);
      console.log(`   - Điểm: ${challengeData.points}`);
      console.log(`   - Token thưởng: ${challengeData.tokenReward}`);
      console.log(`   - Test cases: ${challengeData.testCases.length}\n`);
    }

    console.log('🎉 Hoàn thành import!');
    console.log('📊 Tóm tắt:');
    console.log(`   - Đã tạo: ${createdCount} bài tập`);
    console.log(`   - Đã bỏ qua: ${skippedCount} bài tập`);
    console.log(`   - Tổng cộng: ${pythonChallenges.length} bài tập`);

    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi import dữ liệu:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Chạy script
seedPythonChallenges();