# ⚡ Quick Start: Tạo file .env

## ✅ Đã tạo file .env.example

File `.env.example` đã được tạo trong thư mục `server/` với tất cả cấu hình cần thiết.

## 🚀 Bước 1: Copy file .env.example thành .env

### Cách 1: Dùng PowerShell (Khuyến nghị)

```powershell
cd C:\Users\thanh\Downloads\DoAnChuyenNganh\server
Copy-Item .env.example .env
```

### Cách 2: Dùng File Explorer

1. Mở thư mục `server`
2. Tìm file `.env.example`
3. Copy file (Ctrl + C)
4. Paste (Ctrl + V)
5. Đổi tên thành `.env` (xóa phần `.example`)

## 📝 Bước 2: Cập nhật các giá trị cần thiết

Mở file `.env` và cập nhật:

### Bắt buộc:
- `MONGODB_URI`: Đường dẫn MongoDB của bạn
- `JWT_SECRET`: Đổi thành secret key riêng (bảo mật)

### Đã cấu hình sẵn cho Judge0:
- `JUDGE0_API_URL=http://localhost:2358` ✅ (đã đúng)
- `JUDGE0_API_KEY=` ✅ (để trống - đúng cho self-hosted)

### Optional:
- `GEMINI_API_KEY`: Nếu có API key Gemini Pro
- OAuth keys: Nếu dùng OAuth

## ✅ Verify

1. **Kiểm tra file .env đã tồn tại**:
   ```powershell
   cd server
   dir .env
   ```

2. **Kiểm tra nội dung**:
   ```powershell
   type .env
   ```

3. **Start server**:
   ```powershell
   npm run dev
   ```

## 🎉 Hoàn thành!

File `.env` đã được tạo và cấu hình cho Judge0 Docker!

