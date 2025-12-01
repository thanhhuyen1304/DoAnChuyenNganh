# Hướng dẫn Tích hợp AI cho BugHunter

## Tổng quan
BugHunter tích hợp AI để cung cấp feedback chi tiết về code submissions và hỗ trợ scraping bài tập. Hệ thống sử dụng Google Gemini API với fallback rule-based analysis.

## AI Services

### 1. AI Analysis Service
Phân tích submissions và cung cấp feedback:
- **Error Analysis**: Phân loại lỗi (syntax, logic, runtime, timeout, memory)
- **Code Comparison**: So sánh code user với correct code
- **Test Case Analysis**: Phân tích từng test case pass/fail
- **Code Suggestions**: Gợi ý sửa code cụ thể
- **Recommendations**: Khuyến nghị cải thiện
- **Learning Points**: Điểm học tập từ lỗi

### 2. AI Problem Analyzer (cho Scraper)
Phân tích bài tập và đề xuất metadata:
- **Difficulty Classification**: Đề xuất độ khó (Easy/Medium/Hard)
- **Category Classification**: Phân loại bài tập (Syntax/Logic/Performance)
- **Tag Generation**: Tạo tags phù hợp (array, string, dynamic-programming)
- **Point Suggestion**: Gợi ý điểm số phù hợp
- **Keyword Extraction**: Trích xuất keywords quan trọng

### 3. AI Code Generator (cho Scraper)
Tạo buggy và correct code:
- **Buggy Code Generation**: Tạo code có lỗi phù hợp với bài
- **Correct Code Generation**: Tạo solution code
- **Language Support**: Hỗ trợ Python, JavaScript, Java, C++, C#, C
- **Bug Type Selection**: Các loại lỗi (syntax, logic, performance, random)

### 4. AI Test Case Generator (cho Scraper)
Tạo test cases chính xác:
- **Input Generation**: Tạo input test cases
- **Expected Output**: Tính toán output tương ứng
- **Edge Cases**: Tạo các trường hợp biên
- **Hidden Tests**: Tạo test cases ẩn

## Cấu hình AI

### Google Gemini API

1. **Lấy API Key**:
   - Truy cập: https://makersuite.google.com/app/apikey
   - Tạo new API key
   - Copy key

2. **Cấu hình Environment Variables**:
   ```env
   GEMINI_API_KEY=your-api-key-here
   GEMINI_MODEL=gemini-1.5-flash  # hoặc gemini-1.5-pro
   ```

3. **Models Available**:
   - `gemini-1.5-flash`: Nhanh, miễn phí (có giới hạn)
   - `gemini-1.5-pro`: Chất lượng cao, có phí
   - `gemini-pro`: Model cũ hơn

### Alternative AI Services

#### OpenAI GPT
```bash
npm install openai
```

```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # hoặc gpt-3.5-turbo
```

#### Anthropic Claude
```bash
npm install @anthropic-ai/sdk
```

```env
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

## Implementation Details

### AI Analysis Service Structure

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

### Integration with Submission Controller

```typescript
// Trong submission.controller.ts
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

### UI Component for AI Analysis

```typescript
// client/src/components/practice/SubmissionAnalysis.tsx
interface SubmissionAnalysisProps {
  analysis: AIAnalysis;
}

export const SubmissionAnalysis: React.FC<SubmissionAnalysisProps> = ({ analysis }) => {
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

      {/* Code Suggestions */}
      {analysis.codeSuggestions.map((suggestion, index) => (
        <CodeSuggestion key={index} suggestion={suggestion} />
      ))}

      {/* Test Case Analyses */}
      {analysis.testCaseAnalyses.map((testCase, index) => (
        <TestCaseAnalysis key={index} testCase={testCase} />
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

      {/* Learning Points */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">📚 Điểm học tập</h4>
        <ul className="list-disc list-inside space-y-1">
          {analysis.learningPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

## Caching và Optimization

### Cache AI Responses
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

### Hybrid Approach (Rule-based + AI)
```typescript
export class AIAnalysisService {
  async analyzeSubmission(options: AnalysisOptions): Promise<AIAnalysis> {
    // Try rule-based first
    const ruleBasedAnalysis = this.analyzeWithRules(options);
    
    // Use AI for complex cases
    if (ruleBasedAnalysis.needsDeepAnalysis) {
      return await this.analyzeWithAI(options);
    }
    
    return ruleBasedAnalysis;
  }
}
```

## Cost Optimization

### Rate Limiting
```typescript
// Limit AI calls per user
const userAILimits = new Map<string, { count: number; resetTime: number }>();

export const checkAILimit = (userId: string): boolean => {
  const limit = userAILimits.get(userId);
  const now = Date.now();
  
  if (!limit || now > limit.resetTime) {
    userAILimits.set(userId, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (limit.count >= 10) { // 10 calls per hour
    return false;
  }
  
  limit.count++;
  return true;
};
```

### Batch Processing
```typescript
// Process multiple submissions in parallel
export const batchAnalyzeSubmissions = async (submissions: Submission[]) => {
  const analyses = await Promise.all(
    submissions.map(submission => 
      aiAnalysisService.analyzeSubmission({
        userCode: submission.code,
        correctCode: submission.challenge.correctCode,
        // ...
      })
    )
  );
  
  return analyses;
};
```

## Testing AI Integration

### Test Cases
1. **Correct Submission**: Tất cả test cases pass
2. **Partial Submission**: Một số test cases pass
3. **Syntax Error**: Lỗi cú pháp
4. **Runtime Error**: Lỗi runtime
5. **Timeout Error**: Hết thời gian
6. **Memory Error**: Vượt bộ nhớ
7. **No Correct Code**: Không có correct code để so sánh

### Mock AI Service for Testing
```typescript
// tests/mocks/aiAnalysisService.mock.ts
export const mockAIAnalysisService = {
  analyzeSubmission: async (options: AnalysisOptions): Promise<AIAnalysis> => {
    // Return predefined analysis based on test case
    if (options.executionResults.some(r => !r.passed)) {
      return mockIncorrectAnalysis;
    }
    return mockCorrectAnalysis;
  }
};
```

## Troubleshooting

### Common Issues

#### 1. "API Key Invalid"
- Kiểm tra API key có đúng không
- Đảm bảo API key có quyền truy cập model
- Kiểm tra environment variables

#### 2. "Model Not Found"
- Kiểm tra tên model trong environment
- Sử dụng model được hỗ trợ
- Update API key nếu cần

#### 3. "Rate Limit Exceeded"
- Giảm số lượng API calls
- Implement caching
- Sử dụng rule-based fallback

#### 4. "Response Timeout"
- Tăng timeout cho API calls
- Giảm độ dài prompt
- Sử dụng model nhanh hơn

### Debug Tips
```typescript
// Add logging to AI service
console.log('AI Request:', { prompt: options.prompt, model: process.env.GEMINI_MODEL });
console.log('AI Response:', { response: result, usage: usage });

// Monitor API usage
const usageTracker = {
  dailyTokens: 0,
  dailyRequests: 0,
  lastReset: Date.now()
};
```

## Future Enhancements

### 1. Real-time AI Chat
- User có thể chat với AI về lỗi
- Giải thích khái niệm lập trình
- Gợi ý best practices

### 2. Personalized Learning
- Ghi nhận lịch sử lỗi
- Gợi ý bài tập phù hợp
- Điều chỉnh độ khó tự động

### 3. Code Style Analysis
- Review code style
- Gợi ý improvements
- Teaching coding standards

### 4. Visual Error Highlighting
- Highlight lỗi trực tiếp trong editor
- Interactive error explanations
- Step-by-step debugging

## Best Practices

1. **Always have fallback**: Rule-based analysis khi AI fail
2. **Cache responses**: Giảm cost và improve performance
3. **Rate limiting**: Tránh abuse và control costs
4. **Validate outputs**: Kiểm tra AI response trước khi sử dụng
5. **Monitor usage**: Theo dõi costs và performance
6. **Test thoroughly**: Test với nhiều scenarios khác nhau
7. **User feedback**: Thu thập feedback để cải thiện AI responses