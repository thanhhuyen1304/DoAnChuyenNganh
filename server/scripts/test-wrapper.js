// Test wrapper functionality
const code = `def sum_two_numbers(a, b):
    # Viết code của bạn ở đây
    pass`;

const testCase = {
  input: '5\n3',
  expectedOutput: '8'
};

const language = 'Python';

// Simulate wrapUserCode
function wrapUserCode(code, language, testCase) {
  if (language === 'Python') {
    // Kiểm tra xem code có chứa if __name__ == "__main__" không
    if (code.includes('if __name__') || code.includes('input()') || code.includes('print(')) {
      // Code đã có logic đọc input/print, không cần wrap
      return code;
    }
    
    // Tìm tên hàm trong code (ví dụ: def sum_two_numbers(a, b):)
    const funcMatch = code.match(/def\s+(\w+)\s*\(/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      
      // Parse input để tạo wrapper code
      const inputs = testCase.input.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      
      // Tạo wrapper code
      let wrapper = code + '\n\n';
      wrapper += '# Auto-generated wrapper code\n';
      wrapper += 'if __name__ == "__main__":\n';
      
      // Đọc input
      if (inputs.length === 1) {
        wrapper += `    inp = input().strip()\n`;
        wrapper += `    result = ${funcName}(int(inp))\n`;
      } else if (inputs.length === 2) {
        wrapper += `    a = int(input().strip())\n`;
        wrapper += `    b = int(input().strip())\n`;
        wrapper += `    result = ${funcName}(a, b)\n`;
      } else {
        // Multiple inputs
        wrapper += `    inputs = [int(input().strip()) for _ in range(${inputs.length})]\n`;
        wrapper += `    result = ${funcName}(*inputs)\n`;
      }
      
      wrapper += `    print(result)\n`;
      
      return wrapper;
    }
  }
  
  return code;
}

const wrapped = wrapUserCode(code, language, testCase);
console.log('Original code:');
console.log(code);
console.log('\n' + '='.repeat(80) + '\n');
console.log('Wrapped code:');
console.log(wrapped);
console.log('\n' + '='.repeat(80) + '\n');

// Test với code đúng
const correctCode = `def sum_two_numbers(a, b):
    return a + b`;

const wrappedCorrect = wrapUserCode(correctCode, language, testCase);
console.log('Wrapped correct code:');
console.log(wrappedCorrect);
