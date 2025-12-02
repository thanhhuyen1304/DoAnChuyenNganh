# 📋 ChatBox Testing Checklist

## 🚀 Quick Start Test

### Step 1: DevTools
- [ ] Mở DevTools (F12)
- [ ] Chọn tab Console
- [ ] Không có error nào?

### Step 2: API Key Verification
Gõ vào Console:
```javascript
console.log(import.meta.env.VITE_GEMINI_API_KEY)
```
- [ ] API key hiển thị (không phải undefined/null)

### Step 3: ChatBox Button
- [ ] Tìm được button ở góc phải dưới
- [ ] Button màu gradient (hồng-tím-xanh)
- [ ] Click vào mở ChatBox

### Step 4: UI Elements
- [ ] Thấy ChatBox window mở
- [ ] Header: "BugHunter Chat" + Gemini icon
- [ ] Welcome message từ bot
- [ ] Input field và Send button
- [ ] Close button (X)

### Step 5: Send Message Test
1. Gõ: "xin chào"
2. Nhấn Enter
- [ ] Message hiển thị ở bên phải (blue)
- [ ] Loading indicator hiện
- [ ] Chờ 2-3 giây
- [ ] Bot reply hiển thị ở bên trái (gray)

### Step 6: Multiple Messages
1. Gõ: "làm sao debug?"
- [ ] Message mới thêm vào chat
- [ ] Bot trả lời

2. Gõ: "javascript là gì?"
- [ ] Chat history giữ nguyên
- [ ] Scroll xuống xem câu cũ

### Step 7: Rating System
1. Nhìn bot message
- [ ] Thấy 👍 và 👎 buttons
- [ ] Click 👍 (good)
- [ ] Button chuyển màu xanh
- [ ] Click 👎 (bad)
- [ ] Button chuyển màu đỏ

### Step 8: Statistics
1. Scroll xuống ChatBox
- [ ] Thấy nút "📊" ở dưới
- [ ] Click 📊
- [ ] Statistics panel mở:
  - [ ] ✓ Tổng câu hỏi: > 0
  - [ ] 👍 Tốt: > 0
  - [ ] 👎 Tệ: 0 hoặc > 0
  - [ ] 📊 Độ chính xác: X%
  - [ ] 🧠 Đã học: N patterns
  - [ ] ⚡ Nguồn: Gemini/Adaptive/Training

### Step 9: Clear Chat
- [ ] Click nút Trash (🗑️)
- [ ] Chat history bị xóa
- [ ] Quay lại welcome message

### Step 10: Language Switch
1. Tìm language toggle (VI/EN) ở header
- [ ] Click vào nó
- [ ] ChatBox text thay đổi ngôn ngữ
- [ ] Gõ câu hỏi
- [ ] Bot trả lời bằng ngôn ngữ mới

---

## 🎯 Success Criteria

### ✅ Tất cả Tests Pass
```
Nếu bạn check được tất cả ☑️ ở trên
→ ChatBox hoạt động 100% ✨
```

### ⚠️ Nếu Có Lỗi

Ghi nhận:
- [ ] Error message là gì?
- [ ] Ở console hay UI?
- [ ] Khi nào xảy ra?
- [ ] Screenshot error?

Kiểm tra:
- [ ] API key valid?
- [ ] Internet connection ok?
- [ ] Browser console errors?
- [ ] Network request success?

---

## 📊 Performance Check

### Response Time
Mở DevTools → Network tab
- [ ] Gemini API response < 3 giây
- [ ] Status: 200 OK
- [ ] No 401/403 errors

### Resource Usage
- [ ] ChatBox không lag
- [ ] Không tốn CPU
- [ ] LocalStorage < 100KB

---

## 🔍 Data Verification

### localStorage Check
Gõ vào Console:
```javascript
JSON.parse(localStorage.getItem('bughunter_ai_learning_data'))
```

- [ ] interactions array có dữ liệu?
- [ ] learnedPatterns có entries?
- [ ] Rating data lưu đúng?

### API Response Check
Network tab → generativelanguage.googleapis.com request
- [ ] Status: 200
- [ ] Response có text?
- [ ] Không bị 401/403?

---

## 🎓 Training Check

### Adaptive Learning Verification
1. Gửi 3 câu hỏi giống nhau: "debug lỗi"
- [ ] Câu 1: Random response (training data)
- [ ] Câu 2: Có thể cùng response
- [ ] Câu 3: Ưu tiên response hay hơn

2. Đánh giá:
- [ ] Câu 1: 👍 (good)
- [ ] Câu 2: 👎 (bad)
- [ ] Câu 3: Accuracy % thay đổi?

---

## 🚀 Final Checklist

- [ ] ChatBox UI hoạt động
- [ ] Messages gửi/nhận bình thường
- [ ] Bot trả lời từ Gemini
- [ ] Rating system cập nhật
- [ ] Statistics tính toán đúng
- [ ] Language switching hoạt động
- [ ] No console errors
- [ ] No API errors (401/403/500)
- [ ] Adaptive learning lưu dữ liệu
- [ ] ChatBox responsive (mobile-friendly)

---

## ✨ Chúc Mừng!

Nếu ☑️ tất cả trên → **ChatBox 100% hoạt động! 🎉**

Bạn có thể:
- ✅ Deploy lên production
- ✅ Share với users
- ✅ Monitor performance
- ✅ Collect feedback

**Kỳ tiếp: Optimization & Scale! 🚀**
