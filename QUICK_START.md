# Quick Start - BugHunter

## VẤN ĐỀ: Không thể truy cập vào trang web

File `.env` đã tồn tại nhưng backend có thể chưa chạy hoặc có lỗi.

## ✅ GIẢI PHÁP NHANH

### Bước 1: Start MongoDB (Nếu chưa chạy)

Mở PowerShell (Run as Administrator) và chạy:

```powershell
net start MongoDB
```

Hoặc chạy trực tiếp:
```powershell
mongod
```

### Bước 2: Start Backend

Mở Terminal mới và chạy:

```bash
cd server
npm run dev
```

**Kết quả mong đợi**:
```
[nodemon] starting `ts-node src/app.ts`
Kết nối MongoDB thành công
Database: mongodb://localhost:27017/bughunter
Server đang chạy tại http://localhost:5000
Environment: development
```

**Nếu thấy error** → Gửi error message cho tôi

### Bước 3: Start Frontend

Mở Terminal khác:

```bash
cd client
npm run dev
```

### Bước 4: Test OAuth

Sau khi cả backend và frontend đều chạy:

1. Mở browser: `http://localhost:3000`
2. Click "Đăng nhập"
3. Click "Đăng nhập với Google"

---

## ⚠️ Nếu backend không start được

### Lỗi: "Cannot connect to MongoDB"
- **Nguyên nhân**: MongoDB chưa chạy
- **Giải pháp**:
```powershell
# Kiểm tra MongoDB
net start MongoDB

# Nếu vẫn lỗi, start manual
mongod --dbpath="C:\data\db"
```

### Lỗi: "Port 5000 already in use"
- **Giải pháp**: Đổi port hoặc kill process
```powershell
# Tìm process dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay <PID> bằng số PID từ lệnh trên)
taskkill /PID <PID> /F
```

### Lỗi khác
- Chụp screenshot của error
- Gửi cho tôi

---

## 🔍 Kiểm tra nhanh

### Backend có đang chạy?
Mở browser: `http://localhost:5000`

**Kết quả**:
- Thấy JSON response hoặc "Cannot GET /" → Backend chạy ✓
- "Can't reach this page" → Backend chưa chạy ✗

### MongoDB có chạy?
```bash
mongosh
# hoặc
mongo
```

Nếu connect được → MongoDB chạy ✓

---

## 📞 Sau khi start xong

Test OAuth:
```
http://localhost:5000/api/auth/google
```

Nên redirect đến Google login page. Nếu không → gửi error message cho tôi!

