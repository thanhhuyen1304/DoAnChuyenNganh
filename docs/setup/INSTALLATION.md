# Hướng dẫn Cài đặt BugHunter

## 📋 Tổng quan
BugHunter là nền tảng web học lập trình thông qua việc sửa lỗi code thực tế. Hệ thống hỗ trợ nhiều ngôn ngữ lập trình và tích hợp các tính năng PvP, AI analysis.

## 🛠️ Yêu cầu hệ thống
- Node.js 18+
- MongoDB 5.0+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd DoAnChuyenNganh
```

### Bước 2: Cài đặt Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

### Bước 3: Start MongoDB

**Windows:**
```powershell
# Start MongoDB service
net start MongoDB

# Hoặc start manual
mongod --dbpath="C:\data\db"
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Kiểm tra MongoDB:**
```bash
mongosh
# Nếu connect được → MongoDB đang chạy ✓
```

### Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `server/`:

**Cách 1: Copy từ template**
```bash
cd server
cp .env.example .env
```

**Cách 2: Tạo thủ công**
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Judge0 Configuration (sẽ setup ở bước sau)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini AI (tùy chọn)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# OAuth Configuration (tùy chọn)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
```

### Bước 5: Setup Judge0 với Docker

Xem chi tiết tại: [DOCKER_JUDGE0.md](DOCKER_JUDGE0.md)

**Quick setup:**
```bash
# Từ thư mục gốc
docker-compose up -d

# Kiểm tra containers
docker-compose ps

# Test Judge0
curl http://localhost:2358/health
```

### Bước 6: Khởi động ứng dụng

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Kết quả mong đợi:
```
[nodemon] starting `ts-node src/app.ts`
Kết nối MongoDB thành công
Database: mongodb://localhost:27017/bughunter
Server đang chạy tại http://localhost:5000
Environment: development
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Bước 7: Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👤 Tài khoản Admin mặc định

- **Email**: admin@bughunter.com
- **Password**: admin123

⚠️ **Lưu ý**: Đổi mật khẩu sau khi đăng nhập lần đầu!

## 📁 Cấu trúc Project

```
DoAnChuyenNganh/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/         # Page Components
│   │   ├── services/      # API Services
│   │   └── ...
├── server/                # Express Backend
│   ├── src/
│   │   ├── controllers/   # Route Controllers
│   │   ├── models/        # Database Models
│   │   ├── routes/        # API Routes
│   │   ├── services/      # Business Logic
│   │   └── ...
├── docs/                  # Documentation
├── docker-compose.yml     # Docker Configuration
└── README.md
```

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to MongoDB"

**Nguyên nhân**: MongoDB chưa chạy

**Giải pháp**:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Kiểm tra status
sudo systemctl status mongod
```

### Lỗi: "Port 5000 already in use"

**Giải pháp 1**: Kill process đang dùng port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

**Giải pháp 2**: Đổi port trong `.env`
```env
PORT=5001
```

### Lỗi: "Cannot find module"

**Giải pháp**:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: Docker không hoạt động

**Kiểm tra**:
```bash
# Kiểm tra Docker đang chạy
docker info

# Kiểm tra Docker Compose
docker-compose --version
```

**Giải pháp**:
- Windows: Khởi động Docker Desktop
- macOS: Khởi động Docker Desktop
- Linux: `sudo systemctl start docker`

### Lỗi: Judge0 "Connection refused"

**Kiểm tra**:
```bash
# Xem containers đang chạy
docker-compose ps

# Xem logs
docker-compose logs judge0

# Restart containers
docker-compose restart
```

**Giải pháp**:
```bash
# Stop và rebuild
docker-compose down
docker-compose up -d
```

## ✅ Checklist Cài đặt

- [ ] Node.js 18+ đã cài đặt (`node --version`)
- [ ] MongoDB đã cài đặt và chạy
- [ ] Docker Desktop đã cài đặt và chạy
- [ ] File `.env` đã được tạo trong `server/`
- [ ] Backend dependencies đã install (`npm install`)
- [ ] Frontend dependencies đã install (`npm install`)
- [ ] Judge0 containers đang chạy (`docker-compose ps`)
- [ ] Backend server chạy thành công (http://localhost:5000)
- [ ] Frontend chạy thành công (http://localhost:3000)
- [ ] Có thể đăng nhập với tài khoản admin

## 📚 Tài liệu liên quan

- [DOCKER_JUDGE0.md](DOCKER_JUDGE0.md) - Setup Judge0 chi tiết
- [../troubleshooting/DEBUG_GUIDE.md](../troubleshooting/DEBUG_GUIDE.md) - Debug guide
- [../pvp/](../pvp/) - Hướng dẫn PvP system
- [../features/AI_INTEGRATION.md](../features/AI_INTEGRATION.md) - AI integration

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
1. Đăng nhập với tài khoản admin
2. Tạo challenges mới
3. Test submission code
4. Khám phá PvP system
5. Sử dụng AI analysis

---

**Cần hỗ trợ?** Xem [DEBUG_GUIDE.md](../troubleshooting/DEBUG_GUIDE.md) hoặc tạo issue trên GitHub.