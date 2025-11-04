# 📝 Hướng dẫn Setup file .env cho Judge0

## ✅ Tình trạng hiện tại

File `.env` đã tồn tại trong thư mục `server/`. Bạn cần thêm cấu hình Judge0 vào file này.

## 🚀 Cách 1: Tự động (Khuyến nghị)

### Chạy script PowerShell:

```powershell
cd C:\Users\thanh\Downloads\DoAnChuyenNganh\server
.\setup-env.ps1
```

Khi được hỏi "Bạn có muốn ghi đè?", chọn **Y** để cập nhật file với cấu hình đầy đủ.

## 🛠️ Cách 2: Thủ công

### Bước 1: Mở file .env

1. Mở File Explorer
2. Điều hướng đến: `C:\Users\thanh\Downloads\DoAnChuyenNganh\server`
3. **Mở file `.env`** bằng Notepad hoặc editor

### Bước 2: Thêm cấu hình Judge0

**Thêm 2 dòng sau vào cuối file** (hoặc tìm và cập nhật nếu đã có):

```env
# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

### Bước 3: Lưu file

- Nhấn **Ctrl + S** để lưu

## 📋 Nội dung đầy đủ của file .env

Nếu bạn muốn tạo lại file `.env` từ đầu, copy nội dung sau:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Client Configuration
CLIENT_URL=http://localhost:3000

# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini Pro API (Optional)
GEMINI_API_KEY=

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
```

## ✅ Verify

Sau khi cập nhật, kiểm tra:

```powershell
cd C:\Users\thanh\Downloads\DoAnChuyenNganh\server
Get-Content .env | Select-String "JUDGE0"
```

**Kết quả mong đợi**:
```
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

## 🎯 Next Steps

Sau khi file `.env` đã có cấu hình Judge0:

1. ✅ **Restart server** (nếu đang chạy):
   ```powershell
   # Dừng server (Ctrl + C)
   # Sau đó start lại
   npm run dev
   ```

2. ✅ **Test Judge0**:
   ```powershell
   curl http://localhost:2358/health
   ```

3. ✅ **Test submission** từ project

## 🐛 Troubleshooting

### File .env không được load

**Giải pháp**:
- Đảm bảo file `.env` nằm trong thư mục `server/`
- Đảm bảo tên file chính xác là `.env` (không phải `.env.txt`)
- Restart server sau khi sửa `.env`

### Judge0 không kết nối được

**Kiểm tra**:
1. Docker có đang chạy không?
2. Judge0 containers có đang chạy không? (`docker-compose ps`)
3. URL trong `.env` có đúng không? (`http://localhost:2358`)

---

## 🎉 Hoàn thành!

Sau khi cập nhật file `.env`, bạn đã sẵn sàng tích hợp Judge0 vào project!

