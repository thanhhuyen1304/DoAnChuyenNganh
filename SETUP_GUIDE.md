# Hướng dẫn Setup BugHunter Project

## 📋 Tổng quan
BugHunter là nền tảng web học lập trình thông qua việc sửa lỗi code thực tế. Dự án sử dụng MERN stack với TypeScript.

## 🛠️ Yêu cầu hệ thống
- Node.js (v18 hoặc cao hơn)
- MongoDB (v6.0 hoặc cao hơn)
- npm hoặc yarn
- Git

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd bughunter
```

### 2. Cài đặt dependencies

#### Backend (Server)
```bash
cd server
npm install
```

#### Frontend (Client)
```bash
cd client
npm install
```

### 3. Cấu hình MongoDB

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

# Ubuntu
sudo systemctl start mongod
```

#### Cài đặt MongoDB Compass
Tải và cài đặt từ: https://www.mongodb.com/products/compass

### 4. Cấu hình Environment Variables

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

# Judge0 API (for code execution)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-judge0-api-key

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
```

## 🚀 Chạy dự án

### 1. Setup Database
```bash
cd server
npm run setup-db
```

Script này sẽ:
- Tạo admin user với email `admin@bughunter.com` và password `admin123`
- Tạo 3 sample challenges
- Hiển thị thống kê database

### 2. Khởi động Backend
```bash
cd server
npm run dev
```

Server sẽ chạy tại: http://localhost:5000

### 3. Khởi động Frontend
```bash
cd client
npm run dev
```

Client sẽ chạy tại: http://localhost:3000

## 👤 Tài khoản Admin

Sau khi chạy setup-db, bạn có thể đăng nhập admin:
- **Email**: admin@bughunter.com
- **Password**: admin123
- **URL**: http://localhost:3000/login

⚠️ **Lưu ý**: Hãy thay đổi mật khẩu admin sau khi đăng nhập lần đầu!

## 📁 Cấu trúc dự án

```
bughunter/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── admin/      # Admin components
│   │   │   └── ui/         # UI components
│   │   └── ...
│   └── package.json
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration files
│   │   └── app.ts
│   ├── scripts/            # Database setup scripts
│   └── package.json
├── MONGODB_SETUP.md        # Hướng dẫn setup MongoDB
└── SETUP_GUIDE.md          # File này
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Challenges (Public)
- `GET /api/challenges` - Lấy danh sách bài tập
- `GET /api/challenges/:id` - Lấy chi tiết bài tập

### Challenges (Admin)
- `POST /api/challenges` - Tạo bài tập mới
- `PUT /api/challenges/:id` - Cập nhật bài tập
- `DELETE /api/challenges/:id` - Xóa bài tập
- `PATCH /api/challenges/:id/toggle-status` - Bật/tắt bài tập
- `GET /api/challenges/admin/stats` - Thống kê admin

## 🎯 Tính năng đã hoàn thành

### ✅ Backend
- [x] Kết nối MongoDB với Mongoose
- [x] User model với authentication
- [x] Challenge model với đầy đủ trường
- [x] Submission model cho kết quả làm bài
- [x] JWT authentication middleware
- [x] Admin role system
- [x] CRUD operations cho challenges
- [x] Input validation với express-validator
- [x] Error handling middleware
- [x] Environment configuration

### ✅ Frontend
- [x] Login/Register components
- [x] Admin dashboard
- [x] Challenge management interface
- [x] Form validation
- [x] Error handling
- [x] Responsive design

## 🔄 Tính năng sắp tới

### 📋 Phase 1: Core Features
- [ ] Code Editor với syntax highlighting
- [ ] Judge0 API integration cho code execution
- [ ] Challenge submission system
- [ ] User profile management
- [ ] Basic gamification (XP, ranks)

### 📋 Phase 2: Advanced Features
- [ ] PvP Challenge system
- [ ] Real-time leaderboard
- [ ] Badge system
- [ ] AI Debug Assistant
- [ ] Personalized learning paths

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB service
sudo systemctl status mongod

# Khởi động lại MongoDB
sudo systemctl restart mongod
```

### Lỗi CORS
- Đảm bảo `CLIENT_URL` trong .env đúng với frontend URL
- Kiểm tra CORS configuration trong server/app.ts

### Lỗi JWT
- Đảm bảo `JWT_SECRET` được set trong .env
- Kiểm tra token có được gửi đúng trong Authorization header

### Lỗi validation
- Kiểm tra input data có đúng format không
- Xem server logs để biết chi tiết lỗi validation

## 📚 Tài liệu tham khảo

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới [MIT License](LICENSE).

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra [Issues](../../issues) hiện có
2. Tạo issue mới với thông tin chi tiết
3. Liên hệ qua email: support@bughunter.com

---

**Chúc bạn coding vui vẻ! 🚀**
