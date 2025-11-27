/**
 * Judge0 Service
 * Tích hợp Judge0 API để chạy code trong sandbox an toàn
 */

import { config } from 'dotenv';

// Load environment variables
config();

const ENV = {
  JUDGE0_API_URL: process.env.JUDGE0_API_URL,
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY
};
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
  time: string | null;
  memory: number | null;
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
    this.apiUrl = ENV.JUDGE0_API_URL || 'http://localhost:2358';
    this.apiKey = ENV.JUDGE0_API_KEY || null;
    
    console.log(`🔧 Judge0 Service initialized:`);
    console.log(`   API URL: ${this.apiUrl}`);
    console.log(`   API Key: ${this.apiKey ? 'Set' : 'Not set (self-hosted)'}`);
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

    // Xác định xem đang dùng self-hosted hay RapidAPI
    const isSelfHosted = this.apiUrl.includes('localhost') || this.apiUrl.includes('127.0.0.1');
    
    // Trên Windows/self-hosted, không gửi memory_limit để Judge0 không dùng cgroup
    // Chỉ set memory_limit khi dùng RapidAPI (cloud)
    const submission: Judge0Submission = {
      source_code: code,
      language_id: languageId,
      stdin: input,
      cpu_time_limit: timeLimit || 2, // Default 2 seconds
      ...(isSelfHosted ? {} : { memory_limit: memoryLimit ? memoryLimit * 1024 : 128000 })
    };

    if (expectedOutput) {
      submission.expected_output = expectedOutput;
    }

    try {
      // Headers khác nhau cho self-hosted vs RapidAPI
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Chỉ thêm RapidAPI headers nếu dùng RapidAPI (có API key và URL là RapidAPI)
      if (!isSelfHosted && this.apiKey) {
        headers['X-RapidAPI-Key'] = this.apiKey;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      }
      
      console.log(`🔍 Submitting to Judge0: ${this.apiUrl} (${isSelfHosted ? 'Self-hosted' : 'RapidAPI'})`);
      
      const response = await fetch(`${this.apiUrl}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 API error: ${response.status} - ${errorText}`);
      }

      const result: Judge0Response = await response.json();
      
      // Log toàn bộ response để debug
      console.log('📊 Judge0 full response:', JSON.stringify(result, null, 2));
      console.log('📊 Judge0 response metrics:', {
        time: result.time,
        memory: result.memory,
        timeType: typeof result.time,
        memoryType: typeof result.memory,
        status: result.status.id,
        statusDescription: result.status.description
      });
      
      // Log chi tiết để debug - nhưng không log lỗi hệ thống Judge0 như error
      if (result.status.id !== 3) { // Không phải Accepted
        // Kiểm tra xem có phải lỗi hệ thống Judge0 không (status id 13)
        const isSystemError = result.status.id === 13;
        
        if (isSystemError) {
          // Lỗi hệ thống Judge0 - chỉ log warning, không log như error
          console.warn('⚠️ Judge0 system error (sẽ fallback):', {
            status: result.status,
            message: result.message
          });
        } else {
          // Lỗi thực sự từ code (compile error, runtime error, etc.)
          console.log('Judge0 response:', {
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            compile_output: result.compile_output,
            message: result.message
          });
        }
      }
      
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
        let result = await this.submitCode(
          code,
          language,
          testCase.input,
          testCase.expectedOutput,
          timeLimit,
          memoryLimit
        );

        let status = this.mapStatus(result.status.id);
        
        // Kiểm tra lỗi hệ thống Judge0 (status id 13 - Internal Error)
        let isSystemError = result.status.id === 13;
        
        // Nếu Judge0 fail với system error và không có stdout, thử fallback
        if (isSystemError && !result.stdout && (language === 'Python' || language === 'JavaScript')) {
          console.log(`⚠️ Judge0 system error, thử fallback execution cho test case ${i + 1}`);
          try {
            const fallbackResult = await this.runCodeFallback(code, language, testCase.input, timeLimit || 2);
            console.log(`📊 Fallback result cho test case ${i + 1}:`, {
              stdout: fallbackResult.stdout,
              stderr: fallbackResult.stderr,
              executionTime: fallbackResult.executionTime
            });
            
            if (fallbackResult.stdout && !fallbackResult.stderr.includes('was not found')) {
              // Có output từ fallback và không phải lỗi "not found", dùng nó
              // Normalize output (loại bỏ \r\n)
              const normalizedOutput = fallbackResult.stdout.replace(/\r\n/g, '\n').trim();
              result = {
                ...result,
                stdout: normalizedOutput,
                stderr: fallbackResult.stderr ? fallbackResult.stderr.trim() : null,
                status: { id: 3, description: 'Accepted' }, // Accepted
                time: String(fallbackResult.executionTime / 1000),
                memory: 0
              };
              // Update status và isSystemError sau khi fallback thành công
              status = 'Accepted';
              isSystemError = false;
              console.log(`✅ Fallback execution thành công cho test case ${i + 1}, output: "${normalizedOutput}"`);
            } else if (fallbackResult.stderr.includes('was not found')) {
              // Thử với python3 hoặc python
              console.log(`⚠️ Thử lại với python3...`);
              try {
                const fallbackResult2 = await this.runCodeFallback(code, language, testCase.input, timeLimit || 2, 'python3');
                if (fallbackResult2.stdout && !fallbackResult2.stderr.includes('was not found')) {
                  const normalizedOutput2 = fallbackResult2.stdout.replace(/\r\n/g, '\n').trim();
                  result = {
                    ...result,
                    stdout: normalizedOutput2,
                    stderr: fallbackResult2.stderr ? fallbackResult2.stderr.trim() : null,
                    status: { id: 3, description: 'Accepted' },
                    time: String(fallbackResult2.executionTime / 1000),
                    memory: 0
                  };
                  status = 'Accepted';
                  isSystemError = false;
                  console.log(`✅ Fallback execution thành công với python3 cho test case ${i + 1}, output: "${normalizedOutput2}"`);
                } else {
                  // Thử với python
                  console.log(`⚠️ Thử lại với python...`);
                  const fallbackResult3 = await this.runCodeFallback(code, language, testCase.input, timeLimit || 2, 'python');
                  if (fallbackResult3.stdout && !fallbackResult3.stderr.includes('was not found')) {
                    const normalizedOutput3 = fallbackResult3.stdout.replace(/\r\n/g, '\n').trim();
                    result = {
                      ...result,
                      stdout: normalizedOutput3,
                      stderr: fallbackResult3.stderr ? fallbackResult3.stderr.trim() : null,
                      status: { id: 3, description: 'Accepted' },
                      time: String(fallbackResult3.executionTime / 1000),
                      memory: 0
                    };
                    status = 'Accepted';
                    isSystemError = false;
                    console.log(`✅ Fallback execution thành công với python cho test case ${i + 1}, output: "${normalizedOutput3}"`);
                  }
                }
              } catch (e: any) {
                console.log(`⚠️ Fallback với python3/python cũng fail: ${e.message}`);
              }
            }
          } catch (fallbackError: any) {
            console.log(`⚠️ Fallback execution cũng fail: ${fallbackError.message}`);
            if (fallbackError.stack) {
              console.log(`   Stack: ${fallbackError.stack}`);
            }
          }
        }
        
        // Xử lý error message trước để có thể dùng cho actualOutput nếu cần
        let errorMessage: string | undefined = undefined;
        if (status !== 'Accepted' || isSystemError) {
          if (isSystemError && result.message) {
            // Lỗi hệ thống Judge0 - không log chi tiết vì đã có fallback
            // Chỉ set error message nếu cần thiết cho UI
            if (result.message.includes('No such file or directory')) {
              errorMessage = 'Lỗi hệ thống: Judge0 không thể tạo file script. Hệ thống sẽ sử dụng phương pháp dự phòng để đánh giá.';
            } else {
              errorMessage = `Lỗi hệ thống Judge0. Hệ thống sẽ sử dụng phương pháp dự phòng để đánh giá.`;
            }
          } else if (result.stderr) {
            errorMessage = String(result.stderr).trim();
          } else if (result.compile_output) {
            errorMessage = String(result.compile_output).trim();
          } else if (result.message) {
            errorMessage = String(result.message).trim();
          }
        }
        
        // Xử lý output - ưu tiên stdout, nếu không có thì lấy stderr hoặc compile_output
        // QUAN TRỌNG: actualOutput phải luôn có giá trị (không được empty string) để pass MongoDB validation
        let actualOutput = '';
        
        // Kiểm tra xem stderr có phải là output của code hay là lỗi hệ thống
        const stderrIsSystemError = result.stderr && (
          result.stderr.includes('No such file or directory') ||
          result.stderr.includes('cgroup') ||
          result.stderr.includes('box-')
        );
        
        if (result.stdout) {
          // Ưu tiên stdout
          actualOutput = String(result.stdout).trim();
        } else if (result.stderr && !stderrIsSystemError) {
          // Nếu stderr không phải lỗi hệ thống, có thể là output của code
          actualOutput = String(result.stderr).trim();
        } else if (result.compile_output) {
          // Compile output có thể chứa thông tin hữu ích
          actualOutput = String(result.compile_output).trim();
        } else if (result.message && !isSystemError) {
          actualOutput = String(result.message).trim();
        }
        
        // Nếu vẫn không có output (đặc biệt là lỗi hệ thống), dùng errorMessage hoặc message mặc định
        if (!actualOutput || actualOutput.trim() === '') {
          actualOutput = errorMessage || 'Không có output từ Judge0';
        }
        
        // So sánh actualOutput với expectedOutput để xác định passed
        // QUAN TRỌNG: Nếu có stdout (code đã chạy được), vẫn so sánh output dù có lỗi hệ thống
        let passed = false;
        
        // Nếu có stdout và expectedOutput, so sánh output (kể cả khi có lỗi hệ thống)
        if (result.stdout && testCase.expectedOutput) {
          const normalizedActual = String(result.stdout).trim();
          const normalizedExpected = testCase.expectedOutput.trim();
          passed = normalizedActual === normalizedExpected;
          console.log(`🔍 Test case ${i + 1} - So sánh output:`, {
            actual: normalizedActual,
            expected: normalizedExpected,
            passed: passed,
            hasSystemError: isSystemError
          });
        } 
        // Nếu có actualOutput từ các nguồn khác (stderr, compile_output) và có expectedOutput, vẫn so sánh
        else if (actualOutput && actualOutput !== errorMessage && testCase.expectedOutput) {
          const normalizedActual = actualOutput.trim();
          const normalizedExpected = testCase.expectedOutput.trim();
          passed = normalizedActual === normalizedExpected;
          console.log(`🔍 Test case ${i + 1} - So sánh output (từ stderr/compile):`, {
            actual: normalizedActual,
            expected: normalizedExpected,
            passed: passed
          });
        }
        // Nếu status là Accepted và không phải lỗi hệ thống thì pass
        else if (status === 'Accepted' && !isSystemError) {
          passed = true;
        }
        // Nếu là lỗi hệ thống nhưng không có output để so sánh, fail
        else {
          passed = false;
        }

        // Parse execution time - CHỈ parse khi Judge0 chạy thành công (không phải lỗi hệ thống)
        // Khi Judge0 lỗi hệ thống (status 13), time và memory = 0 không phải giá trị thực
        let executionTimeMs = 0;
        
        // Chỉ parse time nếu Judge0 chạy thành công (status 3 = Accepted hoặc các status khác nhưng không phải Internal Error)
        if (!isSystemError && result.time !== null && result.time !== undefined && result.time !== '') {
          const timeValue = parseFloat(String(result.time));
          if (!isNaN(timeValue) && timeValue > 0) { // Chỉ lấy giá trị > 0
            executionTimeMs = timeValue * 1000; // Convert seconds to milliseconds
          }
        }
        
        // Parse memory - CHỈ parse khi Judge0 chạy thành công
        let memoryUsedKB = 0;
        if (!isSystemError && result.memory !== null && result.memory !== undefined) {
          const memoryValue = parseFloat(String(result.memory));
          if (!isNaN(memoryValue) && memoryValue > 0) { // Chỉ lấy giá trị > 0
            memoryUsedKB = memoryValue; // Already in KB
          }
        }
        
        // Log kết quả cuối cùng
        if (isSystemError) {
          console.log(`⚠️ Test case ${i + 1} - Judge0 system error, không có metrics thực tế`);
        } else {
          console.log(`📊 Test case ${i + 1} final metrics:`, {
            executionTimeMs,
            memoryUsedKB,
            status: status
          });
        }

        results.push({
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput.trim(),
          passed,
          executionTime: executionTimeMs,
          memoryUsed: memoryUsedKB,
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
          actualOutput: error.message || '', // Đảm bảo luôn là string
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
   * Fallback: Chạy code trực tiếp khi Judge0 fail với system error
   * CHỈ DÙNG CHO DEVELOPMENT - KHÔNG AN TOÀN CHO PRODUCTION
   */
  private async runCodeFallback(
    code: string,
    language: string,
    input: string,
    timeLimit: number,
    customExecutable?: string
  ): Promise<{ stdout: string; stderr: string; executionTime: number }> {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `judge0-fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    let fileExtension = '';
    
    try {
      let executable = '';
      let args: string[] = [];
      
      if (language === 'Python') {
        fileExtension = '.py';
        // Tạo file Python
        await fs.promises.writeFile(tempFile + fileExtension, code, 'utf8');
        // Chạy Python - dùng customExecutable nếu có, nếu không thì thử py (Windows) hoặc python3 (Linux/Mac)
        if (customExecutable) {
          executable = customExecutable;
        } else if (process.platform === 'win32') {
          executable = 'py';
        } else {
          executable = 'python3';
        }
        args = [tempFile + fileExtension];
      } else if (language === 'JavaScript') {
        fileExtension = '.js';
        // Tạo file JavaScript
        await fs.promises.writeFile(tempFile + fileExtension, code, 'utf8');
        // Chạy Node.js
        executable = 'node';
        args = [tempFile + fileExtension];
      } else {
        throw new Error(`Fallback không hỗ trợ ngôn ngữ: ${language}`);
      }
      
      const startTime = Date.now();
      
      // Chạy code với spawn và pipe stdin
      const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(executable, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        
        let stdout = '';
        let stderr = '';
        let isResolved = false;
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('error', (error) => {
          if (!isResolved) {
            isResolved = true;
            reject(error);
          }
        });
        
        // Timeout
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            child.kill();
            reject(new Error('Timeout'));
          }
        }, timeLimit * 1000 + 1000);
        
        child.on('close', (code) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            resolve({ stdout, stderr });
          }
        });
        
        // Gửi input vào stdin
        if (input) {
          child.stdin.write(input);
          child.stdin.end();
        } else {
          child.stdin.end();
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        executionTime
      };
    } catch (error: any) {
      // Nếu timeout hoặc lỗi khác, trả về error message
      return {
        stdout: '',
        stderr: error.message || 'Lỗi khi chạy code',
        executionTime: 0
      };
    } finally {
      // Xóa file tạm
      try {
        if (fileExtension) {
          await fs.promises.unlink(tempFile + fileExtension).catch(() => {});
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
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
      13: 'Runtime Error', // Internal Error - thường là lỗi hệ thống Judge0
      14: 'Runtime Error',
    };

    return statusMap[statusId] || 'Runtime Error';
  }

  /**
   * Kiểm tra xem Judge0 API có available không
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Xác định xem đang dùng self-hosted hay RapidAPI
      const isSelfHosted = this.apiUrl.includes('localhost') || this.apiUrl.includes('127.0.0.1');
      
      // Headers khác nhau cho self-hosted vs RapidAPI
      const headers: Record<string, string> = {};
      
      // Chỉ thêm RapidAPI headers nếu dùng RapidAPI
      if (!isSelfHosted && this.apiKey) {
        headers['X-RapidAPI-Key'] = this.apiKey;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      }
      
      const response = await fetch(`${this.apiUrl}/languages`, {
        headers,
      });
      
      const isHealthy = response.ok;
      console.log(`🔍 Judge0 health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'} (${this.apiUrl})`);
      
      return isHealthy;
    } catch (error: any) {
      console.error('❌ Judge0 health check failed:', error.message);
      return false;
    }
  }
}

export default new Judge0Service();

