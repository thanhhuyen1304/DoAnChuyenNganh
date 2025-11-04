# 🔧 Bước 6: Tích hợp Judge0 vào Project - Hướng dẫn Chi Tiết

## ✅ Đã hoàn thành trước đó

- ✅ Docker đã cài đặt
- ✅ Judge0 đã chạy thành công trên Docker
- ✅ Test `curl http://localhost:2358/health` thành công

## 📋 Bước 6.1: Cập nhật .env file

### Tìm file .env

1. **Mở File Explorer**

2. **Điều hướng đến**:
   ```
   C:\Users\thanh\Downloads\DoAnChuyenNganh\server
   ```

3. **Kiểm tra xem có file `.env` chưa**:
   - Nếu **chưa có**: Tạo file mới
   - Nếu **đã có**: Mở để chỉnh sửa

### Tạo file .env (nếu chưa có)

**Cách 1: Dùng Notepad**

1. **Right-click** trong thư mục `server`
2. Chọn **New** → **Text Document**
3. **Đổi tên** thành `.env` (xóa phần `.txt`)
   - Windows có thể hỏi "Are you sure you want to change the file extension?" → Click **Yes**

**Cách 2: Dùng PowerShell**

```powershell
# Mở PowerShell trong thư mục server
cd C:\Users\thanh\Downloads\DoAnChuyenNganh\server

# Tạo file .env
New-Item -Path ".env" -ItemType File -Force
```

### Thêm cấu hình Judge0 vào .env

1. **Mở file `.env`** bằng Notepad hoặc editor

2. **Thêm hoặc cập nhật** các dòng sau:

```env
# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**Giải thích**:
- `JUDGE0_API_URL`: URL của Judge0 (localhost vì chạy local)
- `JUDGE0_API_KEY`: Để **trống** (self-hosted không cần API key)

3. **Lưu file** (Ctrl + S)

### Kiểm tra các biến môi trường khác

Đảm bảo file `.env` có các biến cần thiết:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Client URL
CLIENT_URL=http://localhost:3000

# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini Pro (Optional - nếu có API key)
GEMINI_API_KEY=
```

---

## 📋 Bước 6.2: Verify Code đã tích hợp

### Kiểm tra submission controller

File `server/src/controllers/submission.controller.ts` đã có code tích hợp Judge0:

```typescript
import judge0Service from '../services/judge0Service';

// Trong submitSolution function:
const isJudge0Available = await judge0Service.checkHealth();

if (isJudge0Available) {
  // Chạy code thực với Judge0
  const judgeResults = await judge0Service.runTestCases(...);
}
```

✅ **Nếu thấy code này → Judge0 đã được tích hợp!**

### Kiểm tra judge0Service

File `server/src/services/judge0Service.ts` đã tồn tại và có:
- `checkHealth()`: Kiểm tra Judge0 có available không
- `runTestCases()`: Chạy code với test cases

---

## 📋 Bước 6.3: Test từ Project

### Bước 1: Đảm bảo Docker đang chạy

1. **Kiểm tra Docker Desktop**:
   - Icon Docker ở system tray phải **màu xanh** 🟢
   - Nếu chưa chạy, mở Docker Desktop

2. **Kiểm tra Judge0 containers**:
   ```powershell
   docker-compose ps
   ```

   **Kết quả mong đợi**: 3 containers đều "Up"

### Bước 2: Start Backend Server

1. **Mở PowerShell** trong thư mục `server`:
   ```powershell
   cd C:\Users\thanh\Downloads\DoAnChuyenNganh\server
   ```

2. **Start server**:
   ```powershell
   npm run dev
   ```

3. **Chờ server khởi động** (10-20 giây)

4. **Kết quả mong đợi**:
   ```
   Server is running on port 5000
   MongoDB connected
   ```

5. **Nếu có lỗi**, xem phần [Troubleshooting](#troubleshooting)

### Bước 3: Test với một Submission

#### Option A: Test qua Frontend (Khuyến nghị)

1. **Mở browser** và truy cập:
   ```
   http://localhost:3000
   ```
   (hoặc port mà frontend đang chạy)

2. **Đăng nhập** (nếu cần)

3. **Chọn một challenge** từ danh sách

4. **Viết code** trong editor

5. **Click "Submit"**

6. **Kiểm tra kết quả**:
   - Nếu thấy kết quả test cases → ✅ Judge0 đang hoạt động!
   - Nếu thấy "Accepted" hoặc "Wrong Answer" → ✅ Đã tích hợp thành công!

#### Option B: Test qua API (Advanced)

1. **Mở PowerShell**

2. **Chạy lệnh** (thay `YOUR_TOKEN` bằng JWT token):
   ```powershell
   $headers = @{
       "Content-Type" = "application/json"
       "Authorization" = "Bearer YOUR_TOKEN"
   }

   $body = @{
       challengeId = "CHALLENGE_ID"
       code = "print('Hello, World!')"
       language = "Python"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:5000/api/submissions/submit" -Method POST -Headers $headers -Body $body
   ```

### Bước 4: Kiểm tra Logs

Trong terminal đang chạy `npm run dev`, bạn sẽ thấy:

**Nếu Judge0 hoạt động**:
```
Judge0 API available, running test cases...
Running test case 1...
Running test case 2...
Submission completed successfully
```

**Nếu Judge0 không available**:
```
Judge0 không available, sử dụng mock execution
```

---

## 🐛 Troubleshooting

### Vấn đề 1: "Cannot connect to Judge0"

**Lỗi**: Connection refused hoặc timeout

**Kiểm tra**:
1. **Docker có đang chạy không**:
   ```powershell
   docker ps
   ```

2. **Judge0 container có đang chạy không**:
   ```powershell
   docker-compose ps
   ```

3. **Test health check**:
   ```powershell
   curl http://localhost:2358/health
   ```

**Giải pháp**:
```powershell
# Start lại containers
docker-compose restart

# Hoặc start lại từ đầu
docker-compose down
docker-compose up -d
```

### Vấn đề 2: "JUDGE0_API_URL is not defined"

**Lỗi**: Environment variable chưa được set

**Giải pháp**:
1. Kiểm tra file `.env` có đúng đường dẫn không
2. Đảm bảo có dòng:
   ```env
   JUDGE0_API_URL=http://localhost:2358
   ```
3. **Restart server** sau khi sửa `.env`

### Vấn đề 3: "TypeScript compilation errors"

**Lỗi**: TypeScript không compile được

**Giải pháp**:
```powershell
# Cài lại dependencies
npm install

# Nếu vẫn lỗi, xóa node_modules và cài lại
Remove-Item -Recurse -Force node_modules
npm install
```

### Vấn đề 4: Server không start

**Kiểm tra**:
1. **Port 5000 có đang được dùng không**:
   ```powershell
   netstat -ano | findstr :5000
   ```

2. **MongoDB có đang chạy không**

3. **Environment variables có đúng không**

---

## ✅ Checklist hoàn thành

- [ ] File `.env` đã tạo hoặc cập nhật
- [ ] `JUDGE0_API_URL=http://localhost:2358` đã được thêm vào `.env`
- [ ] `JUDGE0_API_KEY=` đã được thêm (để trống)
- [ ] Docker Desktop đang chạy (icon xanh)
- [ ] Judge0 containers đang chạy (`docker-compose ps`)
- [ ] Backend server start thành công (`npm run dev`)
- [ ] Test submission thành công
- [ ] Logs hiển thị "Judge0 API available"

---

## 🎯 Next Steps

Sau khi tích hợp thành công:

1. ✅ **Test với nhiều bài submission** khác nhau
2. ✅ **Setup Gemini Pro** (nếu có API key) để có AI analysis
3. ✅ **Monitor performance** của Judge0
4. ✅ **Deploy lên production** (nếu cần)

---

## 📝 Lưu ý

### Self-hosted vs RapidAPI

- **Self-hosted (Docker)**: `JUDGE0_API_KEY` để trống
- **RapidAPI**: Cần `JUDGE0_API_KEY` từ RapidAPI

### Fallback Behavior

Nếu Judge0 không available, hệ thống sẽ:
- Tự động fallback về mock execution
- Vẫn hoạt động bình thường (nhưng kết quả không chính xác)

### Performance

- **Lần đầu chạy**: Có thể chậm (2-5 giây) vì Judge0 cần khởi động
- **Lần sau**: Nhanh hơn (1-3 giây)

---

## 🎉 Hoàn thành!

Bây giờ bạn đã tích hợp Judge0 vào project thành công!

**Nếu gặp vấn đề**, xem lại phần [Troubleshooting](#troubleshooting) hoặc check logs:
```powershell
docker-compose logs judge0
```

Chúc bạn thành công! 🚀

