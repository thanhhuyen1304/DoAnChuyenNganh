# 🤖 Hướng dẫn tích hợp AI cho Scraper

## Tổng quan

Tài liệu này mô tả các cách tích hợp AI để cải thiện chức năng scraper, giúp:
- Tự động phân tích và phân loại bài tập
- Tạo buggy code và correct code phù hợp với từng bài
- Tạo test cases chính xác
- Gợi ý độ khó và điểm số phù hợp

## 1. AI Services có thể sử dụng

### 1.1 OpenAI GPT-4/GPT-3.5
- **Ưu điểm**: Mạnh mẽ, hiểu context tốt
- **Chi phí**: ~$0.03-0.06 per 1K tokens
- **Use case**: Phân tích bài tập, tạo code, tạo test cases

### 1.2 Anthropic Claude
- **Ưu điểm**: An toàn, xử lý code tốt
- **Chi phí**: Tương tự OpenAI
- **Use case**: Phân tích và tạo code

### 1.3 Google Gemini
- **Ưu điểm**: Miễn phí (có giới hạn), hỗ trợ code tốt
- **Chi phí**: Free tier có sẵn
- **Use case**: Phân tích bài tập, tạo test cases

### 1.4 Local Models (Ollama, Llama.cpp)
- **Ưu điểm**: Miễn phí, bảo mật cao, không phụ thuộc internet
- **Chi phí**: Chỉ chi phí server
- **Use case**: Xử lý nội bộ, không cần API external

## 2. Implementation Plan

### 2.1 AI Problem Analyzer Service

Tạo service để phân tích bài tập và đề xuất metadata:

```typescript
// server/src/services/aiProblemAnalyzer.ts

interface ProblemAnalysis {
  suggestedDifficulty: 'Easy' | 'Medium' | 'Hard';
  suggestedCategory: string;
  suggestedTags: string[];
  suggestedPoints: number;
  problemType: 'array' | 'string' | 'math' | 'graph' | 'dynamic-programming' | 'other';
  keywords: string[];
}

class AIProblemAnalyzer {
  async analyzeProblem(problemStatement: string): Promise<ProblemAnalysis> {
    // Gọi AI API để phân tích
    // Return metadata đã phân tích
  }
}
```

### 2.2 AI Code Generator Service

Tạo service để generate buggy và correct code phù hợp với bài:

```typescript
// server/src/services/aiCodeGenerator.ts

interface CodeGenerationOptions {
  language: string;
  problemTitle: string;
  problemStatement: string;
  difficulty: string;
  bugType?: 'syntax' | 'logic' | 'performance' | 'random';
}

class AICodeGenerator {
  async generateBuggyCode(options: CodeGenerationOptions): Promise<string> {
    // Gọi AI để tạo buggy code phù hợp với bài
  }
  
  async generateCorrectCode(options: CodeGenerationOptions): Promise<string> {
    // Gọi AI để tạo correct code
  }
}
```

### 2.3 AI Test Case Generator

Tạo service để generate test cases chính xác:

```typescript
// server/src/services/aiTestCaseGenerator.ts

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
  isHidden: boolean;
  points: number;
}

class AITestCaseGenerator {
  async generateTestCases(
    problemStatement: string,
    correctCode: string,
    count: number = 5
  ): Promise<TestCase[]> {
    // Gọi AI để tạo test cases phù hợp
  }
}
```

## 3. Integration với RealProblemScraper

### 3.1 Modify RealProblemScraper

```typescript
// server/src/services/realProblemScraper.ts

import { AIProblemAnalyzer } from './aiProblemAnalyzer';
import { AICodeGenerator } from './aiCodeGenerator';
import { AITestCaseGenerator } from './aiTestCaseGenerator';

export class RealProblemScraper {
  private static aiAnalyzer = new AIProblemAnalyzer();
  private static aiCodeGen = new AICodeGenerator();
  private static aiTestCaseGen = new AITestCaseGenerator();

  static async scrapeLeetCode(
    skipCount: number = 0, 
    requestedLanguage?: string,
    useAI: boolean = false  // Flag để bật/tắt AI
  ): Promise<ScrapedProblem[]> {
    // ... existing scraping logic ...
    
    if (useAI) {
      // Phân tích bài với AI
      const analysis = await this.aiAnalyzer.analyzeProblem(question.content);
      
      // Generate code với AI
      problem.buggyCode = await this.aiCodeGen.generateBuggyCode({
        language: normalizedLang,
        problemTitle: question.title,
        problemStatement: question.content,
        difficulty: analysis.suggestedDifficulty
      });
      
      problem.correctCode = await this.aiCodeGen.generateCorrectCode({
        language: normalizedLang,
        problemTitle: question.title,
        problemStatement: question.content,
        difficulty: analysis.suggestedDifficulty
      });
      
      // Generate test cases với AI
      problem.testCases = await this.aiTestCaseGen.generateTestCases(
        question.content,
        problem.correctCode
      );
      
      // Sử dụng metadata từ AI
      problem.difficulty = analysis.suggestedDifficulty;
      problem.category = analysis.suggestedCategory;
      problem.tags = analysis.suggestedTags;
      problem.points = analysis.suggestedPoints;
    }
    
    return problems;
  }
}
```

### 3.2 Update Controller

```typescript
// server/src/controllers/scraper.controller.ts

export const scrapeLeetCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const useAI = req.body.useAI || false;  // Option để bật AI
  
  // ... existing logic ...
  
  const problems = await RealProblemScraper.scrapeLeetCode(
    0, 
    classificationSettings.language,
    useAI
  );
  
  // ...
};
```

## 4. Example Implementation với OpenAI

### 4.1 Setup

```bash
npm install openai
```

### 4.2 Environment Variables

```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # hoặc gpt-3.5-turbo cho chi phí thấp hơn
```

### 4.3 Implementation

```typescript
// server/src/services/aiProblemAnalyzer.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class AIProblemAnalyzer {
  async analyzeProblem(problemStatement: string): Promise<ProblemAnalysis> {
    const prompt = `
Phân tích bài toán sau và đề xuất:
1. Độ khó (Easy/Medium/Hard)
2. Danh mục (Syntax/Logic/Performance/Security)
3. Tags phù hợp (ví dụ: array, string, dynamic-programming)
4. Điểm số (10-30)
5. Loại bài toán (array/string/math/graph/dynamic-programming/other)
6. Keywords quan trọng

Bài toán:
${problemStatement}

Trả về JSON format:
{
  "suggestedDifficulty": "Medium",
  "suggestedCategory": "Logic",
  "suggestedTags": ["array", "two-pointer"],
  "suggestedPoints": 20,
  "problemType": "array",
  "keywords": ["sum", "two", "target"]
}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert programming problem analyzer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  }
}
```

## 5. Caching và Optimization

### 5.1 Cache AI Responses

```typescript
import NodeCache from 'node-cache';

const aiCache = new NodeCache({ stdTTL: 3600 }); // Cache 1 giờ

async analyzeProblem(problemStatement: string): Promise<ProblemAnalysis> {
  const cacheKey = `analysis_${this.hash(problemStatement)}`;
  const cached = aiCache.get<ProblemAnalysis>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await this.callAI(problemStatement);
  aiCache.set(cacheKey, result);
  
  return result;
}
```

### 5.2 Batch Processing

```typescript
// Process multiple problems in parallel để tối ưu
async scrapeWithAI(problems: ScrapedProblem[]) {
  const analyses = await Promise.all(
    problems.map(p => this.aiAnalyzer.analyzeProblem(p.problemStatement))
  );
  
  // ...
}
```

## 6. Cost Estimation

### 6.1 OpenAI GPT-3.5-turbo
- Input: $0.0015 per 1K tokens
- Output: $0.002 per 1K tokens
- **Estimated cost per problem**: ~$0.01-0.02

### 6.2 OpenAI GPT-4
- Input: $0.01 per 1K tokens  
- Output: $0.03 per 1K tokens
- **Estimated cost per problem**: ~$0.05-0.10

### 6.3 Google Gemini (Free tier)
- Free: 15 requests/minute
- **Estimated cost**: $0 (có giới hạn)

## 7. Best Practices

1. **Rate Limiting**: Thêm rate limiting để tránh vượt quá API limits
2. **Error Handling**: Xử lý lỗi AI API gracefully với fallback về method cũ
3. **Validation**: Validate AI output trước khi sử dụng
4. **Logging**: Log tất cả AI calls để theo dõi cost và debug
5. **Testing**: Test AI outputs với sample problems trước khi deploy

## 8. Example API Request với AI

```typescript
// Frontend request
POST /api/scraper/leetcode
{
  "classification": {
    "language": "Python",
    "difficulty": "Medium",
    "category": "Logic",
    "points": 20
  },
  "useAI": true,  // Bật AI
  "aiOptions": {
    "analyze": true,      // Phân tích bài
    "generateCode": true, // Tạo code
    "generateTests": true // Tạo test cases
  }
}
```

## 9. Next Steps

1. ✅ Tạo AI service interfaces
2. ⏳ Implement với OpenAI
3. ⏳ Add caching layer
4. ⏳ Add error handling và fallbacks
5. ⏳ Test với sample problems
6. ⏳ Monitor costs và performance
7. ⏳ Consider local models cho production

## 10. Alternative: Hybrid Approach

Kết hợp AI và rule-based:
- Sử dụng rule-based cho cases đơn giản
- Chỉ dùng AI cho cases phức tạp hoặc khi rule-based fail
- Giảm cost đáng kể

```typescript
async generateCode(options: CodeGenerationOptions): Promise<string> {
  // Try rule-based first
  try {
    return this.generateCodeByRules(options);
  } catch (error) {
    // Fallback to AI
    return await this.aiCodeGen.generateCode(options);
  }
}
```

