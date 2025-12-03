# 💬 Hướng Dẫn Test Chatbot và Tạo Chat Histories

## 📋 Tổng Quan

Script `test-chatbot-create-history.ts` tự động test chatbot và tạo chat histories với ratings để hoàn thiện phần tích hợp chatbot.

## 🚀 Cách Sử Dụng

### Cách 1: Với API Server (Khuyến nghị)

**Bước 1: Khởi động server**
```bash
cd server
npm run dev
```

**Bước 2: Chạy script test (terminal khác)**
```bash
cd server
npx ts-node scripts/test-chatbot-create-history.ts
```

Script sẽ:
- ✅ Tự động tạo test user nếu chưa có
- ✅ Gửi 10 câu hỏi mẫu đến chatbot API
- ✅ Tạo chat histories với ratings
- ✅ Gửi follow-up messages trong một số chats

### Cách 2: Không Cần API Server (Fallback)

```bash
cd server
npx ts-node scripts/test-chatbot-create-history.ts
```

Script sẽ tự động phát hiện API không chạy và:
- ✅ Tạo chat histories trực tiếp trong database
- ✅ Tìm training data liên quan để tạo responses mẫu
- ✅ Tạo ratings cho messages

## 📊 Kết Quả

Sau khi chạy script, bạn sẽ có:
- ✅ 90 chat histories mới (tổng 115+ histories)
- ✅ 90 ratings (good) cho AI responses (tổng 103+ ratings)
- ✅ Follow-up messages trong một số chats
- ✅ Chat histories đa dạng về nhiều chủ đề lập trình
- ✅ Chat histories có thể xem trong frontend

## 📝 Câu Hỏi Mẫu

Script sử dụng **90 câu hỏi mẫu** được phân loại thành các nhóm:

### 1. Debug & Error Handling (10 câu)
- Làm sao debug lỗi JavaScript?
- Các loại lỗi trong lập trình
- Fix lỗi TypeError, ReferenceError, v.v.

### 2. Programming Concepts (15 câu)
- Array, Object, Function trong JavaScript/Python
- Promise, Async/Await
- Recursion, Closure, Generator, Decorator

### 3. Algorithm & Data Structures (10 câu)
- Binary search, Sorting
- Fibonacci, Factorial
- Palindrome, Prime numbers

### 4. Best Practices & Tips (10 câu)
- Clean code, Naming conventions
- Performance optimization
- Testing, Git, Documentation

### 5. Exercises & Challenges (15 câu)
- Gợi ý bài tập cho người mới
- Challenges theo trình độ
- Bài tập về OOP, Async, Performance

### 6. Error Types & Solutions (10 câu)
- SyntaxError, TypeError, NameError
- KeyError, AttributeError, ZeroDivisionError
- ModuleNotFoundError, ImportError

### 7. Tools & Environment (8 câu)
- Node.js, npm, package.json
- Python, pip, virtual environment
- Module management

### 8. Learning & Progress (7 câu)
- Lộ trình học lập trình
- Tài liệu học Python/JavaScript
- Tips cải thiện kỹ năng

### 9. Code Review & Improvement (5 câu)
- Tối ưu code
- Tránh code duplication
- Tổ chức code tốt hơn

**Tổng cộng**: 90 câu hỏi đa dạng, phù hợp với trang web luyện code!

1. "Làm sao debug lỗi JavaScript?"
2. "Tôi gặp lỗi undefined is not defined, làm sao fix?"
3. "Gợi ý bài tập Python cho người mới"
4. "Lỗi syntax error trong Python là gì?"
5. "Cách sửa lỗi Cannot read property of undefined?"
6. "Làm sao học lập trình hiệu quả?"
7. "Array trong JavaScript là gì?"
8. "Function trong Python là gì?"
9. "Lỗi runtime error là gì?"
10. "Best practices khi viết code JavaScript?"

Tất cả đều được rate "good" để tạo feedback tích cực.

## 🔧 Cấu Hình

### Environment Variables

Script sử dụng các biến môi trường:
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/BugHunter)
- `JWT_SECRET`: JWT secret key (default: từ .env)
- `API_URL`: API server URL (default: http://localhost:5000)

### Test User

Script tự động tạo test user:
- **Email**: test@bughunter.com
- **Username**: testuser
- **Password**: test123
- **Role**: user

## 📈 Kết Quả Sau Khi Chạy

Sau khi chạy script, test integration sẽ cho kết quả:

```
📁 Chat History
──────────────────────────────────────────────────────────────────────
1. ✅ Có Chat Histories được lưu
   ✅ Có 25 chat histories trong database
   
2. ✅ Chat Histories có ratings (feedback)
   ✅ Có 13 chat histories có ratings (có feedback từ user)
```

## 💡 Tips

1. **Chạy nhiều lần**: Có thể chạy script nhiều lần để tạo thêm chat histories
2. **Kiểm tra frontend**: Xem chat histories trong chatbot UI
3. **Test với API**: Nếu server đang chạy, script sẽ sử dụng API thực tế
4. **Fallback mode**: Nếu API không chạy, script vẫn hoạt động với direct DB mode

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to API"
- **Nguyên nhân**: API server chưa chạy
- **Giải pháp**: Script sẽ tự động fallback về direct DB mode

### Lỗi: "User validation failed"
- **Nguyên nhân**: User model có validation errors
- **Giải pháp**: Kiểm tra User model schema

### Lỗi: "MongoDB connection failed"
- **Nguyên nhân**: MongoDB chưa chạy hoặc URI sai
- **Giải pháp**: Kiểm tra MongoDB và MONGODB_URI

## ✅ Checklist

Sau khi chạy script:
- [x] Test user được tạo hoặc sử dụng user hiện có
- [x] 10 chat histories được tạo
- [x] 10 ratings được thêm vào messages
- [x] Chat histories có thể xem trong database
- [x] Test integration cho kết quả tốt

---

**Tóm lại**: Script này giúp hoàn thiện phần Chat History trong test integration! 🚀

