# Hướng Dẫn Cài Đặt Hoàn Chỉnh - BugHunter

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Cơ Bản](#cài-đặt-cơ-bản)
3. [Cài Đặt Judge0](#cài-đặt-judge0)
4. [Cấu Hình Password Reset](#cấu-hình-password-reset)
5. [Debug Guide](#debug-guide)

---

## Yêu Cầu Hệ Thống

- **Node.js**: 18+ 
- **MongoDB**: 5.0+
- **Docker & Docker Compose**: Latest
- **Git**: Latest

---

## Cài Đặt Cơ Bản

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd DoAnChuyenNganh
```

### Bước 2: Cài Đặt Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd ../client
npm install
```

### Bước 3: Cấu Hình MongoDB

#### Cài đặt MongoDB

- **Windows**: Tải từ https://www.mongodb.com/try/download/community
- **macOS**: `brew install mongodb-community`
- **Ubuntu**: `sudo apt install mongodb`

#### Khởi động MongoDB

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Bước 4: Cấu Hình Environment Variables

Tạo file `.env` trong thư mục `server/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# OAuth Configuration (tùy chọn)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Client Configuration
CLIENT_URL=http://localhost:3000

# Judge0 API
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini Pro (tùy chọn)
GEMINI_API_KEY=your-gemini-api-key

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=no-reply@bughunter.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Bước 5: Khởi động ứng dụng

#### Backend
```bash
cd server
npm run dev
```

#### Frontend
```bash
cd client
npm run dev
```

### Bước 6: Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Tài khoản Admin mặc định

- **Email**: admin@bughunter.com
- **Password**: admin123

---

## Cài Đặt Judge0

Judge0 là hệ thống execute code an toàn được sử dụng để chạy và đánh giá code submissions.

### Bước 1: Kiểm tra Docker

#### Windows
1. Mở Docker Desktop (icon phải màu xanh)
2. Mở PowerShell và kiểm tra:
```powershell
docker --version
docker-compose --version
```

#### macOS/Linux
```bash
docker --version
docker-compose --version
```

### Bước 2: Cấu hình Docker Compose

File `docker-compose.yml` đã có trong thư mục gốc:

```yaml
version: '3.8'

services:
  # Redis - Judge0 cần Redis để queue
  redis:
    image: redis:7-alpine
    container_name: judge0-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - judge0-network
    restart: unless-stopped

  # Judge0 API
  judge0:
    image: judge0/judge0:1.13.0
    container_name: judge0
    ports:
      - "2358:2358"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - MAX_QUEUE_SIZE=200
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=judge0
      - MEMORY_LIMIT=0
      - ENABLE_CGROUP=false
    privileged: true
    security_opt:
      - seccomp:unconfined
    tmpfs:
      - /tmp
    depends_on:
      - redis
      - postgres
    networks:
      - judge0-network
    restart: unless-stopped

  # PostgreSQL - Judge0 cần database
  postgres:
    image: postgres:15-alpine
    container_name: judge0-postgres
    environment:
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=judge0
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - judge0-network
    restart: unless-stopped

volumes:
  redis-data:
  postgres-data:

networks:
  judge0-network:
    driver: bridge
```

### Bước 3: Khởi động Judge0

1. Mở terminal trong thư mục gốc
2. Chạy lệnh:
```bash
docker-compose up -d
```

3. Đợi Docker pull images và khởi động containers (2-5 phút cho lần đầu)

4. Kiểm tra containers đang chạy:
```bash
docker-compose ps
```

Kết quả mong đợi:
```
NAME                IMAGE                  STATUS              PORTS
judge0              judge0/judge0:1.13.0  Up 30 seconds       0.0.0.0:2358->2358/tcp
judge0-postgres     postgres:15-alpine    Up 30 seconds       5432/tcp
judge0-redis        redis:7-alpine        Up 30 seconds       0.0.0.0:6379->6379/tcp
```

### Bước 4: Test Judge0

#### Test Health Check
```bash
curl http://localhost:2358/health
```

Kết quả: `{"status":"OK"}`

#### Test Languages
```bash
curl http://localhost:2358/languages
```

#### Test Submission (Python)
```bash
curl -X POST http://localhost:2358/submissions?base64_encoded=false \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": ""
  }'
```

### Troubleshooting Judge0

#### Lỗi "No such file or directory"

**Giải pháp:**
```bash
# Restart Judge0 container
docker restart judge0

# Nếu vẫn lỗi, rebuild containers
docker-compose down
docker-compose up -d
```

#### Lỗi "Connection refused"

**Giải pháp:**
1. Kiểm tra containers:
```bash
docker-compose ps
```

2. Kiểm tra port:
```bash
netstat -ano | findstr :2358
```

3. Restart Docker Desktop

#### Lỗi Port đã được sử dụng

**Giải pháp**: Đổi port trong `docker-compose.yml`:
```yaml
judge0:
  ports:
    - "2359:2358"  # Thay 2358 thành 2359
```

Và cập nhật `.env`:
```env
JUDGE0_API_URL=http://localhost:2359
```

---

## Cấu Hình Password Reset

### Email Configuration (Gmail)

#### ⚠️ QUAN TRỌNG: Sử dụng App Password

Gmail không cho phép sử dụng mật khẩu thông thường. Bạn **PHẢI** sử dụng **App Password**.

#### Bước 1: Bật 2-Step Verification

1. Vào https://myaccount.google.com/security
2. Tìm "2-Step Verification" và bật
3. Làm theo hướng dẫn

#### Bước 2: Tạo App Password

1. Vào https://myaccount.google.com/apppasswords
2. Chọn:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: BugHunter
3. Click "Generate"
4. **Copy mật khẩu 16 ký tự** (ví dụ: `abcd efgh ijkl mnop`)

#### Bước 3: Cấu hình trong `.env`

```env
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=no-reply@bughunter.com
```

**Lưu ý**:
- `SMTP_PASS`: **App Password 16 ký tự** (không phải mật khẩu Gmail!)
- Bỏ khoảng trắng nếu có

### SMS Configuration (Twilio)

#### Bước 1: Đăng ký Twilio

1. Đăng ký tại https://www.twilio.com
2. Lấy từ Twilio Console:
   - **Account SID**
   - **Auth Token**
   - **Phone Number**

#### Bước 2: Cấu hình trong `.env`

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Test Password Reset

1. Vào `/forgot-password`
2. Nhập email hoặc số điện thoại
3. Kiểm tra email/SMS để lấy mã
4. Nhập mã và mật khẩu mới tại `/verify-reset`

---

## Debug Guide

### Các bước tìm lỗi chung

#### 1. Kiểm tra Console Log trên Server

```bash
# Trong terminal server, bạn sẽ thấy:
Judge0 response: { ... }
Gemini API error: ...
POST /api/submissions/submit 200 ...
Database connection: ...
WebSocket connected: ...
```

#### 2. Kiểm tra Network Tab trên Browser

1. Mở **Developer Tools** (F12)
2. Vào tab **Network**
3. Thực hiện action gây lỗi
4. Kiểm tra:
   - **Status code**: 200 (OK), 400 (Bad Request), 500 (Server Error)
   - **Response body**: `success: true/false`, `message`, `errors`
   - **Request headers**: Authorization token

#### 3. Kiểm tra Console trên Browser

1. Mở **Developer Tools** (F12)
2. Vào tab **Console**
3. Xem các lỗi JavaScript

### Debug Lỗi Submission

#### Lỗi: "No such file or directory"

**Cách xử lý**:
```bash
# Kiểm tra Judge0
docker ps | grep judge0

# Kiểm tra API URL
curl http://localhost:2358/health

# Restart Judge0
docker restart judge0
```

#### Lỗi: "Gemini API error: 404"

**Cách xử lý**:
1. Kiểm tra `GEMINI_API_KEY` trong `.env`
2. Đổi model từ `gemini-pro` sang `gemini-1.5-flash`
3. Test API key

#### Lỗi: "Submission validation failed"

**Cách xử lý**:
1. Kiểm tra Network tab → Payload
2. Đảm bảo có: `challengeId`, `code`, `language`
3. Kiểm tra `executionResults`

### Debug Lỗi Authentication

#### Lỗi: "401 Unauthorized"

**Cách xử lý**:
```javascript
// Kiểm tra localStorage
localStorage.getItem('token')

// Decode JWT token
node -e "console.log(JSON.parse(require('atob')('YOUR_TOKEN'.split('.')[1])))"
```

### Checklist Debug

Khi gặp lỗi, kiểm tra theo thứ tự:

#### 1. Kiểm tra cơ bản
- [ ] Server đang chạy? (`npm run dev` trong server)
- [ ] Client đang chạy? (`npm run dev` trong client)
- [ ] MongoDB kết nối được?
- [ ] Docker đang chạy? (nếu dùng Judge0)

#### 2. Kiểm tra Judge0
- [ ] Judge0 đang chạy? (`docker ps | grep judge0`)
- [ ] Health check OK? (`curl http://localhost:2358/health`)
- [ ] `.env` có `JUDGE0_API_URL` đúng?

#### 3. Kiểm tra Environment
- [ ] File `.env` đầy đủ biến?
- [ ] API keys hợp lệ?

#### 4. Kiểm tra khi Submit
- [ ] Xem console logs trên server
- [ ] Xem Network tab trên browser
- [ ] Token authentication hợp lệ?

### Troubleshooting Common Issues

#### MongoDB không kết nối

```bash
# Kiểm tra MongoDB service
sudo systemctl status mongod

# Khởi động lại
sudo systemctl restart mongod
```

#### Port 5000 đã được sử dụng

```bash
# Tìm process dùng port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

#### Docker không hoạt động

```bash
# Kiểm tra Docker
docker info

# Restart Docker Desktop
```

---

## Khi nào cần hỗ trợ

Nếu đã thử tất cả các bước mà vẫn không giải quyết được, hãy cung cấp:

1. **Console logs từ server** (copy toàn bộ)
2. **Network request/response từ browser** (screenshot hoặc copy)
3. **Error message chính xác**
4. **Steps to reproduce** (các bước để tái hiện lỗi)
5. **Environment information**:
   - OS: Windows/macOS/Linux
   - Node.js version: `node --version`
   - Docker version: `docker --version`
   - MongoDB version: `mongosh --version`

---

## Next Steps

Sau khi cài đặt thành công:

1. ✅ Đăng nhập với tài khoản admin
2. ✅ Tạo các bài tập mới qua Admin Dashboard
3. ✅ Test tính năng submit code
4. ✅ Khám phá các tính năng PvP và AI analysis
5. ✅ Cấu hình ChatBox với Gemini API
6. ✅ Test Password Reset với Email/SMS

---

**Last Updated:** 2025-12-03
**Version:** 2.0.0