# FIX Ngay - Vấn đề: Không tìm thấy trang

## Vấn đề
Bạn đã thử truy cập OAuth nhưng gặp lỗi "không tìm thấy trang".

## Nguyên nhân có thể
1. Backend chưa chạy (hoặc đã bị stop)
2. Port 5000 không đúng
3. URL không đúng

## ✅ Kiểm tra nhanh

### 1. Backend có đang chạy không?

Nhìn vào terminal backend - bạn sẽ thấy:
```
Server đang chạy tại http://localhost:5000
Environment: development
```

**Nếu KHÔNG thấy** → Backend chưa chạy, chạy:
```bash
cd server
npm run dev
```

### 2. Test backend đang chạy

Mở browser và gõ:
```
http://localhost:5000
```

**Kết quả**:
- Thấy response (JSON hoặc "Cannot GET /") → Backend đang chạy ✅
- "Can't reach this page" → Backend chưa chạy ❌

### 3. Test OAuth endpoints

**Google**:
```
http://localhost:5000/api/auth/google
```

**GitHub**:
```
http://localhost:5000/api/auth/github
```

**Kết quả mong đợi**: Tự động redirect đến login page

## 🔧 Nếu backend KHÔNG chạy

### Start backend:
```bash
cd server
npm run dev
```

Đợi thấy:
```
Server đang chạy tại http://localhost:5000
```

Sau đó test lại OAuth endpoints.

## 🔧 Nếu vẫn "không tìm thấy trang"

### Kiểm tra URL

**SAI** ❌:
- `http://localhost:3000/api/auth/google` (frontend không có route này)
- `http://localhost:5000/auth/google` (thiếu `/api`)

**ĐÚNG** ✅:
- `http://localhost:5000/api/auth/google`
- `http://localhost:5000/api/auth/github`

### Test từ trang Login

1. Mở: `http://localhost:3000/login`
2. Click button "Đăng nhập với GitHub"
3. Browser sẽ redirect đến: `http://localhost:5000/api/auth/github`
4. Backend sẽ redirect đến GitHub

## 📞 Báo cáo cho tôi

Khi test OAuth, cho tôi biết:
1. Backend có đang chạy không? (Check terminal)
2. URL bạn đang truy cập là gì?
3. Error message cụ thể là gì?

## Quick Fix

Nếu backend chưa chạy:
```bash
# Stop tất cả (Ctrl+C)
# Sau đó

cd server
npm run dev
```

Đợi thấy "Server đang chạy" → Test lại!

