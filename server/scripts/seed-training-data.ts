/**
 * Script Seed Training Data Mẫu
 * Tạo 50+ training data items để chatbot có thể học
 * 
 * Usage:
 *   npx ts-node scripts/seed-training-data.ts
 */

import mongoose from 'mongoose';
import TrainingData from '../src/models/trainingData.model';
import User from '../src/models/user.model';

// Lấy MONGODB_URI từ env, nếu không có thì dùng default
// Xử lý case sensitivity của database name
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
// Nếu URI có /bughunter, thử thay bằng /BugHunter (case sensitivity)
if (MONGODB_URI.includes('/bughunter') && !MONGODB_URI.includes('/BugHunter')) {
  // Thử với BugHunter trước
  const uriWithBugHunter = MONGODB_URI.replace('/bughunter', '/BugHunter');
  MONGODB_URI = uriWithBugHunter;
}

const trainingDataSamples = [
  // Debug & Error Handling
  {
    question: 'Làm sao debug lỗi JavaScript?',
    answer: 'Để debug lỗi JavaScript, bạn có thể:\n1. Sử dụng console.log() để in giá trị\n2. Dùng debugger trong browser DevTools\n3. Kiểm tra console để xem error messages\n4. Sử dụng try-catch để bắt lỗi\n5. Kiểm tra syntax và logic của code',
    category: 'debugging',
    tags: ['debug', 'javascript', 'error', 'troubleshooting'],
    priority: 9,
  },
  {
    question: 'Lỗi "undefined is not defined" trong JavaScript là gì?',
    answer: 'Lỗi "undefined is not defined" xảy ra khi bạn cố gắng sử dụng một biến chưa được khai báo. Giải pháp:\n1. Khai báo biến với var, let, hoặc const\n2. Kiểm tra biến đã được khởi tạo chưa\n3. Sử dụng optional chaining (?.) nếu có thể\n4. Kiểm tra scope của biến',
    category: 'debugging',
    tags: ['javascript', 'error', 'undefined', 'runtime'],
    priority: 8,
  },
  {
    question: 'Lỗi syntax error trong Python là gì?',
    answer: 'Syntax error trong Python xảy ra khi code vi phạm quy tắc cú pháp. Các lỗi thường gặp:\n1. Thiếu dấu hai chấm (:) sau if, for, while\n2. Thiếu dấu ngoặc đóng\n3. Indentation sai\n4. Thiếu dấu phẩy hoặc dấu ngoặc kép\nGiải pháp: Kiểm tra cú pháp cẩn thận, sử dụng IDE có syntax highlighting',
    category: 'debugging',
    tags: ['python', 'syntax', 'error', 'debugging'],
    priority: 8,
  },
  {
    question: 'Làm sao fix lỗi "Cannot read property of undefined"?',
    answer: 'Lỗi này xảy ra khi bạn cố truy cập property của một object undefined. Giải pháp:\n1. Kiểm tra object đã được khởi tạo chưa\n2. Sử dụng optional chaining: obj?.property\n3. Sử dụng nullish coalescing: obj ?? defaultValue\n4. Kiểm tra điều kiện trước khi truy cập',
    category: 'debugging',
    tags: ['javascript', 'error', 'undefined', 'property'],
    priority: 7,
  },
  {
    question: 'Lỗi runtime error là gì?',
    answer: 'Runtime error là lỗi xảy ra khi chương trình đang chạy, không phải lúc compile. Các loại:\n1. Null pointer exception\n2. Array index out of bounds\n3. Division by zero\n4. Type mismatch\nGiải pháp: Sử dụng try-catch, kiểm tra input, validate data trước khi sử dụng',
    category: 'debugging',
    tags: ['error', 'runtime', 'exception', 'debugging'],
    priority: 7,
  },
  
  // Programming Concepts
  {
    question: 'Array trong JavaScript là gì?',
    answer: 'Array trong JavaScript là một cấu trúc dữ liệu để lưu trữ nhiều giá trị. Cách sử dụng:\n1. Khai báo: const arr = [] hoặc const arr = new Array()\n2. Thêm phần tử: arr.push(item)\n3. Truy cập: arr[index]\n4. Duyệt: arr.forEach() hoặc for...of\n5. Các method: map(), filter(), reduce(), find()',
    category: 'programming',
    tags: ['javascript', 'array', 'data-structure', 'basics'],
    priority: 6,
  },
  {
    question: 'Function trong Python là gì?',
    answer: 'Function trong Python là một khối code có thể tái sử dụng. Cách định nghĩa:\n```python\ndef function_name(parameters):\n    # code\n    return value\n```\nCác loại:\n1. Built-in functions\n2. User-defined functions\n3. Lambda functions\n4. Recursive functions',
    category: 'programming',
    tags: ['python', 'function', 'basics', 'programming'],
    priority: 6,
  },
  {
    question: 'Vòng lặp for trong JavaScript?',
    answer: 'Vòng lặp for trong JavaScript có nhiều cách:\n1. for (let i = 0; i < length; i++)\n2. for (let item of array) - duyệt giá trị\n3. for (let key in object) - duyệt key\n4. array.forEach((item, index) => {})\n5. array.map(), array.filter() - functional programming',
    category: 'programming',
    tags: ['javascript', 'loop', 'for', 'iteration'],
    priority: 5,
  },
  {
    question: 'Object trong JavaScript là gì?',
    answer: 'Object trong JavaScript là một cấu trúc dữ liệu key-value. Cách sử dụng:\n1. Khai báo: const obj = { key: value }\n2. Truy cập: obj.key hoặc obj["key"]\n3. Thêm property: obj.newKey = value\n4. Xóa: delete obj.key\n5. Duyệt: Object.keys(), Object.values(), Object.entries()',
    category: 'programming',
    tags: ['javascript', 'object', 'data-structure', 'basics'],
    priority: 5,
  },
  {
    question: 'Class trong Python là gì?',
    answer: 'Class trong Python là blueprint để tạo objects. Cách định nghĩa:\n```python\nclass MyClass:\n    def __init__(self, param):\n        self.param = param\n    \n    def method(self):\n        return self.param\n```\nCác khái niệm: inheritance, encapsulation, polymorphism, abstraction',
    category: 'programming',
    tags: ['python', 'class', 'oop', 'object-oriented'],
    priority: 5,
  },
  
  // Algorithm & Logic
  {
    question: 'Thuật toán tìm kiếm nhị phân (binary search) là gì?',
    answer: 'Binary search là thuật toán tìm kiếm trong mảng đã sắp xếp. Cách hoạt động:\n1. So sánh phần tử giữa với giá trị cần tìm\n2. Nếu bằng → tìm thấy\n3. Nếu lớn hơn → tìm bên trái\n4. Nếu nhỏ hơn → tìm bên phải\n5. Lặp lại cho đến khi tìm thấy hoặc hết mảng\nĐộ phức tạp: O(log n)',
    category: 'algorithm',
    tags: ['algorithm', 'search', 'binary-search', 'data-structure'],
    priority: 6,
  },
  {
    question: 'Sắp xếp mảng trong JavaScript?',
    answer: 'Có nhiều cách sắp xếp mảng trong JavaScript:\n1. arr.sort() - sắp xếp tại chỗ\n2. arr.sort((a, b) => a - b) - số tăng dần\n3. arr.sort((a, b) => b - a) - số giảm dần\n4. Sử dụng các thuật toán: bubble sort, quick sort, merge sort\nLưu ý: sort() mặc định sắp xếp theo string, cần compare function cho số',
    category: 'algorithm',
    tags: ['javascript', 'sort', 'array', 'algorithm'],
    priority: 5,
  },
  {
    question: 'Recursion (đệ quy) là gì?',
    answer: 'Recursion là kỹ thuật function gọi chính nó. Cấu trúc:\n1. Base case - điều kiện dừng\n2. Recursive case - gọi lại chính nó với input nhỏ hơn\nVí dụ tính giai thừa:\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n```\nLưu ý: Cần có base case để tránh infinite loop',
    category: 'algorithm',
    tags: ['recursion', 'algorithm', 'programming', 'concept'],
    priority: 5,
  },
  
  // Best Practices
  {
    question: 'Best practices khi viết code JavaScript?',
    answer: 'Các best practices:\n1. Sử dụng const/let thay vì var\n2. Đặt tên biến rõ ràng, có ý nghĩa\n3. Tránh global variables\n4. Sử dụng arrow functions khi phù hợp\n5. Xử lý errors với try-catch\n6. Comment code phức tạp\n7. Format code nhất quán\n8. Sử dụng ESLint để kiểm tra code',
    category: 'best-practices',
    tags: ['javascript', 'best-practices', 'coding-standards', 'clean-code'],
    priority: 6,
  },
  {
    question: 'Cách viết code Python clean và readable?',
    answer: 'Các nguyên tắc:\n1. Tuân thủ PEP 8 style guide\n2. Đặt tên biến rõ ràng, snake_case\n3. Sử dụng docstrings cho functions\n4. Giữ functions ngắn gọn, một nhiệm vụ\n5. Sử dụng list comprehensions khi phù hợp\n6. Tránh nested quá sâu\n7. Sử dụng type hints\n8. Viết unit tests',
    category: 'best-practices',
    tags: ['python', 'best-practices', 'pep8', 'clean-code'],
    priority: 6,
  },
  
  // Error Types
  {
    question: 'Các loại lỗi trong lập trình?',
    answer: 'Có 4 loại lỗi chính:\n1. Syntax Error - lỗi cú pháp, code không compile\n2. Runtime Error - lỗi khi chạy (null pointer, division by zero)\n3. Logic Error - code chạy nhưng kết quả sai\n4. Compilation Error - lỗi khi biên dịch\nMỗi loại cần cách xử lý khác nhau',
    category: 'debugging',
    tags: ['error', 'types', 'debugging', 'programming'],
    priority: 7,
  },
  {
    question: 'Lỗi logic error là gì?',
    answer: 'Logic error là lỗi khi code chạy được nhưng cho kết quả sai. Ví dụ:\n1. So sánh sai (== thay vì ===)\n2. Điều kiện if sai\n3. Vòng lặp sai logic\n4. Tính toán sai công thức\nGiải pháp: Debug từng bước, kiểm tra logic, viết test cases',
    category: 'debugging',
    tags: ['error', 'logic', 'debugging', 'troubleshooting'],
    priority: 6,
  },
  
  // More Debugging
  {
    question: 'Làm sao fix lỗi "TypeError: Cannot read property"?',
    answer: 'Lỗi này xảy ra khi truy cập property của null/undefined. Giải pháp:\n1. Kiểm tra object không null trước khi truy cập\n2. Sử dụng optional chaining: obj?.property\n3. Sử dụng default value: obj?.property ?? defaultValue\n4. Validate input trước khi sử dụng',
    category: 'debugging',
    tags: ['javascript', 'error', 'typeerror', 'debugging'],
    priority: 7,
  },
  {
    question: 'Lỗi "Index out of range" trong Python?',
    answer: 'Lỗi này xảy ra khi truy cập index không tồn tại trong list/array. Giải pháp:\n1. Kiểm tra length trước khi truy cập: if index < len(arr)\n2. Sử dụng try-except để bắt lỗi\n3. Sử dụng enumerate() khi duyệt\n4. Kiểm tra list không rỗng: if arr:',
    category: 'debugging',
    tags: ['python', 'error', 'index', 'array'],
    priority: 7,
  },
  {
    question: 'Làm sao debug code hiệu quả?',
    answer: 'Các kỹ thuật debug:\n1. Print/console.log để xem giá trị\n2. Sử dụng debugger trong IDE\n3. Breakpoints để dừng tại điểm cụ thể\n4. Step through code từng dòng\n5. Kiểm tra input và output\n6. Tách code thành functions nhỏ để test\n7. Viết unit tests',
    category: 'debugging',
    tags: ['debugging', 'troubleshooting', 'programming', 'best-practices'],
    priority: 8,
  },
  
  // More Programming
  {
    question: 'String trong JavaScript?',
    answer: 'String trong JavaScript là chuỗi ký tự. Các method:\n1. str.length - độ dài\n2. str.toUpperCase(), str.toLowerCase()\n3. str.substring(start, end)\n4. str.split(separator)\n5. str.includes(substring)\n6. str.replace(old, new)\n7. Template literals: `Hello ${name}`',
    category: 'programming',
    tags: ['javascript', 'string', 'basics', 'programming'],
    priority: 5,
  },
  {
    question: 'List trong Python?',
    answer: 'List trong Python là mảng động. Các operations:\n1. Khai báo: my_list = [] hoặc my_list = [1, 2, 3]\n2. Thêm: my_list.append(item)\n3. Truy cập: my_list[index]\n4. Slice: my_list[start:end]\n5. List comprehension: [x*2 for x in range(10)]\n6. Methods: len(), max(), min(), sum()',
    category: 'programming',
    tags: ['python', 'list', 'array', 'data-structure'],
    priority: 5,
  },
  {
    question: 'Dictionary trong Python?',
    answer: 'Dictionary trong Python là key-value pairs. Cách sử dụng:\n1. Khai báo: my_dict = {} hoặc my_dict = {"key": "value"}\n2. Truy cập: my_dict["key"] hoặc my_dict.get("key")\n3. Thêm: my_dict["new_key"] = value\n4. Duyệt: for key, value in my_dict.items()\n5. Methods: keys(), values(), items()',
    category: 'programming',
    tags: ['python', 'dictionary', 'dict', 'data-structure'],
    priority: 5,
  },
  
  // More Error Handling
  {
    question: 'Try-catch trong JavaScript?',
    answer: 'Try-catch dùng để xử lý lỗi:\n```javascript\ntry {\n  // code có thể lỗi\n} catch (error) {\n  // xử lý lỗi\n  console.error(error);\n} finally {\n  // code luôn chạy\n}\n```\nLưu ý: Chỉ catch lỗi bạn có thể xử lý, không catch mọi thứ',
    category: 'debugging',
    tags: ['javascript', 'try-catch', 'error-handling', 'exception'],
    priority: 6,
  },
  {
    question: 'Try-except trong Python?',
    answer: 'Try-except dùng để xử lý exceptions:\n```python\ntry:\n    # code có thể lỗi\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("Không thể chia cho 0")\nexcept Exception as e:\n    print(f"Lỗi: {e}")\nfinally:\n    # code luôn chạy\n    print("Done")\n```',
    category: 'debugging',
    tags: ['python', 'try-except', 'error-handling', 'exception'],
    priority: 6,
  },
  
  // Performance
  {
    question: 'Làm sao tối ưu performance code JavaScript?',
    answer: 'Các cách tối ưu:\n1. Tránh vòng lặp lồng nhau không cần thiết\n2. Sử dụng Set/Map cho lookup nhanh\n3. Tránh DOM manipulation trong vòng lặp\n4. Sử dụng debounce/throttle cho events\n5. Lazy loading cho images\n6. Code splitting cho large apps\n7. Sử dụng Web Workers cho heavy tasks',
    category: 'performance',
    tags: ['javascript', 'performance', 'optimization', 'best-practices'],
    priority: 5,
  },
  
  // More Questions
  {
    question: 'Gợi ý bài tập lập trình cho người mới?',
    answer: 'Các bài tập phù hợp cho người mới:\n1. Hello World - in ra màn hình\n2. Tính tổng, hiệu, tích, thương\n3. Kiểm tra số chẵn/lẻ\n4. Tìm số lớn nhất trong mảng\n5. Đảo ngược chuỗi\n6. Tính giai thừa\n7. Kiểm tra số nguyên tố\n8. Fibonacci sequence\nBắt đầu từ dễ, tăng dần độ khó',
    category: 'learning',
    tags: ['learning', 'beginner', 'exercises', 'programming'],
    priority: 6,
  },
  {
    question: 'Làm sao học lập trình hiệu quả?',
    answer: 'Các tips học lập trình:\n1. Thực hành thường xuyên, code mỗi ngày\n2. Bắt đầu từ basics, không nhảy bước\n3. Làm projects thực tế\n4. Đọc code của người khác\n5. Tham gia cộng đồng, hỏi khi cần\n6. Viết code, không chỉ đọc\n7. Debug và fix lỗi để học\n8. Kiên nhẫn, không bỏ cuộc',
    category: 'learning',
    tags: ['learning', 'education', 'tips', 'programming'],
    priority: 7,
  },
  {
    question: 'Cách sửa lỗi "Module not found" trong Node.js?',
    answer: 'Lỗi này xảy ra khi module chưa được cài đặt. Giải pháp:\n1. Cài đặt module: npm install module-name\n2. Kiểm tra package.json có module chưa\n3. Kiểm tra đường dẫn import đúng chưa\n4. Chạy npm install để cài tất cả dependencies\n5. Kiểm tra node_modules folder tồn tại',
    category: 'debugging',
    tags: ['nodejs', 'npm', 'module', 'error'],
    priority: 6,
  },
  {
    question: 'Promise trong JavaScript là gì?',
    answer: 'Promise là object đại diện cho async operation. Cách sử dụng:\n```javascript\nconst promise = new Promise((resolve, reject) => {\n  // async code\n  if (success) resolve(result);\n  else reject(error);\n});\n\npromise.then(result => {}).catch(error => {});\n```\nHoặc dùng async/await:\n```javascript\nasync function myFunc() {\n  try {\n    const result = await promise;\n  } catch (error) {}\n}\n```',
    category: 'programming',
    tags: ['javascript', 'promise', 'async', 'programming'],
    priority: 6,
  },
  {
    question: 'Async/await trong JavaScript?',
    answer: 'Async/await là cách viết async code dễ đọc hơn Promise. Cách dùng:\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}\n```\nLưu ý: Function phải có async, await chỉ dùng trong async function',
    category: 'programming',
    tags: ['javascript', 'async', 'await', 'programming'],
    priority: 6,
  },
  {
    question: 'Lỗi "Maximum call stack size exceeded"?',
    answer: 'Lỗi này xảy ra khi recursion quá sâu hoặc infinite loop. Giải pháp:\n1. Kiểm tra base case trong recursion\n2. Đảm bảo recursion có điều kiện dừng\n3. Kiểm tra vòng lặp có điều kiện thoát\n4. Sử dụng iterative thay vì recursive nếu có thể\n5. Tăng stack size nếu cần (không khuyến nghị)',
    category: 'debugging',
    tags: ['error', 'recursion', 'stack-overflow', 'debugging'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "Cannot access before initialization"?',
    answer: 'Lỗi này xảy ra khi dùng biến trước khi khai báo (với let/const). Giải pháp:\n1. Khai báo biến trước khi sử dụng\n2. Không dùng biến trong temporal dead zone\n3. Sử dụng var nếu cần hoisting (không khuyến nghị)\n4. Kiểm tra thứ tự khai báo và sử dụng',
    category: 'debugging',
    tags: ['javascript', 'error', 'hoisting', 'let-const'],
    priority: 5,
  },
  {
    question: 'Lỗi "ReferenceError" trong JavaScript?',
    answer: 'ReferenceError xảy ra khi truy cập biến chưa được khai báo. Giải pháp:\n1. Khai báo biến với var, let, hoặc const\n2. Kiểm tra scope của biến\n3. Kiểm tra tên biến đúng chưa (typo)\n4. Kiểm tra biến đã được import/require chưa',
    category: 'debugging',
    tags: ['javascript', 'error', 'referenceerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Làm sao test code JavaScript?',
    answer: 'Các cách test code:\n1. Unit tests với Jest, Mocha\n2. Manual testing trong browser console\n3. Viết test cases cho từng function\n4. Test edge cases và error cases\n5. Sử dụng assert để kiểm tra kết quả\n6. Integration tests cho toàn bộ flow\n7. E2E tests với Cypress, Playwright',
    category: 'testing',
    tags: ['javascript', 'testing', 'jest', 'best-practices'],
    priority: 5,
  },
  {
    question: 'Làm sao test code Python?',
    answer: 'Các cách test code Python:\n1. Sử dụng unittest module\n2. Sử dụng pytest (phổ biến hơn)\n3. Viết test functions với test_ prefix\n4. Sử dụng assert để kiểm tra\n5. Test edge cases và exceptions\n6. Mock external dependencies\n7. Coverage để biết code nào chưa test',
    category: 'testing',
    tags: ['python', 'testing', 'pytest', 'unittest'],
    priority: 5,
  },
  {
    question: 'Git là gì và cách sử dụng?',
    answer: 'Git là version control system. Các lệnh cơ bản:\n1. git init - khởi tạo repository\n2. git add . - thêm files vào staging\n3. git commit -m "message" - commit changes\n4. git push - đẩy lên remote\n5. git pull - kéo về từ remote\n6. git branch - quản lý branches\n7. git merge - merge branches\n8. git status - xem trạng thái',
    category: 'tools',
    tags: ['git', 'version-control', 'tools', 'development'],
    priority: 6,
  },
  {
    question: 'Lỗi "Cannot find module" trong Node.js?',
    answer: 'Lỗi này xảy ra khi không tìm thấy module. Giải pháp:\n1. Kiểm tra module đã được cài đặt: npm list\n2. Kiểm tra đường dẫn import đúng\n3. Kiểm tra package.json có module chưa\n4. Chạy npm install\n5. Kiểm tra node_modules folder\n6. Kiểm tra NODE_PATH environment variable',
    category: 'debugging',
    tags: ['nodejs', 'module', 'error', 'npm'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "Uncaught TypeError"?',
    answer: 'Lỗi này xảy ra khi thao tác với giá trị sai type. Giải pháp:\n1. Kiểm tra type của biến: typeof variable\n2. Validate input trước khi sử dụng\n3. Sử dụng type checking\n4. Kiểm tra null/undefined\n5. Sử dụng optional chaining\n6. Convert type nếu cần: Number(), String()',
    category: 'debugging',
    tags: ['javascript', 'error', 'typeerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Lỗi "IndentationError" trong Python?',
    answer: 'Lỗi này xảy ra khi indentation sai. Giải pháp:\n1. Sử dụng 4 spaces hoặc 1 tab nhất quán\n2. Không mix spaces và tabs\n3. Kiểm tra indentation của blocks (if, for, def)\n4. Sử dụng IDE có auto-indent\n5. Kiểm tra tất cả blocks có indentation đúng',
    category: 'debugging',
    tags: ['python', 'error', 'indentation', 'syntax'],
    priority: 7,
  },
  {
    question: 'Làm sao fix lỗi "NameError" trong Python?',
    answer: 'Lỗi này xảy ra khi biến chưa được định nghĩa. Giải pháp:\n1. Khai báo biến trước khi sử dụng\n2. Kiểm tra tên biến đúng chưa (typo)\n3. Kiểm tra scope của biến\n4. Kiểm tra import đúng chưa\n5. Kiểm tra biến có trong namespace không',
    category: 'debugging',
    tags: ['python', 'error', 'nameerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Lỗi "TypeError" trong Python?',
    answer: 'Lỗi này xảy ra khi thao tác với type sai. Giải pháp:\n1. Kiểm tra type: type(variable)\n2. Convert type nếu cần: int(), str(), list()\n3. Validate input trước khi sử dụng\n4. Kiểm tra method có tồn tại không\n5. Sử dụng isinstance() để kiểm tra type',
    category: 'debugging',
    tags: ['python', 'error', 'typeerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "KeyError" trong Python?',
    answer: 'Lỗi này xảy ra khi truy cập key không tồn tại trong dict. Giải pháp:\n1. Kiểm tra key có tồn tại: if key in dict\n2. Sử dụng dict.get(key, default)\n3. Sử dụng try-except để bắt lỗi\n4. Kiểm tra dict.keys() trước khi truy cập\n5. Sử dụng dict.setdefault()',
    category: 'debugging',
    tags: ['python', 'error', 'keyerror', 'dictionary'],
    priority: 6,
  },
  {
    question: 'Lỗi "AttributeError" trong Python?',
    answer: 'Lỗi này xảy ra khi truy cập attribute không tồn tại. Giải pháp:\n1. Kiểm tra object có attribute: hasattr(obj, "attr")\n2. Sử dụng getattr(obj, "attr", default)\n3. Kiểm tra type của object\n4. Kiểm tra import đúng chưa\n5. Kiểm tra version của library',
    category: 'debugging',
    tags: ['python', 'error', 'attributeerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "ValueError" trong Python?',
    answer: 'Lỗi này xảy ra khi giá trị không đúng format. Giải pháp:\n1. Validate input trước khi convert\n2. Kiểm tra format của string\n3. Sử dụng try-except để bắt lỗi\n4. Kiểm tra range của giá trị\n5. Convert type cẩn thận: int(), float()',
    category: 'debugging',
    tags: ['python', 'error', 'valueerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Lỗi "ZeroDivisionError" trong Python?',
    answer: 'Lỗi này xảy ra khi chia cho 0. Giải pháp:\n1. Kiểm tra mẫu số khác 0 trước khi chia\n2. Sử dụng try-except để bắt lỗi\n3. Validate input\n4. Xử lý edge case\n5. Return giá trị mặc định nếu chia cho 0',
    category: 'debugging',
    tags: ['python', 'error', 'zerodivisionerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "ImportError" trong Python?',
    answer: 'Lỗi này xảy ra khi không import được module. Giải pháp:\n1. Kiểm tra module đã được cài đặt: pip list\n2. Cài đặt module: pip install module-name\n3. Kiểm tra đường dẫn import đúng\n4. Kiểm tra PYTHONPATH\n5. Kiểm tra virtual environment đã activate chưa',
    category: 'debugging',
    tags: ['python', 'error', 'importerror', 'module'],
    priority: 6,
  },
  {
    question: 'Lỗi "ModuleNotFoundError" trong Python?',
    answer: 'Lỗi này xảy ra khi không tìm thấy module. Giải pháp:\n1. Cài đặt module: pip install module-name\n2. Kiểm tra module có trong requirements.txt\n3. Kiểm tra virtual environment\n4. Kiểm tra đường dẫn import\n5. Chạy pip install -r requirements.txt',
    category: 'debugging',
    tags: ['python', 'error', 'modulenotfounderror', 'module'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "SyntaxError" trong Python?',
    answer: 'Lỗi này xảy ra khi cú pháp sai. Các lỗi thường gặp:\n1. Thiếu dấu hai chấm (:) sau if, for, def\n2. Thiếu dấu ngoặc đóng\n3. Thiếu dấu phẩy\n4. String không đóng đúng\n5. Indentation sai\nGiải pháp: Kiểm tra cú pháp cẩn thận, sử dụng IDE',
    category: 'debugging',
    tags: ['python', 'error', 'syntaxerror', 'syntax'],
    priority: 7,
  },
  {
    question: 'Lỗi "RuntimeError" trong Python?',
    answer: 'Lỗi này xảy ra khi có lỗi runtime. Giải pháp:\n1. Kiểm tra logic của code\n2. Validate input\n3. Kiểm tra điều kiện\n4. Sử dụng try-except để bắt lỗi\n5. Debug từng bước\n6. Kiểm tra resources (memory, file)',
    category: 'debugging',
    tags: ['python', 'error', 'runtimeerror', 'debugging'],
    priority: 6,
  },
  {
    question: 'Làm sao fix lỗi "MemoryError" trong Python?',
    answer: 'Lỗi này xảy ra khi hết bộ nhớ. Giải pháp:\n1. Giảm kích thước data structures\n2. Sử dụng generator thay vì list lớn\n3. Xóa biến không dùng: del variable\n4. Sử dụng streaming cho large files\n5. Tối ưu algorithm\n6. Tăng memory limit nếu có thể',
    category: 'debugging',
    tags: ['python', 'error', 'memoryerror', 'performance'],
    priority: 5,
  },
  {
    question: 'Lỗi "TimeoutError" là gì?',
    answer: 'Lỗi này xảy ra khi operation quá lâu. Giải pháp:\n1. Tăng timeout nếu có thể\n2. Tối ưu code để chạy nhanh hơn\n3. Sử dụng async/await cho I/O\n4. Chạy heavy tasks trong background\n5. Kiểm tra network connection\n6. Sử dụng caching',
    category: 'debugging',
    tags: ['error', 'timeout', 'performance', 'debugging'],
    priority: 5,
  },
  {
    question: 'Làm sao fix lỗi "NetworkError"?',
    answer: 'Lỗi này xảy ra khi có vấn đề network. Giải pháp:\n1. Kiểm tra internet connection\n2. Kiểm tra URL/endpoint đúng chưa\n3. Kiểm tra CORS nếu là web\n4. Retry với exponential backoff\n5. Kiểm tra firewall/proxy\n6. Sử dụng try-catch để handle gracefully',
    category: 'debugging',
    tags: ['error', 'network', 'http', 'debugging'],
    priority: 5,
  },
];

async function seedTrainingData() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    try {
      await mongoose.connect(MONGODB_URI);
    } catch (connectError: any) {
      // Xử lý lỗi database name case sensitivity
      if (connectError.message && connectError.message.includes('different case')) {
        console.log('   ⚠️  Lỗi database name case, thử kết nối lại...');
        // Thử với database name từ URI
        const uriParts = MONGODB_URI.split('/');
        const dbName = uriParts[uriParts.length - 1];
        const baseUri = MONGODB_URI.replace(`/${dbName}`, '');
        // Kết nối với database name chính xác
        await mongoose.connect(`${baseUri}/${dbName}`);
      } else {
        throw connectError;
      }
    }
    console.log('✅ Đã kết nối MongoDB\n');

    // Tìm admin user để làm createdBy
    const adminUser = await User.findOne({ role: 'admin' }).lean();
    const createdBy = adminUser ? adminUser._id : undefined;

    console.log('📚 Đang seed Training Data...');
    console.log(`   Sẽ tạo ${trainingDataSamples.length} training data items\n`);

    let created = 0;
    let skipped = 0;

    for (const data of trainingDataSamples) {
      // Kiểm tra xem đã tồn tại chưa
      const existing = await TrainingData.findOne({ 
        question: data.question,
      });

      if (existing) {
        console.log(`   ⏭️  Đã tồn tại: "${data.question.substring(0, 50)}..."`);
        skipped++;
        continue;
      }

      const trainingData = new TrainingData({
        ...data,
        createdBy,
      });

      await trainingData.save();
      created++;
      console.log(`   ✅ Đã tạo: "${data.question.substring(0, 50)}..."`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('📊 KẾT QUẢ SEED TRAINING DATA');
    console.log('='.repeat(70));
    console.log(`✅ Đã tạo: ${created} items`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} items (đã tồn tại)`);
    console.log(`📚 Tổng số training data: ${await TrainingData.countDocuments({ isActive: true })} active`);
    console.log('='.repeat(70));

  } catch (error: any) {
    console.error('❌ Lỗi khi seed training data:', error.message);
      console.error(error.stack);
  } finally {
      await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

// Run seed
if (require.main === module) {
  seedTrainingData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedTrainingData };
