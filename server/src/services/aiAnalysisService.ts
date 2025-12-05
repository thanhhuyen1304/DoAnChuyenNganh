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

    // Chỉ phân tích lỗi nếu thực sự có lỗi (không phải Accepted)
    // Và chỉ phân tích khi có test case fail hoặc status là lỗi
    const passedCount = executionResults.filter(r => r.passed).length;
    const hasErrors = status !== 'Accepted' || passedCount < executionResults.length;
    
    // Kiểm tra lỗi hệ thống TRƯỚC KHI phân tích errors
    const isSystemError = !!(errorMessage && (
      errorMessage.includes('Judge0 không thể') ||
      errorMessage.includes('No such file or directory') ||
      errorMessage.includes('Lỗi hệ thống')
    ));
    
    const errorAnalyses = hasErrors 
      ? this.analyzeErrors(status, errorMessage, userCode, language, executionResults, isSystemError)
      : [];

    // Không so sánh với correctCode nữa - chỉ phân tích code user submit
    // AI sẽ phân tích code dựa trên execution results và error messages
    const codeSuggestions: CodeSuggestion[] = [];
    
    // Nếu có lỗi và không phải lỗi hệ thống, tạo code suggestions
    if (!isSystemError && status !== 'Accepted' && executionResults.some(r => !r.passed)) {
      // Phân tích code dựa trên test cases fail
      const failedTests = executionResults.filter(r => !r.passed);
      
      // Phân tích lỗi logic từ test cases
      for (const failedTest of failedTests) {
        if (failedTest.errorMessage) {
          // Có error message - phân tích lỗi runtime/syntax
          const errorLocation = this.findErrorLocation(userCode, failedTest.errorMessage);
          const line = errorLocation?.line || 1;
          const codeSnippet = errorLocation?.codeSnippet || userCode.split('\n')[0];
          
          // Tạo gợi ý dựa trên loại lỗi
          let suggestedFix = '';
          if (failedTest.errorMessage.includes('NameError')) {
            suggestedFix = 'Kiểm tra tên biến/hàm có đúng không';
          } else if (failedTest.errorMessage.includes('SyntaxError')) {
            suggestedFix = 'Kiểm tra cú pháp: dấu ngoặc, dấu hai chấm, indentation';
          } else if (failedTest.errorMessage.includes('TypeError')) {
            suggestedFix = 'Kiểm tra kiểu dữ liệu của tham số';
          } else if (failedTest.errorMessage.includes('IndexError')) {
            suggestedFix = 'Kiểm tra chỉ số mảng có hợp lệ không';
          }
          
          codeSuggestions.push({
            line: line,
            currentCode: codeSnippet,
            suggestedCode: suggestedFix,
            explanation: `Lỗi ở test case ${failedTest.testCaseIndex + 1}: ${failedTest.errorMessage}`,
            confidence: errorLocation ? 0.8 : 0.5
          });
        } else {
          // Không có error message - phân tích lỗi logic từ output với AI
          // So sánh expected vs actual để tìm pattern
          const suggestion = await this.analyzeLogicError(
            userCode,
            failedTest.input,
            failedTest.expectedOutput,
            failedTest.actualOutput,
            language,
            problemStatement
          );
          
          if (suggestion) {
            codeSuggestions.push({
              line: suggestion.line,
              currentCode: suggestion.currentCode,
              suggestedCode: suggestion.suggestedCode,
              explanation: `Test case ${failedTest.testCaseIndex + 1} không pass. Expected: "${failedTest.expectedOutput}", Got: "${failedTest.actualOutput}". ${suggestion.explanation}`,
              confidence: suggestion.confidence
            });
          }
        }
      }
      
      // Nếu không có suggestions cụ thể, tạo suggestion chung
      if (codeSuggestions.length === 0 && failedTests.length > 0) {
        const firstFailed = failedTests[0];
        
        // Phân tích pattern từ test case đầu tiên
        const inputs = firstFailed.input.split('\n').map(s => s.trim()).filter(s => s && s !== 'None');
        const expected = firstFailed.expectedOutput.trim();
        const actual = firstFailed.actualOutput.trim();
        
        let hint = '';
        if (actual === 'None') {
          hint = 'Hàm đang return None. Bạn có thể đã quên return giá trị hoặc dùng pass.';
        } else if (inputs.length === 2 && /^\d+$/.test(inputs[0]) && /^\d+$/.test(inputs[1])) {
          // 2 số input
          const a = parseInt(inputs[0]);
          const b = parseInt(inputs[1]);
          const exp = parseInt(expected);
          const act = parseInt(actual);
          
          if (act === a) {
            hint = `Output bằng input đầu tiên (${a}). Có thể bạn chỉ return tham số đầu tiên?`;
          } else if (act === b) {
            hint = `Output bằng input thứ hai (${b}). Có thể bạn chỉ return tham số thứ hai?`;
          } else if (act === a - b && exp === a + b) {
            hint = `Output là ${a} - ${b} = ${act}, nhưng mong đợi ${a} + ${b} = ${exp}. Kiểm tra phép toán.`;
          } else if (act === a * b && exp === a + b) {
            hint = `Output là ${a} * ${b} = ${act}, nhưng mong đợi ${a} + ${b} = ${exp}. Kiểm tra phép toán.`;
          } else {
            hint = `Output không khớp. Kiểm tra logic tính toán.`;
          }
        } else {
          hint = 'Kiểm tra logic của thuật toán.';
        }
        
        codeSuggestions.push({
          line: 1,
          currentCode: userCode.split('\n').find(line => line.includes('return')) || userCode.split('\n')[0],
          suggestedCode: hint,
          explanation: `Test case ${firstFailed.testCaseIndex + 1} không pass. ${hint}`,
          confidence: 0.6
        });
      }
    }

    // Tính điểm tổng (sử dụng passedCount đã tính ở trên)
    const totalCount = executionResults.length;
    const score = executionResults.reduce((sum, r) => sum + (r.passed ? 1 : 0), 0);
    
    // Xác định overall status
    // Nếu là lỗi hệ thống, không đánh giá code là incorrect
    let overallStatus: 'correct' | 'partial' | 'incorrect';
    if (isSystemError) {
      // Lỗi hệ thống - không đánh giá code
      overallStatus = 'incorrect'; // Vẫn set incorrect để hiển thị, nhưng summary sẽ giải thích rõ
    } else if (passedCount === totalCount) {
      overallStatus = 'correct';
    } else if (passedCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'incorrect';
    }

    // Tạo summary - truyền thêm thông tin về lỗi hệ thống
    const summary = this.generateSummary(overallStatus, passedCount, totalCount, errorAnalyses, isSystemError);

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
    language: string,
    executionResults?: Array<{ passed: boolean; errorMessage?: string; status?: string }>,
    isSystemError?: boolean
  ): ErrorAnalysis[] {
    const errors: ErrorAnalysis[] = [];

    // Nếu là lỗi hệ thống (đã được xác định từ bên ngoài), chỉ báo lỗi hệ thống
    if (isSystemError) {
      errors.push({
        errorType: 'other',
        errorMessage: errorMessage || 'Lỗi hệ thống',
        severity: 'high',
        description: 'Có lỗi xảy ra với hệ thống chấm bài. Vui lòng thử lại sau hoặc liên hệ admin.'
      });
      return errors;
    }

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
        // Kiểm tra xem có phải lỗi memory thực sự không
        const hasMemoryError = errorMessage && (
          errorMessage.toLowerCase().includes('memory') ||
          errorMessage.toLowerCase().includes('out of memory')
        );
        
        if (hasMemoryError) {
          errors.push({
            errorType: 'memory',
            errorMessage: 'Vượt quá bộ nhớ cho phép',
            severity: 'high',
            description: 'Code sử dụng quá nhiều bộ nhớ. Kiểm tra việc tạo mảng lớn hoặc đệ quy sâu.',
          });
        } else {
          errors.push({
            errorType: 'runtime',
            errorMessage: errorMessage || 'Lỗi runtime',
            severity: 'high',
            description: 'Lỗi xảy ra khi chạy code. Kiểm tra null pointer, array index out of bounds, hoặc division by zero.',
            errorLocation: this.findErrorLocation(userCode, errorMessage)
          });
        }
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
        // Chỉ thêm lỗi nếu thực sự có error message và không phải Accepted
        if (status !== 'Accepted' && errorMessage) {
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
   * Phân tích lỗi logic từ output với AI
   */
  private async analyzeLogicError(
    userCode: string,
    input: string,
    expectedOutput: string,
    actualOutput: string,
    language: string,
    problemStatement: string
  ): Promise<{ line: number; currentCode: string; suggestedCode: string; explanation: string; confidence: number } | null> {
    // Nếu không có Gemini API key, dùng rule-based analysis
    if (!ENV.GEMINI_API_KEY) {
      return null;
    }

    try {
      // Import Google Generative AI
      let GoogleGenerativeAI: any;
      try {
        const module = await import('@google/generative-ai');
        GoogleGenerativeAI = module.GoogleGenerativeAI;
      } catch (importError) {
        console.warn('@google/generative-ai package chưa được cài đặt');
        return null;
      }
      
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      
      // Thử các models
      const modelNames = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          
          // Tạo prompt yêu cầu AI phân tích code sai
          const prompt = `Bạn là một AI tutor chuyên phân tích code lập trình.

Đề bài: ${problemStatement}

Code của học sinh (${language}):
\`\`\`${language}
${userCode}
\`\`\`

Test case:
- Input: ${input}
- Expected Output: ${expectedOutput}
- Actual Output: ${actualOutput}

Hãy phân tích lỗi trong code và đưa ra gợi ý sửa cụ thể. Trả về JSON với format:
{
  "line": <số dòng có lỗi, bắt đầu từ 1>,
  "currentCode": "<dòng code hiện tại có lỗi>",
  "suggestedCode": "<code sửa gợi ý>",
  "explanation": "<giải thích ngắn gọn lỗi và cách sửa>",
  "confidence": <độ tin cậy 0-1>
}

Lưu ý:
- Chỉ trả về JSON, không có text thêm
- explanation phải ngắn gọn (1-2 câu)
- suggestedCode phải là code cụ thể, không phải gợi ý chung chung
- Nếu không tìm được lỗi cụ thể, trả về null

Ví dụ:
Nếu code là:
\`\`\`python
def sum(a, b):
    return a
\`\`\`
Input: 5, 3
Expected: 8
Actual: 5

Trả về:
{
  "line": 2,
  "currentCode": "return a",
  "suggestedCode": "return a + b",
  "explanation": "Bạn chỉ return tham số a, nhưng cần return tổng a + b",
  "confidence": 0.9
}`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          // Parse JSON response
          try {
            // Remove markdown code blocks nếu có
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const suggestion = JSON.parse(jsonText);
            
            // Validate response
            if (suggestion && suggestion.line && suggestion.explanation) {
              console.log(`✅ AI logic analysis successful with ${modelName}`);
              return {
                line: suggestion.line || 1,
                currentCode: suggestion.currentCode || '',
                suggestedCode: suggestion.suggestedCode || '',
                explanation: suggestion.explanation || '',
                confidence: suggestion.confidence || 0.7
              };
            } else {
              console.warn(`⚠️ AI response invalid format from ${modelName}`);
              return null;
            }
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse AI response from ${modelName}, trying next model...`);
            continue;
          }
        } catch (error: any) {
          console.warn(`⚠️ AI model ${modelName} failed: ${error.message}, trying next model...`);
          continue;
        }
      }
      
      // Tất cả models fail
      console.warn('⚠️ All AI models failed for logic error analysis');
      return null;
    } catch (error: any) {
      console.error('❌ AI logic analysis error:', error.message);
      return null;
    }
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
    errorAnalyses: ErrorAnalysis[],
    isSystemError?: boolean
  ): string {
    // Nếu là lỗi hệ thống, hiển thị thông báo rõ ràng
    if (isSystemError) {
      const systemError = errorAnalyses.find(e => 
        e.errorType === 'other' && 
        (e.errorMessage.includes('Judge0 không thể') || 
         e.errorMessage.includes('No such file or directory') ||
         e.errorMessage.includes('Lỗi hệ thống'))
      );
      if (systemError) {
        return systemError.description || 'Có lỗi xảy ra với hệ thống chấm bài. Vui lòng thử lại sau hoặc liên hệ admin.';
      }
      return 'Có lỗi xảy ra với hệ thống chấm bài. Vui lòng thử lại sau hoặc liên hệ admin.';
    }
    
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

    // Kiểm tra xem có phải lỗi hệ thống không
    const isSystemError = errorAnalyses.some(e => 
      e.errorType === 'other' && 
      (e.errorMessage.includes('Judge0 không thể') || 
       e.errorMessage.includes('No such file or directory') ||
       e.errorMessage.includes('Lỗi hệ thống'))
    );

    // Nếu là lỗi hệ thống, chỉ đưa ra recommendations về hệ thống
    if (isSystemError) {
      recommendations.push('Vui lòng thử lại sau vài phút');
      recommendations.push('Nếu lỗi vẫn tiếp tục, vui lòng liên hệ admin để được hỗ trợ');
      recommendations.push('Code của bạn có thể đúng, nhưng hệ thống chấm bài đang gặp sự cố');
      return recommendations;
    }

    // Từ error analyses (chỉ khi không phải lỗi hệ thống)
    errorAnalyses.forEach(error => {
      if (error.errorType === 'syntax') {
        recommendations.push('Kiểm tra cú pháp: dấu ngoặc, dấu chấm phẩy, và các từ khóa');
        recommendations.push('Đọc kỹ error message để xác định vị trí lỗi cú pháp');
      } else if (error.errorType === 'logic') {
        recommendations.push('Xem lại logic của thuật toán, đặc biệt là các điều kiện và vòng lặp');
        recommendations.push('Thử debug với các test case đơn giản để hiểu flow của code');
      } else if (error.errorType === 'runtime') {
        recommendations.push('Kiểm tra null pointer, array bounds, và division by zero');
        recommendations.push('Thêm error handling để xử lý các trường hợp đặc biệt');
      } else if (error.errorType === 'timeout') {
        recommendations.push('Tối ưu hóa thuật toán để giảm thời gian chạy');
        recommendations.push('Kiểm tra xem có vòng lặp vô hạn không');
      } else if (error.errorType === 'memory') {
        recommendations.push('Tối ưu hóa việc sử dụng bộ nhớ, tránh tạo mảng quá lớn');
        recommendations.push('Xem xét sử dụng cấu trúc dữ liệu hiệu quả hơn');
      }
    });

    // Từ code suggestions (chỉ khi không phải lỗi hệ thống)
    if (codeSuggestions.length > 0) {
      recommendations.push(`Có ${codeSuggestions.length} vị trí trong code cần được kiểm tra`);
      // Thêm explanation từ suggestion đầu tiên
      if (codeSuggestions[0].explanation) {
        recommendations.push(codeSuggestions[0].explanation);
      }
    }

    // Từ test case analyses (chỉ khi không phải lỗi hệ thống)
    const failedTests = testCaseAnalyses.filter(tc => !tc.passed);
    if (failedTests.length > 0) {
      recommendations.push(`Có ${failedTests.length} test case chưa pass`);
      
      const firstFailed = failedTests[0];
      if (firstFailed.hints && firstFailed.hints.length > 0) {
        recommendations.push(...firstFailed.hints);
      }
      
      // Thêm gợi ý về output mismatch
      if (!firstFailed.errorMessage && firstFailed.actualOutput !== firstFailed.expectedOutput) {
        recommendations.push('So sánh kỹ output thực tế với output mong đợi để tìm điểm khác biệt');
      }
    }
    
    // Nếu không có recommendations nào, thêm gợi ý chung
    if (recommendations.length === 0 && errorAnalyses.length > 0) {
      recommendations.push('Đọc kỹ đề bài và kiểm tra lại logic của code');
      recommendations.push('Thử chạy code với các test case mẫu để debug');
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
      
      // Thử các model names - nếu tất cả đều fail, sẽ fallback về rule-based
      // Model names có thể thay đổi theo API version
      // Thử các model theo thứ tự: gemini-pro (stable), gemini-1.5-flash, gemini-1.5-pro
      const modelNames = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let lastError: any = null;
      
      // Thử từng model cho đến khi tìm được model hoạt động
      for (const modelName of modelNames) {
        try {
          console.log(`🔍 Thử sử dụng Gemini model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });

          // Tạo prompt cho Gemini
          const prompt = this.buildGeminiPrompt(options);

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          // Parse JSON response từ Gemini
          try {
            const aiAnalysis = JSON.parse(text);
            console.log(`✅ Gemini model ${modelName} hoạt động thành công`);
            return await this.validateAndMergeAnalysis(aiAnalysis, options);
          } catch (parseError) {
            // Nếu Gemini không trả về JSON hợp lệ, thử model tiếp theo
            console.warn(`⚠️ Gemini model ${modelName} trả về response không phải JSON, thử model khác...`);
            lastError = parseError;
            continue;
          }
        } catch (error: any) {
          // Nếu model không tồn tại hoặc có lỗi, thử model tiếp theo
          lastError = error;
          // Chỉ log warning, không log error vì sẽ thử model khác
          if (error.status === 404) {
            console.warn(`⚠️ Gemini model ${modelName} không tìm thấy, thử model khác...`);
          } else {
            console.warn(`⚠️ Gemini model ${modelName} lỗi: ${error.message}, thử model khác...`);
          }
          continue;
        }
      }
      
      // Nếu tất cả models đều fail, fallback về rule-based
      console.warn('⚠️ Tất cả Gemini models đều không hoạt động, sử dụng rule-based analysis');
      if (lastError) {
        // Chỉ log error nếu tất cả models đều fail
        console.error('Gemini API error (tất cả models):', lastError.message || lastError);
      }
      return this.analyzeSubmission(options);
    } catch (error: any) {
      // Lỗi không liên quan đến model (ví dụ: import error, API key error)
      console.warn('⚠️ Gemini API không khả dụng, sử dụng rule-based analysis:', error.message || error);
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

    // Không cần correctCode nữa - AI sẽ phân tích dựa trên execution results

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

