# Hướng dẫn Cài đặt Chi tiết BugHunter

## Yêu cầu hệ thống
- Node.js 18+ 
- MongoDB 5.0+
- Docker & Docker Compose
- Git

## Bước 1: Clone repository
```bash
git clone <repository-url>
cd DoAnChuyenNganh
```

## Bước 2: Cài đặt Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd ../client
npm install
```

## Bước 3: Cấu hình MongoDB

### Cài đặt MongoDB
- **Windows**: Tải từ https://www.mongodb.com/try/download/community
- **macOS**: `brew install mongodb-community`
- **Ubuntu**: `sudo apt install mongodb`

### Khởi động MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## Bước 4: Cấu hình Environment Variables

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

# Judge0 API (sẽ được setup ở bước sau)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini Pro (tùy chọn)
GEMINI_API_KEY=your-gemini-api-key

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
```

## Bước 5: Setup Judge0 với Docker

1. Kiểm tra Docker đã được cài đặt:
```bash
docker --version
docker-compose --version
```

2. Chạy Judge0 containers:
```bash
# Từ thư mục gốc
docker-compose up -d
```

3. Kiểm tra containers đang chạy:
```bash
docker-compose ps
```

4. Test Judge0 API:
```bash
curl http://localhost:2358/health
```

## Bước 6: Khởi động ứng dụng

### Backend
```bash
cd server
npm run dev
```

### Frontend
```bash
cd client
npm run dev
```

## Bước 7: Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Tài khoản Admin mặc định
- **Email**: admin@bughunter.com
- **Password**: admin123

## Troubleshooting

### MongoDB không kết nối được
```bash
# Kiểm tra MongoDB service
sudo systemctl status mongod

# Khởi động lại MongoDB
sudo systemctl restart mongod
```

### Port 5000 đã được sử dụng
```bash
# Tìm process dùng port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

### Docker không hoạt động
```bash
# Kiểm tra Docker status
docker info

# Restart Docker Desktop
```

### Judge0 không hoạt động
```bash
# Kiểm tra containers
docker-compose ps

# Xem logs
docker-compose logs judge0

# Restart containers
docker-compose restart
```

## Next Steps
Sau khi cài đặt thành công:
1. Đăng nhập với tài khoản admin
2. Tạo các bài tập mới qua Admin Dashboard
3. Test tính năng submit code
4. Khám phá các tính năng PvP và AI analysis