import axios from 'axios';
import mongoose from 'mongoose';
import Challenge from '../src/models/challenge.model';
import User from '../src/models/user.model';

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com'
};

// Sample problems để demo
const sampleProblems = [
  {
    title: "Two Sum - LeetCode Style",
    description: "Tìm hai số trong mảng có tổng bằng target",
    problemStatement: "Cho một mảng số nguyên và một số target, tìm hai số trong mảng có tổng bằng target và trả về chỉ số của chúng.",
    difficulty: "Easy" as const,
    language: "JavaScript",
    category: "Logic" as const,
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        isHidden: false,
        points: 10
      },
      {
        input: "[3,2,4]\n6",
        expectedOutput: "[1,2]",
        isHidden: true,
        points: 10
      }
    ],
    tags: ["leetcode", "array", "hash-table"],
    buggyCode: `function twoSum(nums, target) {
  // Bug: Wrong loop condition
  for (let i = 0; i < nums.length - 1; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  // Bug: Missing return statement
  // return [];
}`,
    correctCode: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length - 1; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`
  },
  {
    title: "Binary Search - CSES Style",
    description: "Tìm kiếm nhị phân trong mảng đã sắp xếp",
    problemStatement: "Cho một mảng đã sắp xếp và một số target, tìm vị trí của target trong mảng bằng thuật toán tìm kiếm nhị phân.",
    difficulty: "Medium" as const,
    language: "C++",
    category: "Logic" as const,
    testCases: [
      {
        input: "5 3\n1 2 3 4 5",
        expectedOutput: "2",
        isHidden: false,
        points: 10
      },
      {
        input: "4 6\n1 2 3 4",
        expectedOutput: "-1",
        isHidden: true,
        points: 10
      }
    ],
    tags: ["cses", "binary-search", "algorithm"],
    buggyCode: `#include <iostream>
using namespace std;

int binarySearch(int arr[], int n, int target) {
  int left = 0, right = n - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  // Bug: Missing return statement
  // return -1;
}`,
    correctCode: `#include <iostream>
using namespace std;

int binarySearch(int arr[], int n, int target) {
  int left = 0, right = n - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}`
  },
  {
    title: "Sorting Array - AtCoder Style",
    description: "Sắp xếp mảng theo thứ tự tăng dần",
    problemStatement: "Cho một mảng số nguyên, sắp xếp mảng theo thứ tự tăng dần và in ra kết quả.",
    difficulty: "Easy" as const,
    language: "Python",
    category: "Logic" as const,
    testCases: [
      {
        input: "5\n3 1 4 1 5",
        expectedOutput: "1 1 3 4 5",
        isHidden: false,
        points: 10
      },
      {
        input: "3\n5 2 8",
        expectedOutput: "2 5 8",
        isHidden: true,
        points: 10
      }
    ],
    tags: ["atcoder", "sorting", "algorithm"],
    buggyCode: `def sort_array(arr):
    n = len(arr)
    # Bug: Wrong sorting algorithm
    for i in range(n):
        for j in range(i + 1, n):
            if arr[i] > arr[j]:
                arr[i], arr[j] = arr[j], arr[i]
    # Bug: Missing return statement
    # return arr`,
    correctCode: `def sort_array(arr):
    n = len(arr)
    for i in range(n):
        for j in range(i + 1, n):
            if arr[i] > arr[j]:
                arr[i], arr[j] = arr[j], arr[i]
    return arr`
  }
];

async function demoScraper() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Tìm admin user
    const admin = await User.findOne({ email: ENV.ADMIN_EMAIL });
    if (!admin) {
      console.error('❌ Không tìm thấy admin user');
      return;
    }

    console.log(`👤 Tìm thấy admin: ${admin.username}`);

    // Thêm sample problems
    console.log('📝 Thêm sample problems...');
    let addedCount = 0;

    for (const problem of sampleProblems) {
      // Kiểm tra xem problem đã tồn tại chưa
      const existing = await Challenge.findOne({ title: problem.title });
      if (existing) {
        console.log(`⏭️  Bỏ qua: ${problem.title} (đã tồn tại)`);
        continue;
      }

      const challenge = new Challenge({
        ...problem,
        createdBy: admin._id,
        isActive: true,
        points: 20,
        timeLimit: 2,
        memoryLimit: 256
      });

      await challenge.save();
      console.log(`✅ Đã thêm: ${problem.title}`);
      addedCount++;
    }

    console.log(`🎉 Hoàn thành! Đã thêm ${addedCount} problems mới`);

    // Hiển thị thống kê
    const totalChallenges = await Challenge.countDocuments();
    const activeChallenges = await Challenge.countDocuments({ isActive: true });
    
    console.log('\n📊 Thống kê:');
    console.log(`   Tổng challenges: ${totalChallenges}`);
    console.log(`   Active challenges: ${activeChallenges}`);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

// Chạy demo
demoScraper();
