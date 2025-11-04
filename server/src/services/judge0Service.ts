/**
 * Judge0 Service
 * Tích hợp Judge0 API để chạy code trong sandbox an toàn
 */

import { ENV } from '../../config/environment';

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

// Language ID mapping cho Judge0
const LANGUAGE_IDS: Record<string, number> = {
  'Python': 71,      // Python 3.8.1
  'JavaScript': 63,  // Node.js 12.14.0
  'Java': 62,        // OpenJDK 13.0.1
  'C++': 54,         // GCC 9.2.0
  'C#': 51,          // Mono 6.6.0
  'C': 50,           // GCC 9.2.0
};

class Judge0Service {
  private apiUrl: string;
  private apiKey: string | null;

  constructor() {
    this.apiUrl = ENV.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = ENV.JUDGE0_API_KEY || null;
  }

  /**
   * Submit code để chạy
   */
  async submitCode(
    code: string,
    language: string,
    input: string = '',
    expectedOutput?: string,
    timeLimit?: number,
    memoryLimit?: number
  ): Promise<Judge0Response> {
    const languageId = LANGUAGE_IDS[language];
    
    if (!languageId) {
      throw new Error(`Ngôn ngữ ${language} không được hỗ trợ`);
    }

    const submission: Judge0Submission = {
      source_code: code,
      language_id: languageId,
      stdin: input,
      cpu_time_limit: timeLimit || 2, // Default 2 seconds
      memory_limit: memoryLimit ? memoryLimit * 1024 : 128000, // Convert MB to KB
    };

    if (expectedOutput) {
      submission.expected_output = expectedOutput;
    }

    try {
      const response = await fetch(`${this.apiUrl}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-RapidAPI-Key': this.apiKey }),
          ...(this.apiKey && { 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' }),
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 API error: ${response.status} - ${errorText}`);
      }

      const result: Judge0Response = await response.json();
      return result;
    } catch (error: any) {
      console.error('Judge0 API error:', error);
      throw new Error(`Không thể chạy code: ${error.message}`);
    }
  }

  /**
   * Chạy code với nhiều test cases
   */
  async runTestCases(
    code: string,
    language: string,
    testCases: Array<{ input: string; expectedOutput: string }>,
    timeLimit?: number,
    memoryLimit?: number
  ): Promise<Array<{
    testCaseIndex: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime: number;
    memoryUsed: number;
    errorMessage?: string;
    status: string;
  }>> {
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const result = await this.submitCode(
          code,
          language,
          testCase.input,
          testCase.expectedOutput,
          timeLimit,
          memoryLimit
        );

        const status = this.mapStatus(result.status.id);
        const passed = status === 'Accepted';
        const actualOutput = result.stdout || result.stderr || '';
        const errorMessage = result.stderr || result.compile_output || result.message || undefined;

        results.push({
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput.trim(),
          passed,
          executionTime: parseFloat(result.time || '0') * 1000, // Convert to milliseconds
          memoryUsed: result.memory || 0, // Already in KB
          errorMessage,
          status,
        });

        // Rate limiting: Delay giữa các requests
        if (i < testCases.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      } catch (error: any) {
        // Nếu một test case fail, vẫn tiếp tục với các test case khác
        results.push({
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsed: 0,
          errorMessage: error.message,
          status: 'Runtime Error',
        });
      }
    }

    return results;
  }

  /**
   * Map Judge0 status ID sang status của hệ thống
   */
  private mapStatus(statusId: number): string {
    // Judge0 status codes
    const statusMap: Record<number, string> = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error',
      8: 'Runtime Error',
      9: 'Runtime Error',
      10: 'Runtime Error',
      11: 'Runtime Error',
      12: 'Runtime Error',
      13: 'Memory Limit Exceeded',
      14: 'Runtime Error',
    };

    return statusMap[statusId] || 'Runtime Error';
  }

  /**
   * Kiểm tra xem Judge0 API có available không
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/languages`, {
        headers: {
          ...(this.apiKey && { 'X-RapidAPI-Key': this.apiKey }),
          ...(this.apiKey && { 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' }),
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new Judge0Service();

