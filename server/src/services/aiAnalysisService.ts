/**
 * AI Analysis Service
 * Phân tích submission và cung cấp feedback chi tiết về lỗi
 * Hỗ trợ cả rule-based và Gemini Pro AI
 */

import { ENV } from '../../config/environment';

export interface ErrorAnalysis {
  errorType: 'syntax' | 'logic' | 'runtime' | 'performance' | 'timeout' | 'memory' | 'other';
  errorMessage: string;
  errorLocation?: {
    line: number;
    column?: number;
    codeSnippet?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface CodeSuggestion {
  line: number;
  currentCode: string;
  suggestedCode: string;
  explanation: string;
  confidence: number; // 0-1
}

export interface SubmissionAnalysis {
  overallStatus: 'correct' | 'partial' | 'incorrect';
  score: number;
  totalPoints: number;
  errorAnalyses: ErrorAnalysis[];
  codeSuggestions: CodeSuggestion[];
  testCaseAnalyses: TestCaseAnalysis[];
  summary: string;
  recommendations: string[];
  learningPoints: string[];
}

export interface TestCaseAnalysis {
  testCaseIndex: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  errorMessage?: string;
  analysis: string;
  hints?: string[];
}

export interface AnalysisOptions {
  userCode: string;
  correctCode?: string;
  buggyCode?: string;
  language: string;
  problemStatement: string;
  executionResults: Array<{
    testCaseIndex: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    errorMessage?: string;
  }>;
  errorMessage?: string;
  status: string;
}

class AIAnalysisService {
  /**
   * Phân tích submission với AI
   * Hiện tại sử dụng rule-based analysis, có thể nâng cấp với OpenAI/Claude
   */
  async analyzeSubmission(options: AnalysisOptions): Promise<SubmissionAnalysis> {
    const {
      userCode,
      correctCode,
      buggyCode,
      language,
      problemStatement,
      executionResults,
      errorMessage,
      status
    } = options;

    // Phân tích từng test case
    const testCaseAnalyses = this.analyzeTestCases(executionResults);

    // Phân tích lỗi từ status và error message
    const errorAnalyses = this.analyzeErrors(status, errorMessage, userCode, language);

    // So sánh code với correct code nếu có
    const codeSuggestions = correctCode 
      ? this.compareCode(userCode, correctCode, language)
      : [];

    // Tính điểm tổng
    const passedCount = executionResults.filter(r => r.passed).length;
    const totalCount = executionResults.length;
    const score = executionResults.reduce((sum, r) => sum + (r.passed ? 1 : 0), 0);
    
    // Xác định overall status
    let overallStatus: 'correct' | 'partial' | 'incorrect';
    if (passedCount === totalCount) {
      overallStatus = 'correct';
    } else if (passedCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'incorrect';
    }

    // Tạo summary
    const summary = this.generateSummary(overallStatus, passedCount, totalCount, errorAnalyses);

    // Tạo recommendations
    const recommendations = this.generateRecommendations(errorAnalyses, codeSuggestions, testCaseAnalyses);

    // Tạo learning points
    const learningPoints = this.generateLearningPoints(errorAnalyses, problemStatement);

    return {
      overallStatus,
      score,
      totalPoints: totalCount,
      errorAnalyses,
      codeSuggestions,
      testCaseAnalyses,
      summary,
      recommendations,
      learningPoints
    };
  }

  /**
   * Phân tích từng test case
   */
  private analyzeTestCases(
    executionResults: AnalysisOptions['executionResults']
  ): TestCaseAnalysis[] {
    return executionResults.map((result, index) => {
      let analysis = '';
      const hints: string[] = [];

      if (result.passed) {
        analysis = `Test case ${index + 1} đã pass thành công.`;
      } else {
        // Phân tích lỗi
        if (result.errorMessage) {
          analysis = `Lỗi khi chạy test case ${index + 1}: ${result.errorMessage}`;
        } else {
          // So sánh output
          const expected = result.expectedOutput.trim();
          const actual = result.actualOutput.trim();

          if (expected !== actual) {
            analysis = `Output không khớp. Kỳ vọng: "${expected}", Nhận được: "${actual}"`;
            
            // Gợi ý dựa trên sự khác biệt
            if (actual.includes('undefined') || actual.includes('null')) {
              hints.push('Kiểm tra xem tất cả biến đã được khởi tạo chưa');
            }
            if (expected.length !== actual.length) {
              hints.push('Kiểm tra độ dài của output có đúng không');
            }
            if (actual.includes('Error') || actual.includes('Exception')) {
              hints.push('Có lỗi runtime xảy ra. Kiểm tra lại logic xử lý');
            }
          }
        }
      }

      return {
        testCaseIndex: index,
        passed: result.passed,
        input: result.input,
        expectedOutput: result.expectedOutput,
        actualOutput: result.actualOutput,
        errorMessage: result.errorMessage,
        analysis,
        hints: hints.length > 0 ? hints : undefined
      };
    });
  }

  /**
   * Phân tích lỗi từ status và error message
   */
  private analyzeErrors(
    status: string,
    errorMessage: string | undefined,
    userCode: string,
    language: string
  ): ErrorAnalysis[] {
    const errors: ErrorAnalysis[] = [];

    switch (status) {
      case 'Compilation Error':
        errors.push({
          errorType: 'syntax',
          errorMessage: errorMessage || 'Lỗi biên dịch',
          severity: 'critical',
          description: 'Code không thể biên dịch. Kiểm tra cú pháp, dấu ngoặc, và các từ khóa.',
          errorLocation: this.findErrorLocation(userCode, errorMessage)
        });
        break;

      case 'Runtime Error':
        errors.push({
          errorType: 'runtime',
          errorMessage: errorMessage || 'Lỗi runtime',
          severity: 'high',
          description: 'Lỗi xảy ra khi chạy code. Kiểm tra null pointer, array index out of bounds, hoặc division by zero.',
          errorLocation: this.findErrorLocation(userCode, errorMessage)
        });
        break;

      case 'Time Limit Exceeded':
        errors.push({
          errorType: 'timeout',
          errorMessage: 'Vượt quá thời gian cho phép',
          severity: 'high',
          description: 'Code chạy quá lâu. Có thể do vòng lặp vô hạn hoặc thuật toán không tối ưu.',
        });
        break;

      case 'Memory Limit Exceeded':
        errors.push({
          errorType: 'memory',
          errorMessage: 'Vượt quá bộ nhớ cho phép',
          severity: 'high',
          description: 'Code sử dụng quá nhiều bộ nhớ. Kiểm tra việc tạo mảng lớn hoặc đệ quy sâu.',
        });
        break;

      case 'Wrong Answer':
        errors.push({
          errorType: 'logic',
          errorMessage: 'Kết quả không đúng',
          severity: 'medium',
          description: 'Code chạy được nhưng cho kết quả sai. Kiểm tra lại logic của thuật toán.',
        });
        break;

      default:
        if (errorMessage) {
          errors.push({
            errorType: 'other',
            errorMessage,
            severity: 'medium',
            description: errorMessage
          });
        }
    }

    return errors;
  }

  /**
   * So sánh code user với correct code
   */
  private compareCode(
    userCode: string,
    correctCode: string,
    language: string
  ): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const userLines = userCode.split('\n');
    const correctLines = correctCode.split('\n');

    // So sánh từng dòng (đơn giản)
    const maxLines = Math.max(userLines.length, correctLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const userLine = userLines[i]?.trim() || '';
      const correctLine = correctLines[i]?.trim() || '';

      if (userLine !== correctLine && correctLine) {
        // Chỉ suggest nếu khác biệt đáng kể
        if (this.isSignificantDifference(userLine, correctLine)) {
          suggestions.push({
            line: i + 1,
            currentCode: userLine,
            suggestedCode: correctLine,
            explanation: this.generateExplanation(userLine, correctLine),
            confidence: 0.7
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Kiểm tra xem có khác biệt đáng kể không
   */
  private isSignificantDifference(userLine: string, correctLine: string): boolean {
    // Bỏ qua sự khác biệt về whitespace
    const userNormalized = userLine.replace(/\s+/g, ' ');
    const correctNormalized = correctLine.replace(/\s+/g, ' ');
    
    if (userNormalized === correctNormalized) return false;

    // Bỏ qua comment-only differences
    if (userNormalized.startsWith('//') && correctNormalized.startsWith('//')) {
      return false;
    }

    return true;
  }

  /**
   * Tạo explanation cho suggestion
   */
  private generateExplanation(userLine: string, correctLine: string): string {
    // Phân tích sự khác biệt và đưa ra explanation
    if (correctLine.includes('return') && !userLine.includes('return')) {
      return 'Cần thêm return statement';
    }
    if (correctLine.includes('if') && !userLine.includes('if')) {
      return 'Thiếu điều kiện kiểm tra';
    }
    if (correctLine.includes('=') && userLine.includes('==')) {
      return 'Cần sử dụng phép gán thay vì so sánh';
    }
    
    return 'Cần sửa code tại dòng này để khớp với giải pháp đúng';
  }

  /**
   * Tìm vị trí lỗi trong code
   */
  private findErrorLocation(code: string, errorMessage?: string): ErrorAnalysis['errorLocation'] | undefined {
    if (!errorMessage) return undefined;

    // Tìm số dòng trong error message (ví dụ: "line 5", "at line 10")
    const lineMatch = errorMessage.match(/line\s+(\d+)/i);
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[1]);
      const lines = code.split('\n');
      if (lines[lineNumber - 1]) {
        return {
          line: lineNumber,
          codeSnippet: lines[lineNumber - 1].trim()
        };
      }
    }

    return undefined;
  }

  /**
   * Tạo summary
   */
  private generateSummary(
    overallStatus: 'correct' | 'partial' | 'incorrect',
    passedCount: number,
    totalCount: number,
    errorAnalyses: ErrorAnalysis[]
  ): string {
    if (overallStatus === 'correct') {
      return `Tuyệt vời! Bạn đã pass tất cả ${totalCount} test case.`;
    } else if (overallStatus === 'partial') {
      return `Bạn đã pass ${passedCount}/${totalCount} test case. Cần sửa thêm để pass tất cả.`;
    } else {
      const mainError = errorAnalyses[0];
      if (mainError) {
        return `Code chưa đúng. ${mainError.description}`;
      }
      return `Bạn chưa pass test case nào. Hãy kiểm tra lại code.`;
    }
  }

  /**
   * Tạo recommendations
   */
  private generateRecommendations(
    errorAnalyses: ErrorAnalysis[],
    codeSuggestions: CodeSuggestion[],
    testCaseAnalyses: TestCaseAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // Từ error analyses
    errorAnalyses.forEach(error => {
      if (error.errorType === 'syntax') {
        recommendations.push('Kiểm tra cú pháp: dấu ngoặc, dấu chấm phẩy, và các từ khóa');
      } else if (error.errorType === 'logic') {
        recommendations.push('Xem lại logic của thuật toán, đặc biệt là các điều kiện và vòng lặp');
      } else if (error.errorType === 'runtime') {
        recommendations.push('Kiểm tra null pointer, array bounds, và division by zero');
      } else if (error.errorType === 'timeout') {
        recommendations.push('Tối ưu hóa thuật toán để giảm thời gian chạy');
      }
    });

    // Từ code suggestions
    if (codeSuggestions.length > 0) {
      recommendations.push(`Có ${codeSuggestions.length} vị trí trong code cần được sửa`);
    }

    // Từ test case analyses
    const failedTests = testCaseAnalyses.filter(tc => !tc.passed);
    if (failedTests.length > 0) {
      const firstFailed = failedTests[0];
      if (firstFailed.hints && firstFailed.hints.length > 0) {
        recommendations.push(...firstFailed.hints);
      }
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Tạo learning points
   */
  private generateLearningPoints(
    errorAnalyses: ErrorAnalysis[],
    problemStatement: string
  ): string[] {
    const points: string[] = [];

    errorAnalyses.forEach(error => {
      if (error.errorType === 'syntax') {
        points.push('Luyện tập về cú pháp của ngôn ngữ lập trình');
      } else if (error.errorType === 'logic') {
        points.push('Rèn luyện tư duy logic và thuật toán');
      } else if (error.errorType === 'runtime') {
        points.push('Học cách xử lý edge cases và error handling');
      } else if (error.errorType === 'timeout') {
        points.push('Tối ưu hóa thuật toán và độ phức tạp thời gian');
      }
    });

    return points;
  }

  /**
   * Tích hợp với Gemini Pro API
   */
  async analyzeWithGemini(options: AnalysisOptions): Promise<SubmissionAnalysis> {
    if (!ENV.GEMINI_API_KEY) {
      console.warn('Gemini API key không có, sử dụng rule-based analysis');
      return this.analyzeSubmission(options);
    }

    try {
      // Import Google Generative AI (dynamic import để tránh lỗi nếu chưa cài)
      // Chỉ import nếu có API key để tránh lỗi khi package chưa cài
      let GoogleGenerativeAI: any;
      try {
        const module = await import('@google/generative-ai');
        GoogleGenerativeAI = module.GoogleGenerativeAI;
      } catch (importError) {
        console.warn('@google/generative-ai package chưa được cài đặt. Chạy: npm install @google/generative-ai');
        return this.analyzeSubmission(options);
      }
      
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Tạo prompt cho Gemini
      const prompt = this.buildGeminiPrompt(options);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response từ Gemini
      try {
        const aiAnalysis = JSON.parse(text);
        return await this.validateAndMergeAnalysis(aiAnalysis, options);
      } catch (parseError) {
        // Nếu Gemini không trả về JSON hợp lệ, fallback về rule-based
        console.warn('Gemini response không phải JSON hợp lệ, sử dụng rule-based');
        return this.analyzeSubmission(options);
      }
    } catch (error: any) {
      console.error('Gemini API error:', error);
      // Fallback về rule-based nếu Gemini fail
      return this.analyzeSubmission(options);
    }
  }

  /**
   * Build prompt cho Gemini Pro
   */
  private buildGeminiPrompt(options: AnalysisOptions): string {
    const { userCode, correctCode, buggyCode, language, problemStatement, executionResults, errorMessage, status } = options;

    let prompt = `Bạn là một AI tutor chuyên phân tích code lập trình. Hãy phân tích submission sau đây và cung cấp feedback chi tiết.\n\n`;
    
    prompt += `## Đề bài:\n${problemStatement}\n\n`;
    prompt += `## Ngôn ngữ: ${language}\n\n`;
    prompt += `## Code của học sinh:\n\`\`\`${language}\n${userCode}\n\`\`\`\n\n`;

    if (correctCode) {
      prompt += `## Code đúng (chỉ để tham khảo, không tiết lộ cho học sinh):\n\`\`\`${language}\n${correctCode}\n\`\`\`\n\n`;
    }

    prompt += `## Kết quả chạy test cases:\n`;
    executionResults.forEach((result, idx) => {
      prompt += `\nTest Case ${idx + 1}:\n`;
      prompt += `- Input: ${result.input}\n`;
      prompt += `- Expected Output: ${result.expectedOutput}\n`;
      prompt += `- Actual Output: ${result.actualOutput}\n`;
      prompt += `- Passed: ${result.passed ? 'Yes' : 'No'}\n`;
      if (result.errorMessage) {
        prompt += `- Error: ${result.errorMessage}\n`;
      }
    });

    if (errorMessage) {
      prompt += `\n## Lỗi tổng thể:\n${errorMessage}\n\n`;
    }

    prompt += `## Status: ${status}\n\n`;

    prompt += `Hãy phân tích và trả về JSON với format sau:\n`;
    prompt += `{\n`;
    prompt += `  "overallStatus": "correct" | "partial" | "incorrect",\n`;
    prompt += `  "summary": "Tóm tắt ngắn gọn về kết quả",\n`;
    prompt += `  "errorAnalyses": [\n`;
    prompt += `    {\n`;
    prompt += `      "errorType": "syntax" | "logic" | "runtime" | "performance" | "timeout" | "memory" | "other",\n`;
    prompt += `      "errorMessage": "Mô tả lỗi",\n`;
    prompt += `      "severity": "low" | "medium" | "high" | "critical",\n`;
    prompt += `      "description": "Giải thích chi tiết về lỗi"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "codeSuggestions": [\n`;
    prompt += `    {\n`;
    prompt += `      "line": 1,\n`;
    prompt += `      "currentCode": "Code hiện tại",\n`;
    prompt += `      "suggestedCode": "Code gợi ý",\n`;
    prompt += `      "explanation": "Giải thích tại sao cần sửa",\n`;
    prompt += `      "confidence": 0.8\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"],\n`;
    prompt += `  "learningPoints": ["Điểm học tập 1", "Điểm học tập 2"]\n`;
    prompt += `}\n\n`;
    prompt += `Lưu ý: Trả về CHỈ JSON, không có text thêm. Tiếng Việt.`;

    return prompt;
  }

  /**
   * Validate và merge AI analysis với rule-based analysis
   */
  private async validateAndMergeAnalysis(
    aiAnalysis: any,
    options: AnalysisOptions
  ): Promise<SubmissionAnalysis> {
    // Validate và merge với rule-based analysis
    const ruleBased = await this.analyzeSubmission(options);

    return {
      overallStatus: aiAnalysis.overallStatus || ruleBased.overallStatus,
      score: ruleBased.score, // Luôn dùng score từ execution results
      totalPoints: ruleBased.totalPoints,
      summary: aiAnalysis.summary || ruleBased.summary,
      recommendations: aiAnalysis.recommendations || ruleBased.recommendations,
      learningPoints: aiAnalysis.learningPoints || ruleBased.learningPoints,
      errorAnalyses: aiAnalysis.errorAnalyses || ruleBased.errorAnalyses,
      codeSuggestions: aiAnalysis.codeSuggestions || ruleBased.codeSuggestions,
      testCaseAnalyses: ruleBased.testCaseAnalyses, // Luôn dùng từ rule-based
    };
  }

  /**
   * Analyze với AI (tự động chọn Gemini nếu có, fallback về rule-based)
   */
  async analyzeWithAI(options: AnalysisOptions): Promise<SubmissionAnalysis> {
    if (ENV.GEMINI_API_KEY) {
      return this.analyzeWithGemini(options);
    }
    return this.analyzeSubmission(options);
  }
}

export default new AIAnalysisService();

