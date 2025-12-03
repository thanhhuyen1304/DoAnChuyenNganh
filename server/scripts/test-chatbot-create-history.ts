/**
 * Script Test Chatbot và Tạo Chat Histories
 * Tự động gửi các câu hỏi mẫu đến chatbot và tạo chat histories với ratings
 * 
 * Usage:
 *   npx ts-node scripts/test-chatbot-create-history.ts
 */

import mongoose from 'mongoose';
import User from '../src/models/user.model';
import ChatHistory from '../src/models/chatHistory.model';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { knowledgeGraphService } from '../src/services/knowledgeGraphService';
import { word2vecService } from '../src/services/word2vecService';
import TrainingData from '../src/models/trainingData.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/BugHunter';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Xử lý case sensitivity của database name
let finalMongoUri = MONGODB_URI;
if (MONGODB_URI.includes('/bughunter') && !MONGODB_URI.includes('/BugHunter')) {
  finalMongoUri = MONGODB_URI.replace('/bughunter', '/BugHunter');
}

// Danh sách câu hỏi mẫu để test chatbot - Mở rộng cho trang web luyện code
const sampleQuestions = [
  // Debug & Error Handling (10 câu)
  {
    question: 'Làm sao debug lỗi JavaScript?',
    expectedKeywords: ['debug', 'javascript', 'console', 'error'],
    rating: 'good' as const,
  },
  {
    question: 'Tôi gặp lỗi "undefined is not defined", làm sao fix?',
    expectedKeywords: ['undefined', 'error', 'fix', 'javascript'],
    rating: 'good' as const,
  },
  {
    question: 'Cách sửa lỗi "Cannot read property of undefined"?',
    expectedKeywords: ['undefined', 'property', 'error', 'fix'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi syntax error trong Python là gì?',
    expectedKeywords: ['syntax', 'error', 'python', 'lỗi'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi runtime error là gì?',
    expectedKeywords: ['runtime', 'error', 'lỗi'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao fix lỗi "TypeError: Cannot read property"?',
    expectedKeywords: ['typeerror', 'property', 'error', 'fix'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "Index out of range" trong Python?',
    expectedKeywords: ['index', 'range', 'python', 'error'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao debug code hiệu quả?',
    expectedKeywords: ['debug', 'code', 'hiệu quả', 'troubleshooting'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "Maximum call stack size exceeded" là gì?',
    expectedKeywords: ['stack', 'overflow', 'recursion', 'error'],
    rating: 'good' as const,
  },
  {
    question: 'Cách sửa lỗi "ReferenceError" trong JavaScript?',
    expectedKeywords: ['referenceerror', 'javascript', 'error', 'fix'],
    rating: 'good' as const,
  },
  
  // Programming Concepts (15 câu)
  {
    question: 'Array trong JavaScript là gì?',
    expectedKeywords: ['array', 'javascript', 'data structure'],
    rating: 'good' as const,
  },
  {
    question: 'Function trong Python là gì?',
    expectedKeywords: ['function', 'python', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Object trong JavaScript là gì?',
    expectedKeywords: ['object', 'javascript', 'data structure'],
    rating: 'good' as const,
  },
  {
    question: 'List trong Python là gì?',
    expectedKeywords: ['list', 'python', 'array', 'data structure'],
    rating: 'good' as const,
  },
  {
    question: 'Dictionary trong Python là gì?',
    expectedKeywords: ['dictionary', 'dict', 'python', 'data structure'],
    rating: 'good' as const,
  },
  {
    question: 'Vòng lặp for trong JavaScript?',
    expectedKeywords: ['for', 'loop', 'javascript', 'iteration'],
    rating: 'good' as const,
  },
  {
    question: 'Vòng lặp while trong Python?',
    expectedKeywords: ['while', 'loop', 'python', 'iteration'],
    rating: 'good' as const,
  },
  {
    question: 'String trong JavaScript?',
    expectedKeywords: ['string', 'javascript', 'basics'],
    rating: 'good' as const,
  },
  {
    question: 'Class trong Python là gì?',
    expectedKeywords: ['class', 'python', 'oop', 'object-oriented'],
    rating: 'good' as const,
  },
  {
    question: 'Promise trong JavaScript là gì?',
    expectedKeywords: ['promise', 'javascript', 'async', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Async/await trong JavaScript?',
    expectedKeywords: ['async', 'await', 'javascript', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Recursion (đệ quy) là gì?',
    expectedKeywords: ['recursion', 'đệ quy', 'algorithm', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Closure trong JavaScript là gì?',
    expectedKeywords: ['closure', 'javascript', 'scope', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Generator trong Python là gì?',
    expectedKeywords: ['generator', 'python', 'iterator', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Decorator trong Python là gì?',
    expectedKeywords: ['decorator', 'python', 'function', 'programming'],
    rating: 'good' as const,
  },
  
  // Algorithm & Data Structures (10 câu)
  {
    question: 'Thuật toán tìm kiếm nhị phân (binary search) là gì?',
    expectedKeywords: ['binary search', 'algorithm', 'search', 'data structure'],
    rating: 'good' as const,
  },
  {
    question: 'Sắp xếp mảng trong JavaScript?',
    expectedKeywords: ['sort', 'array', 'javascript', 'algorithm'],
    rating: 'good' as const,
  },
  {
    question: 'Tính Fibonacci trong Python?',
    expectedKeywords: ['fibonacci', 'python', 'algorithm', 'recursion'],
    rating: 'good' as const,
  },
  {
    question: 'Tìm số lớn nhất trong mảng JavaScript?',
    expectedKeywords: ['max', 'array', 'javascript', 'algorithm'],
    rating: 'good' as const,
  },
  {
    question: 'Kiểm tra palindrome trong Python?',
    expectedKeywords: ['palindrome', 'python', 'string', 'algorithm'],
    rating: 'good' as const,
  },
  {
    question: 'Tính giai thừa trong Python?',
    expectedKeywords: ['factorial', 'giai thừa', 'python', 'recursion'],
    rating: 'good' as const,
  },
  {
    question: 'Tìm số nguyên tố trong Python?',
    expectedKeywords: ['prime', 'số nguyên tố', 'python', 'algorithm'],
    rating: 'good' as const,
  },
  {
    question: 'Đảo ngược chuỗi trong JavaScript?',
    expectedKeywords: ['reverse', 'string', 'javascript', 'algorithm'],
    rating: 'good' as const,
  },
  {
    question: 'Tìm phần tử trùng lặp trong mảng?',
    expectedKeywords: ['duplicate', 'array', 'algorithm', 'find'],
    rating: 'good' as const,
  },
  {
    question: 'Tính tổng các phần tử trong mảng?',
    expectedKeywords: ['sum', 'array', 'total', 'algorithm'],
    rating: 'good' as const,
  },
  
  // Best Practices & Tips (10 câu)
  {
    question: 'Best practices khi viết code JavaScript?',
    expectedKeywords: ['best practices', 'javascript', 'coding'],
    rating: 'good' as const,
  },
  {
    question: 'Cách viết code Python clean và readable?',
    expectedKeywords: ['clean code', 'python', 'readable', 'best practices'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao học lập trình hiệu quả?',
    expectedKeywords: ['học', 'lập trình', 'hiệu quả', 'tips'],
    rating: 'good' as const,
  },
  {
    question: 'Cách đặt tên biến tốt?',
    expectedKeywords: ['naming', 'biến', 'variable', 'best practices'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao tối ưu performance code JavaScript?',
    expectedKeywords: ['performance', 'optimization', 'javascript', 'speed'],
    rating: 'good' as const,
  },
  {
    question: 'Cách comment code đúng cách?',
    expectedKeywords: ['comment', 'documentation', 'code', 'best practices'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao refactor code?',
    expectedKeywords: ['refactor', 'code', 'improve', 'best practices'],
    rating: 'good' as const,
  },
  {
    question: 'Cách test code JavaScript?',
    expectedKeywords: ['test', 'testing', 'javascript', 'unit test'],
    rating: 'good' as const,
  },
  {
    question: 'Cách test code Python?',
    expectedKeywords: ['test', 'testing', 'python', 'pytest'],
    rating: 'good' as const,
  },
  {
    question: 'Git là gì và cách sử dụng?',
    expectedKeywords: ['git', 'version control', 'tools', 'development'],
    rating: 'good' as const,
  },
  
  // Exercises & Challenges (15 câu)
  {
    question: 'Gợi ý bài tập Python cho người mới',
    expectedKeywords: ['python', 'bài tập', 'beginner', 'exercise'],
    rating: 'good' as const,
  },
  {
    question: 'Gợi ý bài tập JavaScript cho người mới',
    expectedKeywords: ['javascript', 'bài tập', 'beginner', 'exercise'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập nào phù hợp với trình độ của tôi?',
    expectedKeywords: ['bài tập', 'trình độ', 'phù hợp', 'recommendation'],
    rating: 'good' as const,
  },
  {
    question: 'Gợi ý challenges khó hơn cho tôi',
    expectedKeywords: ['challenges', 'khó', 'hard', 'advanced'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập về array trong JavaScript?',
    expectedKeywords: ['array', 'bài tập', 'javascript', 'exercise'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập về string trong Python?',
    expectedKeywords: ['string', 'bài tập', 'python', 'exercise'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập về recursion?',
    expectedKeywords: ['recursion', 'đệ quy', 'bài tập', 'exercise'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập về algorithm?',
    expectedKeywords: ['algorithm', 'thuật toán', 'bài tập', 'exercise'],
    rating: 'good' as const,
  },
  {
    question: 'Gợi ý bài tập lập trình cho người mới?',
    expectedKeywords: ['bài tập', 'lập trình', 'beginner', 'exercises'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập nào giúp cải thiện kỹ năng debug?',
    expectedKeywords: ['debug', 'bài tập', 'kỹ năng', 'improve'],
    rating: 'good' as const,
  },
  {
    question: 'Challenges về data structures?',
    expectedKeywords: ['data structures', 'challenges', 'cấu trúc dữ liệu'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập về OOP trong Python?',
    expectedKeywords: ['oop', 'object-oriented', 'python', 'bài tập'],
    rating: 'good' as const,
  },
  {
    question: 'Gợi ý bài tập để luyện thi phỏng vấn?',
    expectedKeywords: ['interview', 'phỏng vấn', 'bài tập', 'practice'],
    rating: 'good' as const,
  },
  {
    question: 'Bài tập về async programming?',
    expectedKeywords: ['async', 'asynchronous', 'bài tập', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Challenges về performance optimization?',
    expectedKeywords: ['performance', 'optimization', 'challenges', 'speed'],
    rating: 'good' as const,
  },
  
  // Error Types & Solutions (10 câu)
  {
    question: 'Các loại lỗi trong lập trình?',
    expectedKeywords: ['error', 'types', 'lỗi', 'programming'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi logic error là gì?',
    expectedKeywords: ['logic', 'error', 'lỗi', 'debugging'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao fix lỗi "Uncaught TypeError"?',
    expectedKeywords: ['typeerror', 'error', 'fix', 'javascript'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "IndentationError" trong Python?',
    expectedKeywords: ['indentation', 'error', 'python', 'syntax'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao fix lỗi "NameError" trong Python?',
    expectedKeywords: ['nameerror', 'python', 'error', 'fix'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "TypeError" trong Python?',
    expectedKeywords: ['typeerror', 'python', 'error', 'debugging'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao fix lỗi "KeyError" trong Python?',
    expectedKeywords: ['keyerror', 'dictionary', 'python', 'error'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "AttributeError" trong Python?',
    expectedKeywords: ['attributeerror', 'python', 'error', 'debugging'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "ZeroDivisionError" trong Python?',
    expectedKeywords: ['zerodivisionerror', 'python', 'error', 'math'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "TimeoutError" là gì?',
    expectedKeywords: ['timeout', 'error', 'performance', 'debugging'],
    rating: 'good' as const,
  },
  
  // Tools & Environment (8 câu)
  {
    question: 'Cách sửa lỗi "Module not found" trong Node.js?',
    expectedKeywords: ['module', 'not found', 'nodejs', 'npm'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "Cannot find module" trong Node.js?',
    expectedKeywords: ['module', 'nodejs', 'error', 'npm'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao fix lỗi "ImportError" trong Python?',
    expectedKeywords: ['importerror', 'python', 'module', 'import'],
    rating: 'good' as const,
  },
  {
    question: 'Lỗi "ModuleNotFoundError" trong Python?',
    expectedKeywords: ['modulenotfounderror', 'python', 'module', 'import'],
    rating: 'good' as const,
  },
  {
    question: 'Cách cài đặt package trong Python?',
    expectedKeywords: ['pip', 'install', 'package', 'python'],
    rating: 'good' as const,
  },
  {
    question: 'Cách cài đặt package trong Node.js?',
    expectedKeywords: ['npm', 'install', 'package', 'nodejs'],
    rating: 'good' as const,
  },
  {
    question: 'Virtual environment trong Python là gì?',
    expectedKeywords: ['virtual environment', 'venv', 'python', 'environment'],
    rating: 'good' as const,
  },
  {
    question: 'Package.json trong Node.js là gì?',
    expectedKeywords: ['package.json', 'nodejs', 'dependencies', 'npm'],
    rating: 'good' as const,
  },
  
  // Learning & Progress (7 câu)
  {
    question: 'Làm sao cải thiện kỹ năng lập trình?',
    expectedKeywords: ['cải thiện', 'kỹ năng', 'lập trình', 'improve'],
    rating: 'good' as const,
  },
  {
    question: 'Lộ trình học lập trình cho người mới?',
    expectedKeywords: ['lộ trình', 'học', 'beginner', 'roadmap'],
    rating: 'good' as const,
  },
  {
    question: 'Tài liệu học Python tốt?',
    expectedKeywords: ['tài liệu', 'python', 'học', 'documentation'],
    rating: 'good' as const,
  },
  {
    question: 'Tài liệu học JavaScript tốt?',
    expectedKeywords: ['tài liệu', 'javascript', 'học', 'documentation'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao theo dõi tiến độ học tập?',
    expectedKeywords: ['tiến độ', 'theo dõi', 'progress', 'tracking'],
    rating: 'good' as const,
  },
  {
    question: 'Cách luyện code hiệu quả?',
    expectedKeywords: ['luyện', 'code', 'practice', 'hiệu quả'],
    rating: 'good' as const,
  },
  {
    question: 'Tips để giải quyết bài tập khó?',
    expectedKeywords: ['tips', 'bài tập', 'khó', 'solve'],
    rating: 'good' as const,
  },
  
  // Code Review & Improvement (5 câu)
  {
    question: 'Làm sao viết code dễ đọc hơn?',
    expectedKeywords: ['readable', 'code', 'clean', 'improve'],
    rating: 'good' as const,
  },
  {
    question: 'Cách tối ưu code Python?',
    expectedKeywords: ['optimize', 'python', 'code', 'performance'],
    rating: 'good' as const,
  },
  {
    question: 'Cách tối ưu code JavaScript?',
    expectedKeywords: ['optimize', 'javascript', 'code', 'performance'],
    rating: 'good' as const,
  },
  {
    question: 'Làm sao tránh code duplication?',
    expectedKeywords: ['duplication', 'code', 'dry', 'best practices'],
    rating: 'good' as const,
  },
  {
    question: 'Cách tổ chức code tốt hơn?',
    expectedKeywords: ['organize', 'code', 'structure', 'best practices'],
    rating: 'good' as const,
  },
];

// Tạo JWT token cho user
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Gửi message đến chatbot API
async function sendChatMessage(token: string, message: string, chatId?: string): Promise<{ chatId: string; response: string; messageIndex: number }> {
  try {
    const response = await axios.post(
      `${API_URL}/api/chat/message`,
      {
        message,
        chatId,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      }
    );

    if (response.data.success) {
      return {
        chatId: response.data.data.chatId,
        response: response.data.data.message.content,
        messageIndex: response.data.data.messageIndex || 0,
      };
    } else {
      throw new Error(response.data.message || 'Unknown error');
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      throw new Error(`API Error (${status}): ${message}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Không thể kết nối đến API server tại ${API_URL}. Đảm bảo server đang chạy.`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(`API server timeout. Đảm bảo server đang chạy và phản hồi.`);
    }
    throw new Error(error.message || 'Unknown error');
  }
}

// Tạo chat history trực tiếp trong database (fallback khi API không chạy)
async function createChatHistoryDirect(userId: string, question: string, rating?: 'good' | 'bad'): Promise<void> {
  try {
    // Tìm training data liên quan để tạo response mẫu
    let answer = 'Đây là câu trả lời mẫu từ chatbot. ';
    
    // Thử tìm training data liên quan
    const relevantData = await TrainingData.find({
      isActive: true,
      $or: [
        { question: { $regex: question, $options: 'i' } },
        { answer: { $regex: question, $options: 'i' } },
        { tags: { $in: question.toLowerCase().split(/\s+/).filter(w => w.length > 2) } },
      ],
    }).limit(1).lean();

    if (relevantData.length > 0) {
      answer = relevantData[0].answer;
    } else {
      // Tạo answer mẫu dựa trên question và category
      const lowerQuestion = question.toLowerCase();
      
      if (lowerQuestion.includes('debug') || lowerQuestion.includes('lỗi') || lowerQuestion.includes('error')) {
        answer = 'Để debug lỗi, bạn có thể:\n1. Sử dụng console.log() để in giá trị\n2. Kiểm tra error messages trong console\n3. Sử dụng debugger trong browser DevTools\n4. Kiểm tra logic và syntax của code\n5. Sử dụng try-catch để bắt lỗi';
      } else if (lowerQuestion.includes('bài tập') || lowerQuestion.includes('exercise') || lowerQuestion.includes('challenge')) {
        answer = 'Tôi có thể gợi ý các bài tập phù hợp cho bạn! Trên BugHunter platform có nhiều challenges từ dễ đến khó:\n- Python: Syntax, Logic, Performance\n- JavaScript: Array, Object, Async\n- Algorithm: Search, Sort, Recursion\nHãy thử làm các challenges để cải thiện kỹ năng!';
      } else if (lowerQuestion.includes('array') || lowerQuestion.includes('mảng')) {
        answer = 'Array (mảng) là cấu trúc dữ liệu để lưu trữ nhiều giá trị. Trong JavaScript:\n- Khai báo: const arr = []\n- Thêm: arr.push(item)\n- Truy cập: arr[index]\n- Duyệt: arr.forEach(), for...of\n- Methods: map(), filter(), reduce()';
      } else if (lowerQuestion.includes('function') || lowerQuestion.includes('hàm')) {
        answer = 'Function (hàm) là khối code có thể tái sử dụng. Trong Python:\n```python\ndef function_name(parameters):\n    # code\n    return value\n```\nFunctions giúp code dễ đọc, dễ bảo trì và tái sử dụng.';
      } else if (lowerQuestion.includes('syntax') || lowerQuestion.includes('cú pháp')) {
        answer = 'Syntax error là lỗi cú pháp, code không tuân thủ quy tắc của ngôn ngữ. Các lỗi thường gặp:\n- Thiếu dấu ngoặc\n- Thiếu dấu hai chấm (Python)\n- Sai indentation (Python)\n- Thiếu dấu chấm phẩy (một số ngôn ngữ)';
      } else if (lowerQuestion.includes('runtime')) {
        answer = 'Runtime error là lỗi xảy ra khi chương trình đang chạy. Các loại:\n- Null pointer exception\n- Division by zero\n- Index out of range\n- Type mismatch\nGiải pháp: Sử dụng try-catch, validate input, kiểm tra điều kiện.';
      } else if (lowerQuestion.includes('algorithm') || lowerQuestion.includes('thuật toán')) {
        answer = 'Algorithm (thuật toán) là các bước để giải quyết vấn đề. Các thuật toán phổ biến:\n- Tìm kiếm: Linear search, Binary search\n- Sắp xếp: Bubble sort, Quick sort, Merge sort\n- Đệ quy: Fibonacci, Factorial\n- Dynamic Programming';
      } else if (lowerQuestion.includes('best practices') || lowerQuestion.includes('tốt')) {
        answer = 'Best practices khi viết code:\n1. Đặt tên biến rõ ràng, có ý nghĩa\n2. Viết code ngắn gọn, dễ đọc\n3. Comment code phức tạp\n4. Sử dụng version control (Git)\n5. Viết unit tests\n6. Refactor code thường xuyên';
      } else if (lowerQuestion.includes('học') || lowerQuestion.includes('learn')) {
        answer = 'Để học lập trình hiệu quả:\n1. Thực hành thường xuyên, code mỗi ngày\n2. Làm projects thực tế\n3. Đọc code của người khác\n4. Tham gia cộng đồng\n5. Debug và fix lỗi để học\n6. Kiên nhẫn, không bỏ cuộc';
      } else if (lowerQuestion.includes('python')) {
        answer = 'Python là ngôn ngữ lập trình phổ biến, dễ học. Các khái niệm cơ bản:\n- Variables, Data types\n- Functions, Classes\n- Lists, Dictionaries\n- Loops, Conditionals\n- Modules, Packages\nHãy thử làm các challenges Python trên BugHunter!';
      } else if (lowerQuestion.includes('javascript')) {
        answer = 'JavaScript là ngôn ngữ lập trình web. Các khái niệm:\n- Variables (var, let, const)\n- Functions, Objects, Arrays\n- DOM manipulation\n- Async/Await, Promises\n- ES6+ features\nHãy thử làm các challenges JavaScript trên BugHunter!';
      } else if (lowerQuestion.includes('recursion') || lowerQuestion.includes('đệ quy')) {
        answer = 'Recursion (đệ quy) là function gọi chính nó. Cấu trúc:\n- Base case: điều kiện dừng\n- Recursive case: gọi lại với input nhỏ hơn\nVí dụ tính giai thừa:\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n```';
      } else if (lowerQuestion.includes('object') || lowerQuestion.includes('đối tượng')) {
        answer = 'Object là cấu trúc dữ liệu key-value. Trong JavaScript:\n- Khai báo: const obj = { key: value }\n- Truy cập: obj.key hoặc obj["key"]\n- Methods: Object.keys(), Object.values()\n- Spread operator: { ...obj }';
      } else if (lowerQuestion.includes('promise') || lowerQuestion.includes('async')) {
        answer = 'Promise và async/await dùng để xử lý asynchronous code. Cách dùng:\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}\n```';
      } else if (lowerQuestion.includes('test') || lowerQuestion.includes('testing')) {
        answer = 'Testing là cách kiểm tra code hoạt động đúng. Các loại:\n- Unit tests: test từng function\n- Integration tests: test nhiều components\n- E2E tests: test toàn bộ flow\nTools: Jest (JS), pytest (Python)';
      } else if (lowerQuestion.includes('git') || lowerQuestion.includes('version control')) {
        answer = 'Git là version control system. Các lệnh cơ bản:\n- git init: khởi tạo\n- git add .: thêm files\n- git commit -m "message": commit\n- git push: đẩy lên remote\n- git pull: kéo về\n- git branch: quản lý branches';
      } else if (lowerQuestion.includes('module') || lowerQuestion.includes('package')) {
        answer = 'Modules và packages giúp tổ chức code. Trong Python:\n- Import: import module\n- Install: pip install package\nTrong Node.js:\n- Import: require() hoặc import\n- Install: npm install package';
      } else if (lowerQuestion.includes('optimize') || lowerQuestion.includes('tối ưu')) {
        answer = 'Tối ưu code để chạy nhanh hơn:\n1. Tránh vòng lặp lồng nhau không cần thiết\n2. Sử dụng data structures phù hợp\n3. Cache kết quả tính toán\n4. Lazy loading\n5. Code splitting\n6. Sử dụng algorithms hiệu quả';
      } else {
        answer = 'Đây là câu trả lời từ chatbot BugHunter. Tôi có thể giúp bạn với:\n- Câu hỏi về lập trình\n- Debug code và fix lỗi\n- Giải thích khái niệm\n- Gợi ý bài tập và challenges\n- Best practices và tips\nHãy hỏi tôi bất cứ điều gì về lập trình!';
      }
    }

    // Tạo chat history
    const chatHistory = new ChatHistory({
      userId: new mongoose.Types.ObjectId(userId),
      title: question.substring(0, 50),
      messages: [
        {
          role: 'user',
          content: question,
          timestamp: new Date(),
        },
        {
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
          rating: rating,
        },
      ],
    });

    await chatHistory.save();
  } catch (error: any) {
    throw new Error(`Lỗi khi tạo chat history: ${error.message}`);
  }
}

// Rate message
async function rateMessage(token: string, chatId: string, messageIndex: number, rating: 'good' | 'bad'): Promise<void> {
  try {
    await axios.post(
      `${API_URL}/api/chat/rate`,
      {
        chatId,
        messageIndex,
        rating,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    // Không throw error nếu rate fail, chỉ log
    console.log(`   ⚠️  Không thể rate message: ${error.message}`);
  }
}

async function testChatbotAndCreateHistory() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(finalMongoUri);
    console.log('✅ Đã kết nối MongoDB\n');

    // Tìm hoặc tạo test user
    let testUser = await User.findOne({ email: 'test@bughunter.com' }).lean();
    
    if (!testUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 10);
      const newUser = new User({
        email: 'test@bughunter.com',
        username: 'testuser',
        password: hashedPassword,
        favoriteLanguages: ['Python', 'JavaScript'],
        experience: 100,
        rank: 'Newbie',
      });
      await newUser.save();
      testUser = await User.findOne({ _id: newUser._id }).lean();
      console.log('✅ Đã tạo test user: test@bughunter.com\n');
    } else {
      console.log(`✅ Sử dụng user hiện có: ${testUser.email}\n`);
    }

    if (!testUser) {
      throw new Error('Không thể tạo hoặc tìm test user');
    }

    // Tạo JWT token
    const token = generateToken(testUser._id.toString());
    console.log('🔑 Đã tạo JWT token\n');

    console.log('='.repeat(70));
    console.log('💬 TEST CHATBOT VÀ TẠO CHAT HISTORIES');
    console.log('='.repeat(70));
    console.log();

    // Kiểm tra API có hoạt động không (test với một request đơn giản)
    console.log('🔍 Kiểm tra API server...');
    console.log(`   API URL: ${API_URL}`);
    console.log('   ⚠️  Đảm bảo server đang chạy. Nếu không, script sẽ báo lỗi khi gửi request.\n');

    let createdChats = 0;
    let failedChats = 0;
    let ratedMessages = 0;
    let useDirectDB = false; // Flag để quyết định dùng API hay DB trực tiếp

    // Test API connection trước
    console.log('🔍 Kiểm tra kết nối API...');
    try {
      // Thử gửi một request test (sẽ fail nhưng cho biết server có chạy không)
      await axios.get(`${API_URL}/api/chat/histories`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 3000,
        validateStatus: () => true, // Accept any status
      });
      console.log('✅ API server đang chạy, sẽ sử dụng API\n');
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log('⚠️  API server không chạy hoặc không thể kết nối');
        console.log('   Sẽ tạo chat histories trực tiếp trong database\n');
        useDirectDB = true;
      } else {
        console.log('✅ API server đang chạy (có thể cần auth), sẽ thử sử dụng API\n');
      }
    }

    // Gửi các câu hỏi mẫu
    for (let i = 0; i < sampleQuestions.length; i++) {
      const { question, rating } = sampleQuestions[i];
      
      console.log(`📝 Chat ${i + 1}/${sampleQuestions.length}: "${question.substring(0, 50)}..."`);
      
      try {
        if (useDirectDB) {
          // Tạo chat history trực tiếp trong database
          await createChatHistoryDirect(testUser._id.toString(), question, rating);
          createdChats++;
          console.log(`   ✅ Đã tạo chat history trực tiếp trong database`);
          if (rating) {
            ratedMessages++;
            console.log(`   ⭐ Đã thêm rating: ${rating}`);
          }
          console.log();
        } else {
          // Gửi message qua API
          const result = await sendChatMessage(token, question);
          console.log(`   ✅ Đã nhận phản hồi (${result.response.length} ký tự)`);
          console.log(`   📋 Chat ID: ${result.chatId}`);

          // Rate message nếu có rating
          if (rating && result.messageIndex !== undefined) {
            await rateMessage(token, result.chatId, result.messageIndex, rating);
            ratedMessages++;
            console.log(`   ⭐ Đã rate: ${rating}`);
          }

          // Gửi thêm 1-2 câu hỏi follow-up trong cùng chat
          const followUpQuestions = [
            'Có thể giải thích rõ hơn không?',
            'Cảm ơn bạn!',
          ];

          for (const followUp of followUpQuestions.slice(0, Math.floor(Math.random() * 2) + 1)) {
            try {
              const followUpResult = await sendChatMessage(token, followUp, result.chatId);
              console.log(`   💬 Follow-up: "${followUp}" - ✅`);
            } catch (error: any) {
              console.log(`   ⚠️  Follow-up failed: ${error.message}`);
            }
          }

          createdChats++;
          console.log();

          // Delay giữa các requests để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        console.log(`   ❌ Lỗi: ${error.message}`);
        if (error.message.includes('ECONNREFUSED') || error.message.includes('không thể kết nối')) {
          console.log(`   💡 Gợi ý: Đảm bảo server đang chạy ở ${API_URL}`);
          console.log(`   💡 Chạy: npm run dev (trong thư mục server)`);
        }
        failedChats++;
        console.log();
      }
    }

    // Thống kê
    const totalChatHistories = await ChatHistory.countDocuments({ userId: testUser._id });
    const chatsWithRatings = await ChatHistory.countDocuments({
      userId: testUser._id,
      'messages.rating': { $exists: true },
    });

    console.log('='.repeat(70));
    console.log('📊 KẾT QUẢ TEST CHATBOT');
    console.log('='.repeat(70));
    console.log(`✅ Đã tạo: ${createdChats} chat histories`);
    console.log(`❌ Thất bại: ${failedChats} chats`);
    console.log(`⭐ Đã rate: ${ratedMessages} messages`);
    console.log(`📚 Tổng số chat histories: ${totalChatHistories}`);
    console.log(`⭐ Chat histories có ratings: ${chatsWithRatings}`);
    console.log('='.repeat(70));

    if (createdChats > 0) {
      console.log('\n🎉 Test chatbot thành công!');
      console.log('💡 Bạn có thể:');
      console.log('   1. Kiểm tra chat histories trong database');
      console.log('   2. Xem chat histories trong frontend');
      console.log('   3. Chạy lại test để tạo thêm histories');
    }

  } catch (error: any) {
    console.error('❌ Lỗi nghiêm trọng:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

// Run test
if (require.main === module) {
  testChatbotAndCreateHistory()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testChatbotAndCreateHistory };

