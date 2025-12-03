# Hướng Dẫn ChatBox Hoàn Chỉnh - BugHunter

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cài Đặt và Cấu Hình](#cài-đặt-và-cấu-hình)
3. [Testing Guide](#testing-guide)
4. [Demo Flow](#demo-flow)
5. [Troubleshooting](#troubleshooting)

---

## Tổng Quan

ChatBox AI là một tính năng chat thông minh giống ChatGPT, được tích hợp vào tất cả các trang của website BugHunter.

### ✨ Tính Năng

- ✅ Chat AI thông minh với Gemini Pro
- ✅ Hỗ trợ Markdown và code highlighting
- ✅ Lưu lịch sử chat vào database
- ✅ Sidebar quản lý các cuộc trò chuyện
- ✅ Copy code với một click
- ✅ Rating system (👍/👎)
- ✅ Adaptive Learning (tự động học từ người dùng)
- ✅ UI/UX đẹp, responsive
- ✅ Hiển thị trên tất cả các trang

### 🎯 Hybrid AI Strategy

```
Người dùng hỏi câu hỏi
         ↓
   [Hybrid Strategy]
   ├─ Layer 1: Adaptive Learning (nhanh, free) ✅
   ├─ Layer 2: Training Data (nhanh, free) ✅
   └─ Layer 3: Gemini Pro (chính xác, có phí) ✅
         ↓
    AI trả lời + Tag nguồn
```

---

## Cài Đặt và Cấu Hình

### 🚀 Quick Setup

#### Bước 1: Lấy Gemini API Key

1. Truy cập: https://aistudio.google.com
2. Đăng nhập với Google account
3. Click "Get API Key"
4. Copy API key

#### Bước 2: Cấu Hình Environment Variables

**File: `client/.env.local`**
```env
REACT_APP_GEMINI_API_KEY=your-api-key-here
```

**File: `server/.env`**
```env
# AI Provider Configuration
AI_PROVIDER=gemini

# Gemini API
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

#### Bước 3: Khởi Động Server

```bash
# Server
cd server
npm run dev

# Client
cd client
npm run dev
```

### 📡 API Endpoints

#### POST `/api/chat/message`

Gửi tin nhắn và nhận phản hồi từ AI.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Làm sao để debug lỗi trong JavaScript?",
  "chatId": "optional_chat_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "chat_id",
    "message": {
      "role": "assistant",
      "content": "Để debug lỗi trong JavaScript...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET `/api/chat/histories`

Lấy danh sách tất cả cuộc trò chuyện.

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng mỗi trang (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chatId": "chat_id",
        "title": "Làm sao để debug...",
        "preview": "Để debug lỗi...",
        "messageCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

#### GET `/api/chat/history/:chatId`

Lấy chi tiết một cuộc trò chuyện.

#### DELETE `/api/chat/history/:chatId`

Xóa một cuộc trò chuyện.

#### POST `/api/chat/rate`

Đánh giá một AI message.

**Body:**
```json
{
  "chatId": "chat_id",
  "messageIndex": 0,
  "rating": "good" // hoặc "bad"
}
```

### 🎨 Tính Năng UI

1. **Nút Chat**: Nút tròn ở góc dưới bên phải màn hình
2. **Sidebar**: Click icon Menu để mở sidebar lịch sử chat
3. **New Chat**: Click icon Plus để bắt đầu cuộc trò chuyện mới
4. **Copy Code**: Hover vào code block và click icon Copy
5. **Rating**: Click 👍 hoặc 👎 để đánh giá response
6. **Statistics**: Click 📊 để xem thống kê AI
7. **Markdown Support**: Hỗ trợ đầy đủ Markdown:
   - Headers
   - Lists
   - Code blocks với syntax highlighting
   - Inline code
   - Links
   - Tables (GFM)

### 📊 Database Schema

```typescript
{
  userId: ObjectId,
  messages: [
    {
      role: 'user' | 'assistant' | 'system',
      content: string,
      timestamp: Date,
      rating?: 'good' | 'bad',
      source?: 'gemini' | 'adaptive' | 'training'
    }
  ],
  title: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing Guide

### ✅ Kiểm Tra ChatBox Hoạt Động

#### BƯỚC 1: Mở Browser DevTools

```
Nhấn: F12
Hoặc: Click chuột phải → Inspect
Chọn tab: Console
```

#### BƯỚC 2: Chạy Test Script

Copy-paste đoạn code này vào Console:

```javascript
// TEST 1: Kiểm tra API Config
console.log('🔑 API Key:', import.meta.env.VITE_GEMINI_API_KEY)
console.log('API Key exists:', !!import.meta.env.VITE_GEMINI_API_KEY)

// TEST 2: Test Gemini Connection
const apiKey = import.meta.env.VITE_GEMINI_API_KEY
if (apiKey) {
  fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'xin chào' }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
    })
  })
  .then(r => r.json())
  .then(d => {
    if (d.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('✅ Gemini API Works!', d.candidates[0].content.parts[0].text.substring(0, 50))
    } else {
      console.log('❌ API Error:', d.error?.message)
    }
  })
  .catch(e => console.error('❌ Connection error:', e.message))
} else {
  console.error('❌ API Key not found!')
}

// TEST 3: Kiểm tra ChatBox element
const chatBtn = document.querySelector('button[aria-label="Open chat"]')
console.log('ChatBox button:', chatBtn ? '✅ Found' : '❌ Not found')

// TEST 4: Kiểm tra AdaptiveAI
const aiData = localStorage.getItem('bughunter_ai_learning_data')
console.log('AdaptiveAI data:', aiData ? '✅ Exists' : '❌ Empty')
```

**Kết quả mong đợi:**
```
🔑 API Key: AIzaSyBTxBfo_0ftnLo...
API Key exists: true
✅ Gemini API Works! Xin chào! Tôi là một trợ lý...
ChatBox button: ✅ Found
AdaptiveAI data: ✅ Exists
```

#### BƯỚC 3: Test ChatBox UI

##### 3.1 Tìm ChatBox Button
```
Nhìn góc PHẢI DƯỚI cùng của trang
Bạn sẽ thấy một nút màu gradient (hồng - tím - xanh)
Click vào nó
```

##### 3.2 Test Mở/Đóng
```
✅ Click nút → ChatBox mở
✅ Thấy "Welcome message" từ bot
✅ Click X → ChatBox đóng
```

##### 3.3 Test Nhắn Tin
```
1. Mở ChatBox
2. Gõ: "xin chào"
3. Nhấn Enter hoặc click Send
4. Chờ ~2-3 giây
5. Bot trả lời?
   ✅ YES = Hoạt động!
   ❌ NO = Có lỗi
```

##### 3.4 Test Đánh Giá
```
1. Mở ChatBox
2. Gõ câu hỏi
3. Nhìn response từ bot
4. Click 👍 hoặc 👎
5. Kiểm tra stats (click 📊)
   ✅ Số lượng tăng = Hoạt động!
```

##### 3.5 Test Statistics
```
1. Mở ChatBox
2. Click nút 📊 ở dưới cùng
3. Bạn sẽ thấy:
   ✓ Tổng câu hỏi: X
   👍 Tốt: Y
   👎 Tệ: Z
   📊 Độ chính xác: W%
   🧠 Đã học: N patterns
   ⚡ Nguồn: Gemini/Adaptive/Training
```

### 🐛 Troubleshooting

#### Lỗi 1: "Lỗi khi gửi tin nhắn"
```
Nguyên nhân: API Key sai hoặc hết hạn
Giải pháp:
1. Kiểm tra .env.local có key không
2. Test API connection bằng console script
3. Lấy key mới từ https://aistudio.google.com
```

#### Lỗi 2: "Timeout"
```
Nguyên nhân: API chậm hoặc không kết nối
Giải pháp:
1. Kiểm tra internet
2. Thử hỏi câu hỏi ngắn hơn
3. Check rate limit (60 req/min)
```

#### Lỗi 3: "ChatBox không hiện"
```
Nguyên nhân: Import lỗi hoặc z-index
Giải pháp:
1. Mở DevTools F12
2. Kiểm tra Console có lỗi gì
3. Reload trang
```

#### Lỗi 4: "ChatBox không trả lời"
```
Nguyên nhân: Gemini API fail → Fallback to training data
Giải pháp:
1. Check console for errors
2. Kiểm tra API key valid
3. Try simple question: "hello"
```

### 📊 Xem Chi Tiết Responses

#### Kiểm tra Console Network

```
1. Mở DevTools → Network tab
2. Gõ câu hỏi trong ChatBox
3. Bạn sẽ thấy request:
   POST: generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
   
4. Click vào request
5. Tab Response: Xem AI response
6. Status: 200 OK = Success
```

---

## Demo Flow

### 🎬 User Journey Demo

#### 1. First Time User

```
User vào trang → Thấy ChatBox button (góc phải dưới)
→ Click mở ChatBox
→ Thấy welcome message từ AI
→ Hỏi: "BugHunter là gì?"
→ AI trả lời về platform (dùng Training Data)
→ Tag: 📚 Training Data
```

#### 2. Technical Question

```
User hỏi: "Làm sao debug lỗi JavaScript?"
→ AI tìm trong Adaptive Learning (không có)
→ AI tìm trong Training Data (có!)
→ AI trả lời với training data
→ Tag: 📚 Training Data
→ User click 👍 (Tốt)
→ System lưu vào Adaptive Learning
```

#### 3. Complex Question

```
User hỏi: "Giải thích về async/await trong JavaScript"
→ AI không tìm thấy trong Adaptive/Training
→ Fallback to Gemini Pro
→ Gemini Pro trả lời chi tiết
→ Tag: ⚡ Gemini Pro
→ User click 👍
→ System lưu vào Adaptive Learning
```

#### 4. Next Time

```
User khác hỏi: "async await là gì?"
→ AI tìm thấy trong Adaptive Learning! (từ câu trước)
→ AI trả lời nhanh với learned data
→ Tag: 🧠 Adaptive Learning
→ Tiết kiệm API call!
```

### 📊 Statistics Demo

```
User click 📊 Statistics:

📊 Thống kê AI Learning:
━━━━━━━━━━━━━━━━━━━━━
✓ Tổng câu hỏi: 50
👍 Tốt: 45 (90%)
👎 Tệ: 5 (10%)
📊 Độ chính xác: 90%
🧠 Đã học: 120 patterns

⚡ Nguồn Response:
- Gemini Pro: 20 (40%)
- Adaptive Learning: 25 (50%)
- Training Data: 5 (10%)

💡 AI càng được dùng, càng thông minh!
```

### 🔄 Learning Cycle Demo

```
Cycle 1: "debug lỗi" → Gemini Pro → 👍 → Saved
Cycle 2: "debug error" → Adaptive (từ Cycle 1) → 👍 → Strengthened
Cycle 3: "tìm bug" → Adaptive (pattern match) → 👍 → Expanded
Cycle 4: "sửa lỗi code" → Adaptive (high confidence) → Fast response!

Result: AI learns từ 1 question → covers nhiều variations!
```

---

## 💡 Tips và Best Practices

### 1. Viết Câu Hỏi Hiệu Quả

**✅ Tốt:**
- "Làm sao debug lỗi JavaScript?"
- "React hooks là gì?"
- "Cách fix lỗi undefined?"

**❌ Không tốt:**
- "debug" (quá ngắn)
- "???" (không rõ ràng)
- "help" (quá chung chung)

### 2. Đánh Giá Responses

- 👍 **Tốt**: Response đúng, hữu ích, chi tiết
- 👎 **Không tốt**: Response sai, không liên quan, quá chung chung

### 3. Sử Dụng Statistics

- Xem statistics để hiểu AI đang học gì
- Export data để backup
- Import data khi cần restore

### 4. Training AI

- Hỏi nhiều câu hỏi khác nhau
- Đánh giá responses thường xuyên
- AI sẽ học và cải thiện theo thời gian

---

## ✨ Features Hoạt Động

### ✅ Chat Interface
- [x] Mở/đóng ChatBox
- [x] Nhắn tin
- [x] Hiển thị messages
- [x] Auto-scroll
- [x] Markdown rendering
- [x] Code highlighting
- [x] Copy code button

### ✅ AI Responses
- [x] Gemini Pro integration
- [x] Adaptive learning
- [x] Training data fallback
- [x] Response source tagging
- [x] Fast response time

### ✅ User Feedback
- [x] Rating system (👍/👎)
- [x] Statistics dashboard
- [x] Export/Import data
- [x] Clear data option

### ✅ Language Support
- [x] Vietnamese (vi)
- [x] English (en)
- [x] Auto-detect language
- [x] Context-aware responses

---

## 🚀 Next Steps

### Planned Features

1. **Streaming Response**: Typing effect cho AI responses
2. **Voice Input**: Hỏi bằng giọng nói
3. **File Upload**: Upload code files để phân tích
4. **Code Execution**: Run code trong ChatBox
5. **Multi-language Code**: Suggest code trong nhiều ngôn ngữ
6. **Search History**: Tìm kiếm trong chat history
7. **Export Chat**: Export conversations ra PDF/Markdown

---

## 🎯 Kết Luận

ChatBox đã hoạt động với đầy đủ tính năng:

- ✅ AI thông minh với Gemini Pro
- ✅ Tự động học từ người dùng (Adaptive Learning)
- ✅ Fallback với Training Data
- ✅ Rating system và statistics
- ✅ UI/UX đẹp và responsive
- ✅ Lưu lịch sử chat
- ✅ Copy code dễ dàng

**ChatBox của BugHunter sẵn sàng hỗ trợ người dùng học lập trình! 🎉**

---

**Last Updated:** 2025-12-03
**Version:** 2.0.0