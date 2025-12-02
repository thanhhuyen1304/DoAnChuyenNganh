# 🎯 Tích Hợp Gemini Pro - Quick Start

## ⚡ 3 Bước Cơ Bản

### 1️⃣ Lấy API Key (5 phút)
```
Truy cập: https://aistudio.google.com
→ Click "Get API Key"
→ Copy API Key
```

### 2️⃣ Tạo `.env.local` (1 phút)
**File: `client/.env.local`**
```env
REACT_APP_GEMINI_API_KEY=AIzaSyBTxBfo_0ftnLo--InN3QE5c7Dg1N0MKb0
```

### 3️⃣ Restart Server (2 phút)
```bash
npm run dev
```

✅ **DONE!** ChatBox giờ dùng Gemini Pro 🚀

---

## 🔍 Test API (Optional)

```bash
node test-gemini.js
```

Gõ API Key và follow hướng dẫn.

---

## 📊 Hiểu Hoạt Động

```
Người dùng hỏi:
  "làm sao debug lỗi?"
        ↓
   [Hybrid Strategy]
   ├─ Layer 1: Adaptive Learning (nhanh, free)
   ├─ Layer 2: Training Data (nhanh, free)
   └─ Layer 3: Gemini Pro (chính xác, có phí)
        ↓
  AI trả lời
  + Gắn tag nguồn (⚡ Gemini Pro)
  + Lưu vào Adaptive Learning
```

---

## 💰 Chi Phí

- **Input**: $0.5 / 1M tokens
- **Output**: $1.5 / 1M tokens
- **1 câu hỏi**: ~0.001 USD
- **100 câu/ngày**: ~$0.2/ngày (~$6/tháng)

💡 **Hybrid Strategy tiết kiệm 80% chi phí** (so với chỉ dùng Gemini)

---

## 📖 Hướng Dẫn Chi Tiết

Xem: `GEMINI_SETUP_GUIDE.md`

---

## ✨ Features

✅ Gemini Pro AI responses
✅ Adaptive Learning (tự động học)
✅ Hybrid Strategy (nhanh + rẻ)
✅ Vietnamese support
✅ Real-time source tracking
✅ Rating system (👍/👎)
✅ Statistics dashboard

---

## 🐛 Debug

Nếu không hoạt động:

1. **Kiểm tra API Key**
   ```bash
   echo $REACT_APP_GEMINI_API_KEY
   # Hoặc trong browser console:
   console.log(process.env.REACT_APP_GEMINI_API_KEY)
   ```

2. **Restart Dev Server**
   ```bash
   npm run dev
   ```

3. **Check Cloud Console**
   - https://console.cloud.google.com
   - Enable Gemini API
   - Setup Billing

4. **Run Test Script**
   ```bash
   node test-gemini.js
   ```

---

## 📚 Files Changed

| File | Mục đích |
|------|---------|
| `client/src/utils/geminiAI.ts` | Gemini API client + Hybrid AI |
| `client/src/config/aiConfig.ts` | Configuration |
| `client/src/components/ChatBox.tsx` | Integrated Gemini |
| `GEMINI_SETUP_GUIDE.md` | Hướng dẫn chi tiết |
| `test-gemini.js` | API test script |

---

## 🚀 Tiếp Theo

1. ✅ Setup Gemini Pro API
2. 🔄 Test ChatBox hoạt động
3. 📊 Monitor chi phí API
4. 🎓 Train Adaptive Learning
5. 📈 Optimize strategy

---

**Happy Coding! 🎉**
