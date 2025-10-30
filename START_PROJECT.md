# Hướng dẫn Start Project BugHunter

## ⚠️ VẤN ĐỀ: Không tìm thấy file .env

Bạn cần tạo file `.env` trong thư mục `server/` trước khi start backend.

## Bước 1: Tạo file .env

Trong thư mục `server/`, tạo file mới tên `.env` với nội dung sau:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-123456789

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
ADMIN_EMAIL=admin@bughunter.com

# Google OAuth - THAY BẰNG VALUES THẬT
GOOGLE_CLIENT_ID=151505419119-5nej0l7...
GOOGLE_CLIENT_SECRET=GOCSPX-W-I...

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here
```

## Bước 2: Start MongoDB

```bash
# Windows
net start MongoDB

# Kiểm tra MongoDB chạy
mongosh
# Nếu không có mongosh, dùng mongo
mongo
```

## Bước 3: Start Backend

```bash
cd server
npm install  # Nếu chưa install
npm run dev
```

Bạn sẽ thấy:
```
Kết nối MongoDB thành công
Database: mongodb://localhost:27017/bughunter
Server đang chạy tại http://localhost:5000
Environment: development
```

## Bước 4: Start Frontend (Terminal mới)

Mở terminal mới:

```bash
cd client
npm install  # Nếu chưa install
npm run dev
```

Bạn sẽ thấy Vite dev server chạy.

## Bước 5: Test

Mở browser và gõ:
```
http://localhost:3000
```

## Lưu ý

### Nếu MongoDB chưa cài:

**Windows**:
1. Download: https://www.mongodb.com/try/download/community
2. Cài đặt
3. Chạy: `net start MongoDB`

**macOS**:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

### Nếu Port 5000 bị chiếm:

Sửa file `server/.env`:
```env
PORT=5001
```

Và sửa trong Google Console redirect URI thành:
```
http://localhost:5001/api/auth/google/callback
```

## Troubleshooting

### Error: "Cannot find module"
```bash
cd server
npm install
```

### Error: "MongoDB connection failed"
1. Check MongoDB đang chạy: `net start MongoDB`
2. Hoặc start MongoDB: `mongod`

### Error: "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
PORT=5001
```

## Sau khi start xong

1. Backend: http://localhost:5000
2. Frontend: http://localhost:3000
3. Test OAuth: http://localhost:5000/api/auth/google

