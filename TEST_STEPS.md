# Test OAuth - Steps

## ✅ BACKEND ĐANG CHẠY
Nhìn vào terminal, bạn thấy:
```
Server đang chạy tại http://localhost:5000
Environment: development
```

## 🧪 TEST OAuth - 3 bước

### Bước 1: Mở browser và gõ
```
http://localhost:5000
```

**Kết quả**: Thấy JSON response hoặc "Cannot GET /"

### Bước 2: Test OAuth endpoint
```
http://localhost:5000/api/auth/google
```

**Kết quả mong đợi**: Redirect đến Google login

### Bước 3: Test từ Frontend
1. Mở: `http://localhost:3000`
2. Click "Đăng nhập"
3. Click "Đăng nhập với Google"
4. Browser redirect đến Google

---

## ⚠️ Nếu bước 2 KHÔNG redirect

Có thể là lỗi: `Error: Unknown authentication strategy "google"`

### Giải pháp:
Trong terminal backend, nhấn:
```
rs
```

(Nodemon sẽ restart lại server)

Sau đó test lại.

---

## 📞 Báo cáo

Khi test, cho tôi biết:
1. Step 1 kết quả gì?
2. Step 2 có redirect không?
3. Step 3 có redirect không?

Nếu có error → Copy error message cho tôi!

