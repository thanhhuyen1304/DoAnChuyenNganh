# 🤖 Hướng Dẫn Cấu Hình ChatBox AI

## 📋 Tổng Quan

ChatBox AI là một tính năng chat giống ChatGPT, được tích hợp vào tất cả các trang của website BugHunter. ChatBox sử dụng AI (Gemini hoặc OpenAI) để trả lời các câu hỏi về lập trình, debug code, và hỗ trợ học tập.

## ✨ Tính Năng

- ✅ Chat AI thông minh giống ChatGPT
- ✅ Hỗ trợ Markdown và code highlighting
- ✅ Lưu lịch sử chat vào database
- ✅ Sidebar để quản lý các cuộc trò chuyện
- ✅ Copy code với một click
- ✅ UI/UX đẹp, responsive
- ✅ Hiển thị trên tất cả các trang

## 🚀 Cài Đặt

### 1. Cấu Hình Backend

Thêm các biến môi trường vào file `server/.env`:

```env
# AI Provider Configuration
# Chọn một trong hai: 'gemini' hoặc 'openai'
AI_PROVIDER=gemini

# Gemini API (nếu dùng Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API (nếu dùng OpenAI)
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Lấy API Key

#### Option 1: Gemini (Miễn phí, khuyến nghị)

1. Truy cập: https://aistudio.google.com
2. Đăng nhập với tài khoản Google
3. Click "Get API Key"
4. Tạo API key mới hoặc sử dụng key hiện có
5. Copy API key và thêm vào `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Option 2: OpenAI (Có phí)

1. Truy cập: https://platform.openai.com
2. Đăng ký/Đăng nhập
3. Vào API Keys section
4. Tạo API key mới
5. Copy API key và thêm vào `.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Khởi Động Server

```bash
cd server
npm run dev
```

Server sẽ tự động tạo collection `chathistories` trong MongoDB khi có request đầu tiên.

## 📡 API Endpoints

### POST `/api/chat/message`

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
  "chatId": "optional_chat_id" // Nếu không có, sẽ tạo chat mới
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

### GET `/api/chat/histories`

Lấy danh sách tất cả cuộc trò chuyện của user.

**Headers:**
```
Authorization: Bearer <token>
```

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
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
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

### GET `/api/chat/history/:chatId`

Lấy chi tiết một cuộc trò chuyện.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "chat_id",
    "title": "Làm sao để debug...",
    "messages": [
      {
        "role": "user",
        "content": "Làm sao để debug lỗi?",
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Để debug lỗi...",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE `/api/chat/history/:chatId`

Xóa một cuộc trò chuyện.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa cuộc trò chuyện"
}
```

## 🎨 Sử Dụng Frontend

ChatBox đã được tích hợp tự động vào tất cả các trang thông qua `App.tsx`. Không cần cấu hình thêm.

### Tính Năng UI

1. **Nút Chat**: Nút tròn ở góc dưới bên phải màn hình
2. **Sidebar**: Click vào icon Menu để mở sidebar lịch sử chat
3. **New Chat**: Click vào icon Plus để bắt đầu cuộc trò chuyện mới
4. **Copy Code**: Hover vào code block và click icon Copy
5. **Markdown Support**: Hỗ trợ đầy đủ Markdown, bao gồm:
   - Headers
   - Lists
   - Code blocks với syntax highlighting
   - Inline code
   - Links
   - Tables (GFM)

## 🔧 Troubleshooting

### Lỗi: "GEMINI_API_KEY chưa được cấu hình"

**Giải pháp:**
1. Kiểm tra file `server/.env` có chứa `GEMINI_API_KEY`
2. Restart server sau khi thêm API key
3. Kiểm tra API key có hợp lệ không

### Lỗi: "Chưa đăng nhập"

**Giải pháp:**
- ChatBox yêu cầu user phải đăng nhập
- Đảm bảo user đã login và có token trong localStorage

### Lỗi: "Lỗi khi gọi Gemini API"

**Giải pháp:**
1. Kiểm tra API key có đúng không
2. Kiểm tra kết nối internet
3. Kiểm tra quota của Gemini API (có thể đã hết)
4. Xem log trong console để biết lỗi cụ thể

### Code không highlight

**Giải pháp:**
- Đảm bảo đã cài đặt `highlight.js`:
  ```bash
  cd client
  npm install highlight.js
  ```

## 📊 Database Schema

### ChatHistory Model

```typescript
{
  userId: ObjectId, // Reference to User
  messages: [
    {
      role: 'user' | 'assistant' | 'system',
      content: string,
      timestamp: Date
    }
  ],
  title: string, // Auto-generated from first message
  createdAt: Date,
  updatedAt: Date
}
```

## 💡 Tips

1. **Sử dụng Gemini**: Miễn phí và đủ mạnh cho hầu hết các trường hợp
2. **Lưu lịch sử**: Tất cả cuộc trò chuyện được lưu tự động
3. **Code Highlighting**: Hỗ trợ nhiều ngôn ngữ lập trình
4. **Markdown**: Sử dụng Markdown để format câu trả lời đẹp hơn

## 🎯 Next Steps

- [ ] Thêm streaming response (typing effect)
- [ ] Thêm export chat history
- [ ] Thêm search trong chat history
- [ ] Thêm voice input
- [ ] Thêm file upload (code, images)

## 📝 Notes

- ChatBox chỉ hoạt động khi user đã đăng nhập
- API key nên được bảo mật, không commit vào git
- Thêm `.env` vào `.gitignore`
- Monitor API usage để tránh vượt quota

