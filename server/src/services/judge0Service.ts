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
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime: number;
    memoryUsed: number;
    errorMessage?: string;
    status: string;
  }>;
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
    params: {
      code: string;
      language: string;
      input?: string;
      expectedOutput?: string;
      timeLimit?: number;
      memoryLimit?: number;
      testCases?: Array<{ input: string; expectedOutput: string }>;
    }
  ): Promise<Judge0Response> {
    const { code, language, input = '', expectedOutput, timeLimit, memoryLimit, testCases } = params;
    
    // If testCases are provided, use runTestCases instead
    if (testCases && testCases.length > 0) {
      const testResults = await this.runTestCases(code, language, testCases, timeLimit, memoryLimit);
      // Return a mock Judge0Response with testCases
      return {
        stdout: null,
        stderr: null,
        compile_output: null,
        message: null,
        status: {
          id: 3, // Accepted
          description: 'Accepted'
        },
        time: null,
        memory: null,
        testCases: testResults
      };
    }
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
   * Wrap user code để có thể chạy với test cases
   * Tự động thêm code đọc input và gọi hàm
   */
  private wrapUserCode(code: string, language: string, testCase: { input: string; expectedOutput: string }): string {
    if (language === 'Python') {
      // Kiểm tra xem code có chứa if __name__ == "__main__" không
      if (code.includes('if __name__') || code.includes('input()') || code.includes('print(')) {
        // Code đã có logic đọc input/print, không cần wrap
        return code;
      }
      
      // Tìm tên hàm trong code (ví dụ: def sum_two_numbers(a, b):)
      const funcMatch = code.match(/def\s+(\w+)\s*\([^)]*\)/);
      if (funcMatch) {
        const funcName = funcMatch[0].match(/def\s+(\w+)/)?.[1] || '';
        const paramsMatch = funcMatch[0].match(/\(([^)]*)\)/);
        const params = paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()).filter(p => p) : [];
        const paramCount = params.length;
        
        // Parse input để xác định kiểu dữ liệu
        const inputs = testCase.input.split('\n').map(s => s.trim()).filter(s => s);
        
        // Tạo wrapper code
        let wrapper = code + '\n\n';
        wrapper += '# Auto-generated wrapper code\n';
        wrapper += 'if __name__ == "__main__":\n';
        
        // Sinh code đọc input dựa trên số lượng inputs và params
        if (inputs.length === 1 && paramCount === 1) {
          // Single input, single param
          const inputVal = inputs[0];
          
          // Detect type: số, string, hoặc array
          if (/^\d+$/.test(inputVal)) {
            // Integer
            wrapper += `    arg = int(input().strip())\n`;
          } else if (/^\[.*\]$/.test(inputVal)) {
            // Array/List
            wrapper += `    arg = eval(input().strip())\n`;
          } else {
            // String hoặc khác
            wrapper += `    arg = input().strip()\n`;
          }
          
          wrapper += `    result = ${funcName}(arg)\n`;
        } else if (inputs.length === paramCount && paramCount > 1 && paramCount <= 5) {
          // Multiple inputs matching param count
          for (let i = 0; i < paramCount; i++) {
            const inputVal = inputs[i] || '';
            const paramName = params[i] || `arg${i}`;
            
            if (/^-?\d+$/.test(inputVal)) {
              // Integer
              wrapper += `    ${paramName} = int(input().strip())\n`;
            } else if (/^-?\d+\.\d+$/.test(inputVal)) {
              // Float
              wrapper += `    ${paramName} = float(input().strip())\n`;
            } else if (/^\[.*\]$/.test(inputVal)) {
              // Array/List
              wrapper += `    ${paramName} = eval(input().strip())\n`;
            } else {
              // String
              wrapper += `    ${paramName} = input().strip()\n`;
            }
          }
          
          const argsStr = params.join(', ');
          wrapper += `    result = ${funcName}(${argsStr})\n`;
        } else if (inputs.length > paramCount) {
          // Có thể là array hoặc multiple test cases
          // Assume first input is array size, rest is array elements
          wrapper += `    n = int(input().strip())\n`;
          wrapper += `    args = []\n`;
          wrapper += `    for _ in range(n):\n`;
          wrapper += `        val = input().strip()\n`;
          wrapper += `        try:\n`;
          wrapper += `            args.append(int(val))\n`;
          wrapper += `        except:\n`;
          wrapper += `            args.append(val)\n`;
          
          if (paramCount === 1) {
            wrapper += `    result = ${funcName}(args)\n`;
          } else {
            wrapper += `    result = ${funcName}(*args)\n`;
          }
        } else {
          // Fallback: đọc tất cả inputs và parse
          wrapper += `    inputs_raw = []\n`;
          for (let i = 0; i < inputs.length; i++) {
            wrapper += `    inputs_raw.append(input().strip())\n`;
          }
          wrapper += `    args = []\n`;
          wrapper += `    for inp in inputs_raw:\n`;
          wrapper += `        try:\n`;
          wrapper += `            args.append(int(inp))\n`;
          wrapper += `        except:\n`;
          wrapper += `            try:\n`;
          wrapper += `                args.append(eval(inp))\n`;
          wrapper += `            except:\n`;
          wrapper += `                args.append(inp)\n`;
          wrapper += `    result = ${funcName}(*args)\n`;
        }
        
        // Format output
        wrapper += `    # Format output\n`;
        wrapper += `    if result is None:\n`;
        wrapper += `        print("None")\n`;
        wrapper += `    elif isinstance(result, list):\n`;
        wrapper += `        print(result)\n`;
        wrapper += `    elif isinstance(result, (int, float, str)):\n`;
        wrapper += `        print(result)\n`;
        wrapper += `    else:\n`;
        wrapper += `        print(str(result))\n`;
        
        return wrapper;
      }
    } else if (language === 'JavaScript') {
      // Kiểm tra xem code có chứa require('readline') hoặc console.log không
      if (code.includes('readline') || code.includes('console.log') || code.includes('process.stdin')) {
        // Code đã có logic đọc input/print, không cần wrap
        return code;
      }
      
      // Tìm tên hàm trong code
      const funcMatch = code.match(/function\s+(\w+)\s*\(|const\s+(\w+)\s*=|let\s+(\w+)\s*=/);
      if (funcMatch) {
        const funcName = funcMatch[1] || funcMatch[2] || funcMatch[3];
        
        // Parse input để tạo wrapper code
        const inputs = testCase.input.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        
        // Tạo wrapper code
        let wrapper = code + '\n\n';
        wrapper += '// Auto-generated wrapper code\n';
        wrapper += 'const readline = require("readline");\n';
        wrapper += 'const rl = readline.createInterface({ input: process.stdin });\n';
        wrapper += 'const lines = [];\n';
        wrapper += 'rl.on("line", (line) => { lines.push(line.trim()); });\n';
        wrapper += 'rl.on("close", () => {\n';
        wrapper += '  const args = lines.map(l => {\n';
        wrapper += '    try { return JSON.parse(l); } catch { return isNaN(l) ? l : Number(l); }\n';
        wrapper += '  });\n';
        
        if (inputs.length === 1) {
          wrapper += `  const result = ${funcName}(args[0]);\n`;
        } else {
          wrapper += `  const result = ${funcName}(...args);\n`;
        }
        
        wrapper += `  console.log(result);\n`;
        wrapper += '});\n';
        
        return wrapper;
      }
    }
    
    // Không tìm thấy hàm hoặc không hỗ trợ, trả về code gốc
    return code;
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
      
      // Wrap user code để có thể chạy với test cases
      const wrappedCode = this.wrapUserCode(code, language, testCase);
      
      console.log(`📝 Test case ${i + 1} - Wrapped code preview:`, {
        originalCodeLength: code.length,
        wrappedCodeLength: wrappedCode.length,
        isWrapped: wrappedCode !== code,
        testInput: testCase.input,
        testExpectedOutput: testCase.expectedOutput
      });
      console.log(`📄 Full wrapped code:\n${wrappedCode}\n`);
      console.log('='.repeat(80));
      
      try {
        let result = await this.submitCode({
          code: wrappedCode, // Sử dụng wrapped code
          language,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          timeLimit,
          memoryLimit
        });

        let status = this.mapStatus(result.status.id);
        
        // Kiểm tra lỗi hệ thống Judge0 (status id 13 - Internal Error)
        // BẮT BUỘC coi là system error nếu status.id = 13 (Judge0 không tạo được file)
        // Chỉ có khi chạy fallback mới biết được lỗi thật sự từ code hay từ hệ thống
        let isSystemError = result.status.id === 13;
        
        // Nếu Judge0 fail với system error, BẮT BUỘC phải chạy fallback
        if (isSystemError && (language === 'Python' || language === 'JavaScript')) {
          console.log(`⚠️ Judge0 system error (status.id = ${result.status.id}), BẮT BUỘC chạy fallback execution cho test case ${i + 1}`);
          console.log(`📝 Judge0 response trước fallback:`, {
            statusId: result.status.id,
            statusDescription: result.status.description,
            stdout: result.stdout,
            stderr: result.stderr,
            message: result.message
          });
          try {
            const fallbackResult = await this.runCodeFallback(wrappedCode, language, testCase.input, timeLimit || 2);
            console.log(`📊 Fallback result cho test case ${i + 1}:`, {
              stdout: fallbackResult.stdout,
              stderr: fallbackResult.stderr,
              executionTime: fallbackResult.executionTime,
              hasStdout: !!fallbackResult.stdout,
              hasStderr: !!fallbackResult.stderr
            });
            
            // Kiểm tra fallback có chạy được không
            if (fallbackResult.stdout) {
              // Có stdout - code chạy thành công
              const normalizedOutput = fallbackResult.stdout.replace(/\r\n/g, '\n').trim();
              result = {
                ...result,
                stdout: normalizedOutput,
                stderr: fallbackResult.stderr ? fallbackResult.stderr.trim() : null,
                status: { id: 3, description: 'Accepted' },
                time: String(fallbackResult.executionTime / 1000),
                memory: 0
              };
              status = 'Accepted';
              isSystemError = false;
              console.log(`✅ Fallback chạy thành công (có output) cho test case ${i + 1}`);
            } else if (fallbackResult.stderr && !fallbackResult.stderr.includes('was not found')) {
              // Có stderr - code có lỗi từ user
              result = {
                ...result,
                stdout: null,
                stderr: fallbackResult.stderr.trim(),
                compile_output: null,
                status: { id: 7, description: 'Runtime Error' },
                time: String(fallbackResult.executionTime / 1000),
                memory: 0
              };
              status = 'Runtime Error';
              isSystemError = false;
              console.log(`✅ Fallback chạy thành công (có lỗi runtime) cho test case ${i + 1}`);
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
            console.error(`❌ Fallback execution FAIL:`, {
              message: fallbackError.message,
              stack: fallbackError.stack
            });
            // Fallback fail, để nguyên isSystemError = true để hiển thị message lỗi hệ thống
          }
        } else if (isSystemError) {
          // Ngôn ngữ không support fallback, hiển thị lỗi hệ thống
          console.warn(`⚠️ Judge0 system error nhưng ${language} không support fallback`);
        }
        
        // Xử lý error message - ưu tiên stderr và compile_output (lỗi từ code)
        let errorMessage: string | undefined = undefined;
        if (status !== 'Accepted') {
          if (result.stderr) {
            // Lỗi runtime từ code của user (stderr có thể chứa lỗi thật từ code)
            errorMessage = String(result.stderr).trim();
          } else if (result.compile_output) {
            // Lỗi compile từ code của user
            errorMessage = String(result.compile_output).trim();
          } else if (isSystemError && result.message) {
            // Chỉ khi THỰC SỰ là lỗi hệ thống (không có stderr/compile_output)
            if (result.message.includes('No such file or directory')) {
              errorMessage = 'Lỗi hệ thống: Judge0 không thể tạo file script. Hệ thống sẽ sử dụng phương pháp dự phòng để đánh giá.';
            } else {
              errorMessage = `Lỗi hệ thống Judge0. Hệ thống sẽ sử dụng phương pháp dự phòng để đánh giá.`;
            }
          } else if (result.message) {
            errorMessage = String(result.message).trim();
          }
        }
        
        // Xử lý output - ưu tiên stdout (output chính), nếu không có thì dùng error message
        let actualOutput = '';
        
        if (result.stdout) {
          // Code chạy được và có output
          actualOutput = String(result.stdout).trim();
        } else if (errorMessage) {
          // Code có lỗi, dùng error message làm output để hiển thị
          actualOutput = errorMessage;
        } else {
          // Không có gì cả (trường hợp hiếm)
          actualOutput = 'Không có output';
        }
        
        // So sánh output để xác định passed
        let passed = false;
        
        if (result.stdout && testCase.expectedOutput) {
          // Code chạy được, so sánh output
          const normalizedActual = String(result.stdout).trim();
          const normalizedExpected = testCase.expectedOutput.trim();
          passed = normalizedActual === normalizedExpected;
          console.log(`🔍 Test case ${i + 1} - So sánh output:`, {
            actual: normalizedActual,
            expected: normalizedExpected,
            passed: passed
          });
        } else if (status === 'Accepted') {
          // Status là Accepted nhưng không có output, coi như pass
          passed = true;
        } else {
          // Có lỗi (compile, runtime, v.v.), không pass
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
        console.log(`📝 Fallback - Python code being executed:`, {
          codePreview: code.substring(0, 200),
          codeLength: code.length,
          tempFile: tempFile + fileExtension
        });
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
      console.log(`🚀 Spawning process:`, {
        executable,
        args,
        input: input ? `"${input.substring(0, 50)}..."` : '(no input)'
      });
      
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
      
      console.log(`✅ Fallback execution completed:`, {
        stdout: result.stdout ? `${result.stdout.substring(0, 100)}...` : '(empty)',
        stderr: result.stderr ? `${result.stderr.substring(0, 100)}...` : '(empty)',
        executionTime
      });
      
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        executionTime
      };
    } catch (error: any) {
      // Nếu timeout hoặc lỗi khác, trả về error message
      console.error(`❌ Fallback execution error:`, {
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack
      });
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

