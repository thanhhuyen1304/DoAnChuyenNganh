# 🧠 Hướng Dẫn Training Data cho ChatBox AI

## 📋 Tổng Quan

Hệ thống Training Data cho phép bạn tự train ChatBox AI bằng cách thêm các cặp câu hỏi-câu trả lời. Khi người dùng hỏi, AI sẽ tự động tìm các training data liên quan và sử dụng chúng làm context để trả lời chính xác hơn.

## 🎯 Cách Hoạt Động

1. **Admin thêm Training Data**: Câu hỏi và câu trả lời mẫu
2. **AI tìm kiếm**: Khi user hỏi, hệ thống tự động tìm training data liên quan
3. **Context Injection**: Training data được inject vào prompt của AI
4. **AI trả lời**: AI sử dụng training data làm tham khảo để trả lời

## 🚀 Sử Dụng

### 1. Truy Cập Training Data Management

1. Đăng nhập với tài khoản Admin
2. Vào Admin Dashboard
3. Chọn tab **"Training Data AI"** (icon Brain 🧠)

### 2. Thêm Training Data

1. Click nút **"Thêm mới"**
2. Điền thông tin:
   - **Câu hỏi / Keyword**: Câu hỏi hoặc từ khóa (ví dụ: "Làm sao debug lỗi?")
   - **Câu trả lời**: Câu trả lời mẫu (có thể dài, chi tiết)
   - **Danh mục**: Phân loại (ví dụ: "programming", "debugging", "javascript")
   - **Tags**: Từ khóa bổ sung, phân cách bằng dấu phẩy (ví dụ: "javascript, error, console")
   - **Độ ưu tiên**: 1-10 (cao hơn = ưu tiên hơn khi tìm kiếm)
3. Click **"Lưu"**

### 3. Quản Lý Training Data

- **Tìm kiếm**: Tìm theo câu hỏi, câu trả lời, hoặc tags
- **Lọc theo danh mục**: Chọn danh mục cụ thể
- **Chỉnh sửa**: Click icon Edit để sửa
- **Xóa**: Click icon Trash để xóa
- **Export**: Tải về file JSON
- **Import**: Upload file JSON để import hàng loạt

## 📝 Ví Dụ Training Data

### Ví dụ 1: Câu hỏi về Debug

**Câu hỏi**: "Làm sao debug lỗi JavaScript?"

**Câu trả lời**: 
```
Để debug lỗi JavaScript, bạn có thể:

1. Sử dụng console.log() để in giá trị biến
2. Sử dụng debugger statement để dừng code
3. Sử dụng DevTools của trình duyệt (F12)
4. Kiểm tra Network tab để xem API calls
5. Sử dụng breakpoints trong DevTools

Ví dụ:
```javascript
console.log('Variable value:', myVariable);
debugger; // Code sẽ dừng ở đây
```
```

**Danh mục**: `debugging`
**Tags**: `javascript, debug, console, error`
**Độ ưu tiên**: `8`

### Ví dụ 2: Câu hỏi về React

**Câu hỏi**: "React hooks là gì?"

**Câu trả lời**: 
```
React Hooks là các functions cho phép bạn sử dụng state và các tính năng React khác trong functional components.

Các hooks phổ biến:
- useState: Quản lý state
- useEffect: Side effects (API calls, subscriptions)
- useContext: Truy cập context
- useReducer: Quản lý state phức tạp

Ví dụ:
```javascript
import { useState, useEffect } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```
```

**Danh mục**: `react`
**Tags**: `react, hooks, useState, useEffect`
**Độ ưu tiên**: `7`

## 📊 Cấu Trúc Training Data

```json
{
  "question": "Câu hỏi hoặc keyword",
  "answer": "Câu trả lời chi tiết",
  "category": "programming",
  "tags": ["javascript", "debug"],
  "priority": 5,
  "isActive": true
}
```

## 🔍 Tìm Kiếm Training Data

Hệ thống tìm kiếm training data dựa trên:
1. **Keyword matching**: Tìm trong câu hỏi và câu trả lời
2. **Tag matching**: Tìm trong tags
3. **Priority**: Ưu tiên training data có priority cao hơn
4. **Usage count**: Training data được dùng nhiều sẽ được ưu tiên

## 💡 Best Practices

1. **Câu hỏi ngắn gọn**: Sử dụng từ khóa hoặc câu hỏi ngắn
2. **Câu trả lời chi tiết**: Viết câu trả lời đầy đủ, có ví dụ code
3. **Tags đầy đủ**: Thêm nhiều tags liên quan
4. **Priority hợp lý**: 
   - Priority 8-10: Câu hỏi quan trọng, thường gặp
   - Priority 5-7: Câu hỏi thông thường
   - Priority 1-4: Câu hỏi ít gặp
5. **Danh mục rõ ràng**: Phân loại đúng để dễ quản lý

## 📦 Import/Export

### Export Training Data

1. Click nút **"Export"**
2. File JSON sẽ được tải về
3. Có thể chỉnh sửa và import lại

### Import Training Data

1. Chuẩn bị file JSON với format:
```json
[
  {
    "question": "Câu hỏi 1",
    "answer": "Câu trả lời 1",
    "category": "general",
    "tags": ["tag1", "tag2"],
    "priority": 5
  },
  {
    "question": "Câu hỏi 2",
    "answer": "Câu trả lời 2",
    "category": "programming",
    "tags": ["tag3"],
    "priority": 7
  }
]
```

2. Click nút **"Import"**
3. Chọn file JSON
4. Hệ thống sẽ import tất cả training data

## 🎓 Ví Dụ Training Data Mẫu

Tạo file `training-data-sample.json`:

```json
[
  {
    "question": "Làm sao debug lỗi?",
    "answer": "Để debug lỗi, bạn có thể:\n1. Sử dụng console.log()\n2. Sử dụng debugger\n3. Kiểm tra DevTools",
    "category": "debugging",
    "tags": ["debug", "error", "javascript"],
    "priority": 8
  },
  {
    "question": "React là gì?",
    "answer": "React là một thư viện JavaScript để xây dựng user interfaces...",
    "category": "react",
    "tags": ["react", "javascript", "frontend"],
    "priority": 7
  },
  {
    "question": "Cách sử dụng useState?",
    "answer": "useState là một React Hook để quản lý state...",
    "category": "react",
    "tags": ["react", "hooks", "useState"],
    "priority": 6
  }
]
```

## 🔧 API Endpoints

### GET `/api/training-data`
Lấy danh sách training data (có pagination và filters)

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số lượng mỗi trang (default: 20)
- `search`: Tìm kiếm
- `category`: Lọc theo danh mục
- `isActive`: Lọc theo trạng thái

### POST `/api/training-data` (Admin only)
Tạo training data mới

**Body:**
```json
{
  "question": "Câu hỏi",
  "answer": "Câu trả lời",
  "category": "general",
  "tags": ["tag1", "tag2"],
  "priority": 5
}
```

### PUT `/api/training-data/:id` (Admin only)
Cập nhật training data

### DELETE `/api/training-data/:id` (Admin only)
Xóa training data

### POST `/api/training-data/bulk-import` (Admin only)
Import hàng loạt

**Body:**
```json
{
  "trainingData": [
    { "question": "...", "answer": "...", ... },
    { "question": "...", "answer": "...", ... }
  ]
}
```

### GET `/api/training-data/export`
Export training data

### GET `/api/training-data/categories`
Lấy danh sách categories

## 📈 Thống Kê

- **Usage Count**: Số lần training data được sử dụng
- **Rating**: Đánh giá chất lượng (1-5)
- **Priority**: Độ ưu tiên khi tìm kiếm

## 🎯 Tips

1. **Bắt đầu với 10-20 training data** về các chủ đề phổ biến
2. **Theo dõi Usage Count** để biết training data nào hữu ích
3. **Cập nhật thường xuyên** dựa trên feedback từ users
4. **Sử dụng tags đầy đủ** để tìm kiếm chính xác hơn
5. **Priority cao cho câu hỏi thường gặp**

## 🚀 Next Steps

- [ ] Thêm vector search (semantic search) thay vì keyword matching
- [ ] Thêm auto-learning từ chat history
- [ ] Thêm A/B testing cho training data
- [ ] Thêm analytics và insights

