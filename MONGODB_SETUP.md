# Hướng dẫn Setup MongoDB cho BugHunter

## 1. Cài đặt MongoDB

### Trên Windows:
1. Tải MongoDB Community Server từ: https://www.mongodb.com/try/download/community
2. Chạy file installer và làm theo hướng dẫn
3. Đảm bảo MongoDB được cài đặt như Windows Service

### Trên macOS:
```bash
# Sử dụng Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

### Trên Ubuntu/Linux:
```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

## 2. Khởi động MongoDB

### Windows:
```cmd
# Khởi động MongoDB service
net start MongoDB

# Hoặc chạy trực tiếp
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### macOS/Linux:
```bash
# Khởi động MongoDB
brew services start mongodb-community
# hoặc
sudo systemctl start mongod

# Kiểm tra trạng thái
brew services list | grep mongodb
# hoặc
sudo systemctl status mongod
```

## 3. Kết nối với MongoDB Compass

1. Tải MongoDB Compass từ: https://www.mongodb.com/products/compass
2. Cài đặt và mở MongoDB Compass
3. Kết nối với MongoDB local:
   - **Connection String**: `mongodb://localhost:27017`
   - **Database Name**: `bughunter`

## 4. Tạo Database và Collections

Sau khi kết nối thành công, tạo database `bughunter` và các collections sau:

### Collections cần tạo:
- `users` - Lưu thông tin người dùng
- `challenges` - Lưu thông tin bài tập
- `submissions` - Lưu kết quả làm bài

### Cấu trúc collection `users`

Các trường chính (schema thực tế được định nghĩa trong `server/src/models/user.model.ts`):

- `email: String` (unique, required)
- `username: String` (unique, required)
- `password: String` (hash, required)
- `avatar: String`
- `favoriteLanguages: String[]`
- `experience: Number` (default: 0)
- `rank: String` (enum: 'Newbie' | 'Junior' | 'Intermediate' | 'Senior' | 'Expert')
- `badges: String[]`
- `loginMethod: String` (enum: 'local' | 'google' | 'github' | 'facebook', default: 'local')
- `oauth: { google?: String; github?: String; facebook?: String }`

Lưu ý cập nhật mới:

- Đã thêm trường mới vào collection `users`: `oauth.facebook` (String) để lưu Facebook User ID khi đăng nhập bằng Facebook. Nếu ứng dụng chưa được cấp quyền email, hệ thống vẫn có thể tạo/tìm user bằng giá trị fallback dựa trên Facebook ID.

## 5. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `server/` với nội dung:

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

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
```

## 6. Kiểm tra kết nối

1. Khởi động server:
```bash
cd server
npm run dev
```

2. Kiểm tra logs để đảm bảo kết nối MongoDB thành công:
```
Kết nối MongoDB thành công
Database: mongodb://localhost:27017/bughunter
Server đang chạy tại http://localhost:5000
Environment: development
```

## 7. Tạo Admin User đầu tiên

Sau khi server chạy, bạn có thể tạo admin user đầu tiên bằng cách:

1. Đăng ký tài khoản với email được cấu hình trong `ADMIN_EMAIL`
2. Hoặc sử dụng MongoDB Compass để tạo user với role admin

## 8. Troubleshooting

### Lỗi kết nối MongoDB:
- Đảm bảo MongoDB service đang chạy
- Kiểm tra port 27017 có bị chiếm dụng không
- Kiểm tra connection string trong .env

### Lỗi permission:
- Đảm bảo MongoDB có quyền đọc/ghi vào thư mục data
- Trên Linux/macOS, kiểm tra quyền của thư mục `/data/db`

### Lỗi authentication:
- Kiểm tra JWT_SECRET đã được set
- Đảm bảo ADMIN_EMAIL được cấu hình đúng

## 9. Backup và Restore

### Backup:
```bash
mongodump --db bughunter --out backup/
```

### Restore:
```bash
mongorestore --db bughunter backup/bughunter/
```

## 10. Production Setup

Cho môi trường production:
- Sử dụng MongoDB Atlas (cloud)
- Cấu hình authentication
- Enable SSL/TLS
- Setup replica set cho high availability
- Cấu hình backup tự động
