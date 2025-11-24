// AI Training Data for BugHunter ChatBox
// This file contains training data, patterns, and responses for improving AI accuracy

export interface TrainingData {
  patterns: string[]
  responses: string[]
  category: string
  language: 'vi' | 'en'
}

export interface AIContext {
  userHistory: string[]
  conversationContext: string
  userLevel: 'beginner' | 'intermediate' | 'advanced'
}

// Vietnamese Training Data
export const viTrainingData: TrainingData[] = [
  // 1. Greeting & Introduction
  {
    category: 'greeting',
    language: 'vi',
    patterns: [
      'xin chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào', 'tôi muốn nói chuyện',
      'bắt đầu', 'tôi cần giúp', 'có ai không', 'làm sao', 'hỏi gì'
    ],
    responses: [
      'Xin chào! 👋 Tôi là trợ lý AI của BugHunter. Tôi sẵn sàng giúp bạn học debug, giải quyết lỗi, hoặc trả lời các câu hỏi về lập trình. Bạn cần gì?',
      'Chào bạn! 😊 Tôi có thể giúp bạn với các bài tập debug, hướng dẫn sử dụng website, hoặc giải đáp thắc mắc về lập trình.',
      'Xin chào! Tôi rất vui được hỗ trợ bạn trên hành trình học lập trình. Có điều gì tôi có thể giúp không?'
    ]
  },

  // 2. Debugging Tips & Techniques
  {
    category: 'debugging',
    language: 'vi',
    patterns: [
      'debug', 'lỗi', 'error', 'fix', 'sửa', 'không chạy', 'bị lỗi', 'có vấn đề',
      'khó debug', 'làm sao fix', 'code lỗi', 'chương trình bị lỗi', 'tìm lỗi'
    ],
    responses: [
      'Để debug hiệu quả, bạn nên thực hiện theo các bước:\n1. Đọc kỹ thông báo lỗi - nó thường chỉ cho bạn biết vấn đề ở đâu\n2. Dùng console.log() hoặc debugger để theo dõi giá trị biến\n3. Chia nhỏ vấn đề thành các phần nhỏ hơn\n4. Kiểm tra các giả định và điều kiện logic\n5. Google lỗi nếu không hiểu\n\nBạn đang gặp lỗi nào cụ thể?',
      'Đây là những mẹo debug hiệu quả:\n• Sử dụng console.log() để in ra giá trị tại các điểm quan trọng\n• Đặt breakpoint trong debugger để dừng chương trình\n• Đọc stack trace từ dưới lên trên\n• Thử tách code thành các hàm nhỏ hơn\n• Viết test để xác minh từng phần\n\nCó lỗi cụ thể bạn cần giúp?',
      'Mẹo debug nhanh: Hãy tìm thứ gần đây nhất bạn thay đổi. Lỗi thường xuất hiện gần nơi bạn vừa sửa! 🎯'
    ]
  },

  // 3. Challenges & Exercises
  {
    category: 'challenges',
    language: 'vi',
    patterns: [
      'bài tập', 'challenge', 'thử thách', 'luyện tập', 'bài nào', 'làm bài',
      'bài dễ', 'bài khó', 'level nào', 'bắt đầu từ đâu', 'có bao nhiêu bài'
    ],
    responses: [
      'BugHunter có hàng trăm bài tập debug từ cơ bản đến nâng cao! 📚\n\nĐây là cách bắt đầu:\n1. Vào tab "Thử thách" trên trang web\n2. Chọn mức độ khó: Beginner → Intermediate → Advanced\n3. Bắt đầu với các bài dễ để làm quen\n4. Đọc hướng dẫn và mã source code\n5. Tìm và sửa lỗi\n6. Submit để kiểm tra\n\nMỗi bài tập hoàn thành sẽ tăng điểm của bạn!',
      'Để bắt đầu luyện tập:\n✅ Chọn bài tập từ "Thử thách"\n✅ Đọc kỹ mô tả vấn đề\n✅ Phân tích code\n✅ Tìm lỗi logic\n✅ Sửa và submit\n\nBắt đầu từ mức Beginner nhé! Làm từ dễ đến khó sẽ giúp bạn học tốt hơn.',
      'Mình gợi ý: Bắt đầu với các bài tập Beginner, chúng tập trung vào các lỗi cơ bản như:\n• Sai cú pháp\n• Logic sai\n• Off-by-one errors\n• Kiểu dữ liệu sai\n\nSau khi làm vài bài dễ, bạn sẽ tự tin hơn! 💪'
    ]
  },

  // 4. Progress & Tracking
  {
    category: 'progress',
    language: 'vi',
    patterns: [
      'tiến độ', 'progress', 'score', 'điểm', 'xếp hạng', 'bảng xếp hạng', 'ranking',
      'thành tích', 'hoàn thành bao nhiêu', 'tôi đạt được gì', 'so sánh'
    ],
    responses: [
      'Để xem tiến độ của bạn, hãy:\n1. Vào trang "Bảng xếp hạng" để so sánh với người khác\n2. Nhấp vào "Hồ sơ" để xem thống kê cá nhân\n3. Xem danh sách bài tập đã hoàn thành\n4. Kiểm tra điểm tích lũy\n\nHọc liên tục để tăng điểm và leo lên bảng xếp hạng! 🏆',
      'Bạn có thể theo dõi tiến độ qua:\n📊 Dashboard cá nhân - xem tất cả thống kê\n🏆 Bảng xếp hạng - so sánh với cộng đồng\n🎖️ Huy hiệu - nhận thành tích từ bài tập\n📈 Biểu đồ tiến độ - theo dõi xu hướng học tập\n\nKhăng nhẩm! Bạn sắp được lên hạng!',
      'Cách tốt nhất để cải thiện là:\n1. Hoàn thành ít nhất 1 bài mỗi ngày\n2. Thử các bài ở mức độ cao hơn\n3. Xem hướng dẫn chi tiết nếu sai\n4. Học từ lỗi của mình\n\nBạn đã hoàn thành bao nhiêu bài rồi?'
    ]
  },

  // 5. Programming Concepts
  {
    category: 'concepts',
    language: 'vi',
    patterns: [
      'loop', 'function', 'array', 'string', 'condition', 'if else', 'switch',
      'recursion', 'scope', 'closure', 'callback', 'promise', 'async await',
      'biến', 'hàm', 'mảng', 'chuỗi', 'vòng lặp', 'điều kiện', 'tham số'
    ],
    responses: [
      'Bạn đang hỏi về các khái niệm lập trình cơ bản. Những chủ đề này rất quan trọng!\n\n📚 Giải thích từng phần:\n• Loop (Vòng lặp): Lặp lại code nhiều lần\n• Function (Hàm): Nhóm code để tái sử dụng\n• Array (Mảng): Lưu nhiều giá trị\n• String (Chuỗi): Văn bản hoặc ký tự\n\nBạn muốn hiểu rõ hơn cái nào?',
      'Những khái niệm này rất quan trọng để debug tốt:\n🔑 Scope - biến hoạt động ở đâu\n🔄 Loop - cách vòng lặp hoạt động\n🎯 Condition - if/else logic\n📦 Array - truy cập phần tử đúng index\n\nHiểu rõ những điều này sẽ giúp bạn tìm lỗi nhanh hơn!',
      'Hãy bắt đầu học từ những khái niệm cơ bản:\n1. Variables (Biến) - lưu dữ liệu\n2. Data Types (Kiểu dữ liệu) - int, string, boolean...\n3. Operators (Toán tử) - +, -, *, /, ==...\n4. Control Flow (Luồng điều khiển) - if, loop\n5. Functions (Hàm) - tái sử dụng code\n\nSau đó là async, promises, vv. Từng bước một nhé!'
    ]
  },

  // 6. Language-Specific Help
  {
    category: 'languages',
    language: 'vi',
    patterns: [
      'javascript', 'python', 'java', 'c++', 'ruby', 'php', 'go',
      'ngôn ngữ nào', 'ngôn ngữ nào tốt', 'học gì trước', 'js', 'py'
    ],
    responses: [
      'BugHunter hỗ trợ nhiều ngôn ngữ:\n• JavaScript - phổ biến, dễ học\n• Python - dễ hiểu, tốt cho người mới\n• Java - dùng cho dự án lớn\n• C++ - nhanh, phức tạp hơn\n• Và nhiều ngôn ngữ khác!\n\nMỗi ngôn ngữ có bài tập riêng. Bạn muốn học ngôn ngữ nào?',
      'Gợi ý cho người mới bắt đầu:\n✅ JavaScript - nếu bạn quan tâm web\n✅ Python - nếu bạn muốn dễ hiểu\n✅ Java - nếu bạn muốn lập trình hệ thống\n\nCác lỗi debug trong mỗi ngôn ngữ có sự khác nhau. Bạn đang học ngôn ngữ nào?',
      'Mỗi bài tập trên BugHunter có:\n• Mã source code\n• Mô tả lỗi\n• Lỗi cần tìm\n• Ngôn ngữ được hỗ trợ\n\nBạn có thể filter theo ngôn ngữ yêu thích. Bắt đầu từ ngôn ngữ bạn biết nhé!'
    ]
  },

  // 7. Common Errors
  {
    category: 'common_errors',
    language: 'vi',
    patterns: [
      'null', 'undefined', 'nan', 'reference error', 'syntax error', 'type error',
      'off by one', 'infinite loop', 'stack overflow', 'không xác định', 'không phải số'
    ],
    responses: [
      'Những lỗi phổ biến nhất:\n\n🔴 Null/Undefined - biến chưa được gán giá trị\n   Cách sửa: Kiểm tra biến trước khi dùng\n\n🔴 Off-by-One - vòng lặp lặp sai số lần\n   Cách sửa: Kiểm tra điều kiện loop\n\n🔴 Syntax Error - viết code sai cú pháp\n   Cách sửa: Đọc thông báo lỗi kỹ\n\n🔴 Type Error - dùng kiểu dữ liệu sai\n   Cách sửa: Kiểm tra typeof của biến\n\nBạn gặp lỗi nào?',
      'Lỗi Null/Undefined rất phổ biến! 👀\n\nNguyên nhân:\n• Quên khởi tạo biến\n• Lấy property không tồn tại\n• Hàm không return giá trị\n\nCách debug:\n1. Thêm console.log() trước khi dùng\n2. Kiểm tra typeof\n3. Dùng optional chaining (?.) \n4. Thêm default value\n\nCố gắng nha!',
      'Infinite Loop (Vòng lặp vô tận) - một lỗi nguy hiểm!\n\nNguyên nhân:\n• Điều kiện loop không bao giờ false\n• Biến counter không thay đổi\n• Logic sai\n\nCách tránh:\n1. Luôn có break point\n2. Tăng/giảm counter\n3. Kiểm tra điều kiện exit\n\nLuôn kiểm tra vòng lặp kỹ!'
    ]
  },

  // 8. Website Features
  {
    category: 'features',
    language: 'vi',
    patterns: [
      'cách dùng', 'hướng dẫn', 'feature', 'tính năng', 'làm gì', 'ở đâu',
      'không tìm thấy', 'không hiểu', 'menu nào', 'button nào', 'làm sao'
    ],
    responses: [
      'BugHunter có những tính năng chính:\n\n🎯 Thử Thách - Luyện tập debug\n📊 Bảng Xếp Hạng - So sánh với cộng đồng\n👤 Hồ Sơ - Xem thống kê cá nhân\n⚙️ Cài Đặt - Tuỳ chỉnh trải nghiệm\n💬 Chat AI - Nhận hỗ trợ (chính là tôi!)\n\nCần giúp gì về các tính năng này?',
      'Hướng dẫn nhanh sử dụng BugHunter:\n\n1️⃣ Đăng nhập/Đăng ký\n2️⃣ Vào "Thử thách" chọn bài\n3️⃣ Đọc mô tả và code\n4️⃣ Tìm và sửa lỗi\n5️⃣ Submit kết quả\n6️⃣ Xem tiến độ trên bảng xếp hạng\n\nBạn cần hỗ trợ ở bước nào?',
      'Các tính năng chính:\n• Admin có thể tạo bài tập\n• User có thể làm bài tập\n• Hệ thống tự chấm điểm\n• Theo dõi tiến độ\n• So sánh với người khác\n• Nhận huy hiệu thành tích\n\nMọi người đều có thể dùng và luyện tập!'
    ]
  },

  // 9. Motivation & Encouragement
  {
    category: 'motivation',
    language: 'vi',
    patterns: [
      'khó', 'bỏ cuộc', 'không thể', 'tôi kém', 'không hiểu', 'quá khó',
      'tôi thất bại', 'mất tinh thần', 'nản', 'mệt mỏi'
    ],
    responses: [
      'Tôi hiểu bạn cảm thấy khó! Nhưng đây là điều bình thường khi học lập trình. 💪\n\n💡 Mẹo:\n• Bắt đầu từ bài dễ\n• Hoàn thành 1-2 bài mỗi ngày\n• Không bỏ cuộc khi gặp khó\n• Lỗi là cơ hội học tập\n• Hỏi khi không hiểu\n\nBạn sắp hiểu thôi! Tiếp tục nha! 🚀',
      'Đừng nản! 😊 Mọi lập trình viên đều bắt đầu từ đây.\n\nChuyện thực tế:\n• Tất cả đều gặp lỗi\n• Ngay cả các chuyên gia cũng debug hàng giờ\n• Lỗi = Học tập\n• Bạn đang tiến bộ mỗi ngày\n\nHãy tiếp tục! Bạn đang làm rất tốt! 🎉',
      'Nếu quá khó, bạn có thể:\n1. Lấy bài dễ hơn\n2. Xem hướng dẫn chi tiết\n3. Hỏi tôi từng bước một\n4. Nghỉ ngơi rồi quay lại\n5. Tham gia cộng đồng\n\nMỗi bước nhỏ đều quan trọng. Bạn là tốt nhất! ⭐'
    ]
  },

  // 10. Problem Solving
  {
    category: 'problem_solving',
    language: 'vi',
    patterns: [
      'cách giải quyết', 'chiến lược', 'phương pháp', 'cách tốt', 'best practice',
      'tối ưu', 'nhanh hơn', 'tốt hơn', 'làm sao nhanh'
    ],
    responses: [
      'Chiến lược giải quyết vấn đề hiệu quả:\n\n1️⃣ Hiểu vấn đề\n   • Đọc kỹ mô tả\n   • Xác định input/output\n\n2️⃣ Tìm nguyên nhân\n   • Isolate vấn đề\n   • Debug từng phần\n\n3️⃣ Thử giải pháp\n   • Sửa code\n   • Kiểm tra\n\n4️⃣ Xác minh\n   • Test với nhiều case\n   • So sánh kết quả\n\nThực hiện tuần tự sẽ tìm được lỗi nhanh hơn!',
      'Best practices khi debug:\n\n✅ Chia vấn đề thành phần nhỏ\n✅ Test từng phần riêng lẻ\n✅ Viết test cases\n✅ Ghi log chi tiết\n✅ Kiểm tra edge cases\n✅ Đọc code một cách hệ thống\n\nNhớ: "Divide and conquer" là chìa khóa!',
      'Khi gặp lỗi lạ:\n1. Google lỗi đó\n2. Đọc stack trace\n3. Tìm dòng gây lỗi\n4. Thêm log xung quanh dòng đó\n5. Tìm pattern\n6. Sửa và test\n\nLỗi không bao giờ là vô lý - luôn có lý do!'
    ]
  }
]

// English Training Data
export const enTrainingData: TrainingData[] = [
  // Similar structure for English
  {
    category: 'greeting',
    language: 'en',
    patterns: [
      'hello', 'hi', 'hey', 'greetings', 'start', 'begin', 'help me', 'support',
      'assistant', 'chat', 'talk', 'need help'
    ],
    responses: [
      'Hello! 👋 I\'m BugHunter\'s AI assistant. I\'m ready to help you learn debugging, solve errors, or answer programming questions. What do you need?',
      'Hi there! 😊 I can help you with debugging exercises, website guidance, or programming questions.',
      'Hello! I\'m glad to support your programming learning journey. What can I help you with?'
    ]
  },

  {
    category: 'debugging',
    language: 'en',
    patterns: [
      'debug', 'error', 'bug', 'fix', 'not working', 'issue', 'problem',
      'how to debug', 'find bug', 'code broken', 'program crashes'
    ],
    responses: [
      'To debug effectively, follow these steps:\n1. Read the error message carefully - it often tells you where the problem is\n2. Use console.log() or debugger to track variable values\n3. Break the problem into smaller parts\n4. Check your assumptions and logic\n5. Google the error if you don\'t understand\n\nWhat specific error are you facing?',
      'Here are effective debugging tips:\n• Use console.log() to print values at important points\n• Set breakpoints in the debugger to pause execution\n• Read stack trace from bottom to top\n• Try separating code into smaller functions\n• Write tests to verify each part\n\nNeed help with a specific error?',
      'Quick debugging tip: Find the most recent change you made. The bug usually appears near what you just modified! 🎯'
    ]
  }
]

// Function to find best matching response
export const findBestMatch = (
  userMessage: string,
  trainingData: TrainingData[]
): string => {
  const lowerMessage = userMessage.toLowerCase().trim()
  
  // Find matching training data by patterns
  for (const data of trainingData) {
    for (const pattern of data.patterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        // Return random response from this category
        const responses = data.responses
        return responses[Math.floor(Math.random() * responses.length)]
      }
    }
  }
  
  return null as any // No match found
}

// Function to improve AI response based on user feedback
export const improveTraining = (
  userMessage: string,
  rating: 'good' | 'bad',
  category: string
): void => {
  // This can be extended to track which responses work best
  console.log(`Training update: "${userMessage}" rated as ${rating} for ${category}`)
  // In production, this would update a database or ML model
}

// Calculate user level based on challenges completed
export const calculateUserLevel = (challengesCompleted: number): AIContext['userLevel'] => {
  if (challengesCompleted < 5) return 'beginner'
  if (challengesCompleted < 20) return 'intermediate'
  return 'advanced'
}
