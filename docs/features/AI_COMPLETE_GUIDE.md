# Hướng Dẫn AI Hoàn Chỉnh - BugHunter

## 📋 Mục Lục

1. [Tổng Quan AI System](#tổng-quan-ai-system)
2. [Gemini API Setup](#gemini-api-setup)
3. [Training AI](#training-ai)
4. [Adaptive Learning](#adaptive-learning)
5. [AI Analysis Service](#ai-analysis-service)

---

## Tổng Quan AI System

BugHunter tích hợp nhiều tính năng AI để hỗ trợ người dùng:

### Các AI Services

1. **ChatBox AI** - Trợ lý chat thông minh
2. **AI Analysis Service** - Phân tích code submissions
3. **AI Problem Analyzer** - Phân tích và gợi ý bài tập
4. **AI Code Generator** - Tạo buggy và correct code
5. **AI Test Case Generator** - Tạo test cases tự động

### Hybrid AI Strategy

```
Người dùng hỏi câu hỏi
         ↓
   [Hybrid Strategy]
   ├─ Layer 1: Adaptive Learning (nhanh, free) ✅
   ├─ Layer 2: Training Data (nhanh, free) ✅
   └─ Layer 3: Gemini Pro (chính xác, có phí) ✅
         ↓
    AI trả lời
```

**Ưu điểm:**
- Tiết kiệm 80% chi phí API
- Response nhanh hơn
- Tự động học từ người dùng
- Fallback khi API fail

---

## Gemini API Setup

### 🎯 3 Bước Cơ Bản

#### 1️⃣ Lấy API Key (5 phút)

1. Truy cập: https://aistudio.google.com
2. Đăng nhập với Google account
3. Click "Get API Key"
4. Copy API Key

#### 2️⃣ Cấu hình Environment Variables

**File: `client/.env.local`**
```env
REACT_APP_GEMINI_API_KEY=your-api-key-here
```

**File: `server/.env`**
```env
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

#### 3️⃣ Restart Server

```bash
# Server
cd server
npm run dev

# Client
cd client
npm run dev
```

### Models Available

- `gemini-1.5-flash`: Nhanh, miễn phí (có giới hạn)
- `gemini-1.5-pro`: Chất lượng cao, có phí
- `gemini-pro`: Model cũ hơn

### 💰 Chi Phí

- **Input**: $0.5 / 1M tokens
- **Output**: $1.5 / 1M tokens
- **1 câu hỏi**: ~0.001 USD
- **100 câu/ngày**: ~$0.2/ngày (~$6/tháng)

💡 **Hybrid Strategy tiết kiệm 80% chi phí**

### 🐛 Troubleshooting

#### Kiểm tra API Key
```bash
echo $REACT_APP_GEMINI_API_KEY
# Hoặc trong browser console:
console.log(process.env.REACT_APP_GEMINI_API_KEY)
```

#### Test API Connection
```bash
node test-gemini.js
```

#### Common Issues

1. **"API Key not found"**
   - Check `.env.local` file exists
   - Restart dev server

2. **"404 Model not found"**
   - Check model name in config
   - Use `gemini-1.5-flash` instead of `gemini-pro`

3. **Rate Limit Exceeded**
   - Implement caching
   - Use hybrid strategy
   - Upgrade to paid tier

---

## Training AI

### 🎯 Cách Hoạt Động

1. **Admin thêm Training Data**: Câu hỏi và câu trả lời mẫu
2. **AI tìm kiếm**: Khi user hỏi, hệ thống tự động tìm training data liên quan
3. **Context Injection**: Training data được inject vào prompt của AI
4. **AI trả lời**: AI sử dụng training data làm tham khảo

### PHƯƠNG PHÁP 1: Training Qua Admin Dashboard (Khuyến Nghị)

#### Bước 1: Truy Cập Admin Dashboard

1. Đăng nhập với tài khoản Admin
2. Vào Admin Dashboard
3. Chọn tab **"Training Data AI"** (icon 🧠)

#### Bước 2: Thêm Training Data

1. Click nút **"Thêm mới"**
2. Điền thông tin:
   - **Câu hỏi / Keyword**: Câu hỏi hoặc từ khóa
   - **Câu trả lời**: Câu trả lời chi tiết (có thể dài)
   - **Danh mục**: Phân loại (programming, debugging, javascript)
   - **Tags**: Từ khóa bổ sung, phân cách bằng dấu phẩy
   - **Độ ưu tiên**: 1-10 (cao hơn = ưu tiên hơn)
3. Click **"Lưu"**

#### Ví Dụ Training Data

**Ví dụ 1: Debug JavaScript**

```
Câu hỏi: "Làm sao debug lỗi JavaScript?"

Câu trả lời:
Để debug lỗi JavaScript, bạn có thể:

1. **Sử dụng console.log()**: In giá trị biến
   ```javascript
   console.log('Variable:', myVariable);
   ```

2. **Sử dụng debugger statement**: Dừng code tại điểm cụ thể
   ```javascript
   debugger; // Code sẽ dừng ở đây
   ```

3. **Sử dụng DevTools**: Nhấn F12
   - Console tab: Xem logs và errors
   - Sources tab: Đặt breakpoints

4. **Sử dụng try-catch**: Bắt và xử lý lỗi

Danh mục: debugging
Tags: javascript, debug, error, console, devtools
Độ ưu tiên: 9
```

**Ví dụ 2: React Hooks**

```
Câu hỏi: "React hooks là gì?"

Câu trả lời:
React Hooks là các functions cho phép bạn sử dụng state và các tính năng React khác trong functional components.

**Các hooks phổ biến:**

1. **useState**: Quản lý state
2. **useEffect**: Side effects
3. **useContext**: Truy cập context
4. **useReducer**: Quản lý state phức tạp

Danh mục: react
Tags: react, hooks, useState, useEffect
Độ ưu tiên: 8
```

### PHƯƠNG PHÁP 2: Import Training Data Hàng Loạt

#### Chuẩn Bị File JSON

Tạo file `training-data.json`:

```json
[
  {
    "question": "Làm sao debug lỗi?",
    "answer": "Để debug lỗi, bạn có thể:\n1. Sử dụng console.log()...",
    "category": "debugging",
    "tags": ["debug", "error", "javascript"],
    "priority": 8
  },
  {
    "question": "React là gì?",
    "answer": "React là một thư viện JavaScript...",
    "category": "react",
    "tags": ["react", "javascript", "frontend"],
    "priority": 7
  }
]
```

#### Import File

1. Admin Dashboard → Training Data AI
2. Click **"Import"**
3. Chọn file JSON
4. Click **"Upload"**

### 💡 Best Practices

1. **Câu hỏi ngắn gọn**: Sử dụng từ khóa hoặc câu hỏi ngắn
2. **Câu trả lời chi tiết**: Viết đầy đủ, có ví dụ code
3. **Tags đầy đủ**: Thêm nhiều tags liên quan
4. **Priority hợp lý**:
   - 8-10: Câu hỏi quan trọng, thường gặp
   - 5-7: Câu hỏi thông thường
   - 1-4: Câu hỏi ít gặp
5. **Danh mục rõ ràng**: Phân loại đúng để dễ quản lý

### 📊 Cấu Trúc Training Data

```typescript
interface TrainingData {
  question: string;              // Câu hỏi hoặc keyword
  answer: string;                // Câu trả lời chi tiết
  category: string;              // Danh mục
  tags: string[];                // Tags
  priority: number;              // 1-10
  isActive: boolean;             // Bật/Tắt
  usageCount?: number;           // Số lần sử dụng
  rating?: number;               // Đánh giá 1-5
}
```

---

## Adaptive Learning

### 🎯 Tổng Quan

Thay vì phải viết training data thủ công, hệ thống **tự động học từ câu hỏi của người dùng**.

### 🔄 Quy Trình

```
1. Người dùng hỏi câu hỏi
         ↓
2. AI trả lời
         ↓
3. Người dùng đánh giá (👍 hoặc 👎)
         ↓
4. AI tự động học từ phản hồi
         ↓
5. Câu hỏi tương tự lần sau được trả lời tốt hơn
```

### Cách AI Học

#### 1. Trích Xuất Keywords

```typescript
// Input: "làm sao để debug lỗi?"
// Output keywords: ["debug", "lỗi"]

// Input: "code không chạy sao?"
// Output keywords: ["code", "chạy"]
```

**Cách trích xuất:**
- Tách từng từ
- Loại bỏ stopwords (là, cái, tôi, bạn, gì, nào...)
- Giữ lại từ khóa quan trọng
- Loại từ ngắn (< 2 ký tự)

#### 2. Lưu Pattern

```typescript
// Khi câu trả lời được 👍
Pattern {
  keywords: ["debug", "lỗi"]
  response: "Để debug hiệu quả..."
  frequency: 1
  avgRating: 1.0  // 1.0 = tốt, 0.0 = tệ
}
```

#### 3. Tìm Câu Trả Lời Tốt Nhất

```
Score = frequency × avgRating

Pattern 1: frequency=5, avgRating=0.9 → score=4.5 ✅
Pattern 2: frequency=2, avgRating=0.5 → score=1.0
Pattern 3: frequency=10, avgRating=0.1 → score=1.0

→ Chọn Pattern 1 (score cao nhất)
```

### 💾 Lưu Trữ Dữ Liệu

**Nơi lưu trữ:**
- **LocalStorage**: Lưu dữ liệu người dùng (không mất khi reload)
- **Server (optional)**: Gửi để phân tích sâu hơn

**Dữ liệu lưu trữ:**
```json
{
  "interactions": [
    {
      "question": "debug lỗi",
      "answer": "Để debug...",
      "rating": "good",
      "timestamp": "2025-11-15T10:30:00Z"
    }
  ],
  "learnedPatterns": {
    "debug_vi": {
      "keywords": ["debug"],
      "responses": ["Để debug...", "Mẹo debug..."],
      "frequency": 5,
      "avgRating": 0.9
    }
  }
}
```

### 🎮 Các Tính Năng

#### 1. Tự động học từ câu hỏi
- Không cần code training data
- Người dùng hỏi → AI học

#### 2. Phản hồi người dùng
- Người dùng đánh giá 👍 hoặc 👎
- AI cải thiện dựa vào đánh giá

#### 3. Xem thống kê
```
📊 Thống kê AI:
✓ Tổng câu hỏi: 50
👍 Tốt: 45
👎 Tệ: 5
📊 Độ chính xác: 90%
🧠 Đã học: 120 patterns
```

#### 4. Export/Import dữ liệu
- Xuất dữ liệu đã học ra file JSON
- Import dữ liệu từ file để backup

### 🚀 Cách Sử Dụng

#### Trong ChatBox

```typescript
// Lưu interaction (tự động)
adaptiveAI.saveInteraction(
  "làm sao debug?",
  "Để debug hiệu quả...",
  "vi"  // language
)

// Cập nhật rating
adaptiveAI.updateRating(messageIndex, "good")

// Lấy thống kê
const stats = adaptiveAI.getStats()
console.log(stats.accuracy)  // "90%"
```

#### Export dữ liệu

```typescript
const data = adaptiveAI.exportLearnedData()
// Lưu vào file JSON
const blob = new Blob([data], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'bughunter_ai_data.json'
a.click()
```

### 📈 Cải Thiện Hiệu Suất

**Lúc đầu (0 interactions):**
```
Q: "debug lỗi?"
A: "Bạn có thể cụ thể hóa thêm không?" ← Trả lời mặc định
```

**Sau 10 interactions:**
```
Q: "debug lỗi?"
A: "Để debug hiệu quả, bạn nên..." ← Bắt đầu learn
```

**Sau 100 interactions:**
```
Q: "tôi gặp lỗi sao?"
A: "Để debug hiệu quả... [câu trả lời cụ thể]" ← Đã học được
Độ chính xác: 85-90%
```

**Sau 1000 interactions:**
```
Q: "không chạy sao?"
A: "Để debug hiệu quả... [câu trả lời phù hợp ngữ cảnh]" ← Rất chính xác
Độ chính xác: 90-95%
```

---

## AI Analysis Service

### Tổng Quan

AI Analysis Service phân tích submissions và cung cấp feedback chi tiết về code.

### Tính Năng

1. **Error Analysis**: Phân loại lỗi (syntax, logic, runtime, timeout, memory)
2. **Code Comparison**: So sánh code user với correct code
3. **Test Case Analysis**: Phân tích từng test case pass/fail
4. **Code Suggestions**: Gợi ý sửa code cụ thể
5. **Recommendations**: Khuyến nghị cải thiện
6. **Learning Points**: Điểm học tập từ lỗi

### Cấu Trúc Response

```typescript
interface AIAnalysis {
  overallStatus: 'correct' | 'partial' | 'incorrect';
  score: number;
  totalPoints: number;
  summary: string;
  recommendations: string[];
  learningPoints: string[];
  errorAnalyses: Array<{
    errorType: 'syntax' | 'logic' | 'runtime' | 'timeout' | 'memory';
    errorMessage: string;
    errorLocation?: { line: number; codeSnippet: string };
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  codeSuggestions: Array<{
    line: number;
    currentCode: string;
    suggestedCode: string;
    explanation: string;
    confidence: number;
  }>;
  testCaseAnalyses: Array<{
    testCaseIndex: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    analysis: string;
    hints?: string[];
  }>;
}
```

### Integration với Submission Controller

```typescript
import aiAnalysisService from '../services/aiAnalysisService';

export const submitSolution = async (req, res, next) => {
  try {
    // ... existing submission logic ...
    
    // AI Analysis
    if (submission.executionResults) {
      const aiAnalysis = await aiAnalysisService.analyzeSubmission({
        userCode: submission.code,
        correctCode: challenge.correctCode,
        language: submission.language,
        executionResults: submission.executionResults,
        problemStatement: challenge.description
      });
      
      submission.aiAnalysis = aiAnalysis;
      await submission.save();
    }
    
    res.json({
      success: true,
      data: {
        submission,
        aiAnalysis: submission.aiAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### UI Component

```typescript
// SubmissionAnalysis.tsx
export const SubmissionAnalysis: React.FC<{ analysis: AIAnalysis }> = ({ analysis }) => {
  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${
        analysis.overallStatus === 'correct' ? 'bg-green-100' :
        analysis.overallStatus === 'partial' ? 'bg-yellow-100' : 'bg-red-100'
      }`}>
        <h3 className="font-semibold">
          {analysis.overallStatus === 'correct' ? '✅ Đúng' :
           analysis.overallStatus === 'partial' ? '⚠️ Một phần' : '❌ Sai'}
        </h3>
        <p>{analysis.summary}</p>
      </div>

      {/* Error Analyses */}
      {analysis.errorAnalyses.map((error, index) => (
        <ErrorAnalysis key={index} error={error} />
      ))}

      {/* Recommendations */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">💡 Gợi ý cải thiện</h4>
        <ul className="list-disc list-inside space-y-1">
          {analysis.recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

### Caching và Optimization

```typescript
import NodeCache from 'node-cache';

const aiCache = new NodeCache({ stdTTL: 3600 }); // Cache 1 giờ

export class AIAnalysisService {
  async analyzeSubmission(options: AnalysisOptions): Promise<AIAnalysis> {
    const cacheKey = `analysis_${this.hash(options)}`;
    const cached = aiCache.get<AIAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await this.callAI(options);
    aiCache.set(cacheKey, result);
    
    return result;
  }
}
```

### Cost Optimization

#### Rate Limiting
```typescript
const userAILimits = new Map<string, { count: number; resetTime: number }>();

export const checkAILimit = (userId: string): boolean => {
  const limit = userAILimits.get(userId);
  const now = Date.now();
  
  if (!limit || now > limit.resetTime) {
    userAILimits.set(userId, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  
  if (limit.count >= 10) { // 10 calls per hour
    return false;
  }
  
  limit.count++;
  return true;
};
```

---

## 📚 Alternative AI Services

### OpenAI GPT

```bash
npm install openai
```

```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### Anthropic Claude

```bash
npm install @anthropic-ai/sdk
```

```env
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

---

## 🎯 Best Practices

1. **Always have fallback**: Rule-based analysis khi AI fail
2. **Cache responses**: Giảm cost và improve performance
3. **Rate limiting**: Tránh abuse và control costs
4. **Validate outputs**: Kiểm tra AI response trước khi sử dụng
5. **Monitor usage**: Theo dõi costs và performance
6. **Test thoroughly**: Test với nhiều scenarios khác nhau
7. **User feedback**: Thu thập feedback để cải thiện AI responses

---

## 🚀 Future Enhancements

1. **Real-time AI Chat**: User có thể chat với AI về lỗi
2. **Personalized Learning**: Ghi nhận lịch sử lỗi, gợi ý bài tập phù hợp
3. **Code Style Analysis**: Review code style, gợi ý improvements
4. **Visual Error Highlighting**: Highlight lỗi trực tiếp trong editor

---

**Last Updated:** 2025-12-03
**Version:** 2.0.0