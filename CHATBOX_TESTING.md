# 🧪 ChatBox Testing Guide

## ✅ Kiểm Tra ChatBox Hoạt Động

### BƯỚC 1: Mở Browser DevTools
```
Nhấn: F12
Hoặc: Click chuột phải → Inspect
Chọn tab: Console
```

### BƯỚC 2: Chạy Test Script

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

---

### BƯỚC 3: Test ChatBox UI

#### 3.1 Tìm ChatBox Button
```
Nhìn góc PHẢI DƯỚI cùng của trang
Bạn sẽ thấy một nút màu gradient (hồng - tím - xanh)
Click vào nó
```

#### 3.2 Test Mở/Đóng
```
✅ Click nút → ChatBox mở
✅ Thấy "Welcome message" từ bot
✅ Click X → ChatBox đóng
```

#### 3.3 Test Nhắn Tin
```
1. Mở ChatBox
2. Gõ: "xin chào"
3. Nhấn Enter hoặc click Send button
4. Chờ ~2-3 giây
5. Bot trả lời?
   ✅ YES = Hoạt động!
   ❌ NO = Có lỗi
```

#### 3.4 Test Đánh Giá
```
1. Mở ChatBox
2. Gõ câu hỏi
3. Nhìn response từ bot
4. Click 👍 hoặc 👎
5. Kiểm tra stats (click 📊)
   ✅ Số lượng tăng = Hoạt động!
```

#### 3.5 Test Statistics
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

---

## 🐛 Troubleshooting

### Lỗi 1: "Lỗi khi gửi tin nhắn"
```
Nguyên nhân: API Key sai hoặc hết hạn
Giải pháp:
1. Kiểm tra .env.local có key không
2. Test API connection bằng console script
3. Lấy key mới từ https://aistudio.google.com
```

### Lỗi 2: "Timeout"
```
Nguyên nhân: API chậm hoặc không kết nối
Giải pháp:
1. Kiểm tra internet
2. Thử hỏi câu hỏi ngắn hơn
3. Check rate limit (60 req/min)
```

### Lỗi 3: "ChatBox không hiện"
```
Nguyên nhân: Import lỗi hoặc z-index
Giải pháp:
1. Mở DevTools F12
2. Kiểm tra Console có lỗi gì
3. Reload trang
```

### Lỗi 4: "ChatBox không trả lời"
```
Nguyên nhân: Gemini API fail → Fallback to training data
Giải pháp:
1. Check console for errors
2. Kiểm tra API key valid
3. Try simple question: "hello"
```

---

## 📊 Xem Chi Tiết Responses

### Kiểm tra Console Network

```
1. Mở DevTools → Network tab
2. Gõ câu hỏi trong ChatBox
3. Bạn sẽ thấy request:
   - POST: generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
   
4. Click vào request
5. Tab Response: Xem AI response
6. Status: 200 OK = Success
```

---

## ✨ Features Hoạt Động

Khi ChatBox hoạt động 100%, bạn sẽ thấy:

### ✅ Chat Interface
- [x] Mở/đóng ChatBox
- [x] Nhắn tin
- [x] Hiển thị messages
- [x] Auto-scroll

### ✅ AI Responses
- [x] Gemini Pro trả lời
- [x] Adaptive learning lưu dữ liệu
- [x] Fallback to training data
- [x] Response ngay lập tức

### ✅ User Feedback
- [x] Click 👍 để đánh giá tốt
- [x] Click 👎 để đánh giá tệ
- [x] Rating cập nhật thống kê

### ✅ Statistics
- [x] Tổng câu hỏi: Tăng
- [x] Good/Bad ratings: Cập nhật
- [x] Accuracy %: Tính toán
- [x] Learned patterns: Lưu trữ

### ✅ Language Support
- [x] Switch VI/EN
- [x] Chat text thay đổi
- [x] Bot response thay đổi ngôn ngữ

### ✅ Nguồn Response
- [x] ⚡ Gemini Pro (AI model)
- [x] 🧠 Adaptive Learning (user learned)
- [x] 📚 Training Data (hardcoded)

---

## 🎯 Kết Luận

### ChatBox Hoạt Động OK Khi:
- ✅ Console không có error
- ✅ Gemini API connection successful
- ✅ ChatBox button visible
- ✅ Có thể gửi tin nhắn
- ✅ Bot trả lời trong 2-3 giây
- ✅ Rating system hoạt động
- ✅ Statistics cập nhật

### Nếu Có Lỗi:
1. Kiểm tra Console F12
2. Xem Network tab
3. Copy error message
4. Share với developer

---

## 🚀 Next Steps

1. ✅ ChatBox hoạt động
2. 📊 Monitor stats
3. 🎓 Train AI (gửi nhiều câu hỏi + đánh giá)
4. 📈 Optimize response
5. 🚀 Deploy to production

**Bạn đã sẵn sàng! ChatBox của BugHunter hoạt động với Gemini Pro! 🎉**
