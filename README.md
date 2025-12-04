# BugHunter - Nền tảng Học Lập trình Qua Sửa Lỗi Code

## 📋 Tổng quan
BugHunter là nền tảng web học lập trình thông qua việc sửa lỗi code thực tế. Hệ thống hỗ trợ nhiều ngôn ngữ lập trình và tích hợp các tính năng PvP, AI analysis để nâng cao trải nghiệm học tập.

## ✨ Tính năng chính
- **Hệ thống tài khoản**: Đăng ký/đăng nhập với OAuth (Google, GitHub, Facebook)
- **Challenges**: Hệ thống bài tập với các lỗi code thực tế
- **Code Editor**: Editor trực tuyến với syntax highlighting (Monaco Editor)
- **Judge0 Integration**: Chạy code trong môi trường sandbox an toàn
- **AI Analysis**: Phân tích lỗi và gợi ý sửa code với Google Gemini
- **PvP System**: Đấu đối kháng thời gian thực với Elo rating
- **Leaderboard**: Bảng xếp hạng Practice và PvP
- **Friend System**: Kết bạn và thi đấu với bạn bè
- **Gamification**: XP, ranking, badges, achievements

## 🏗️ Kiến trúc
- **Frontend**: React 18 + TypeScript + TailwindCSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT + Passport.js (OAuth)
- **Code Execution**: Judge0 self-hosted với Docker
- **Real-time**: Socket.IO (WebSocket)
- **AI**: Google Gemini API với fallback rule-based

## 🚀 Quick Start

### Yêu cầu
- Node.js 18+
- MongoDB 5.0+
- Docker & Docker Compose

### Cài đặt nhanh

```bash
# 1. Clone repository
git clone <repository-url>
cd DoAnChuyenNganh

# 2. Install dependencies
cd server && npm install

# 2.1. Cài đặt socket.io và types cho server (nếu thiếu)
cd server && npm install socket.io @types/socket.io

# 2.2. Install client dependencies
cd ../client && npm install

# 2.3. Cài đặt socket.io-client cho client (nếu thiếu)
cd client && npm install socket.io-client

# 3. Start MongoDB
net start MongoDB  # Windows
# hoặc
brew services start mongodb-community  # macOS

# 4. Setup Judge0 với Docker
docker-compose up -d

# 5. Copy và cấu hình .env
cd server
cp .env.example .env
# Chỉnh sửa các biến môi trường cần thiết

# 6. Start backend
npm run dev

# 7. Start frontend (terminal mới)
cd ../client
npm run dev
```

**Truy cập:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👤 Tài khoản Admin
- **Email**: admin@bughunter.com
- **Password**: admin123

⚠️ Đổi mật khẩu sau khi đăng nhập lần đầu!

## 📚 Tài liệu

### 🔧 Setup & Installation
- **[docs/setup/INSTALLATION.md](docs/setup/INSTALLATION.md)** - Hướng dẫn cài đặt chi tiết
- **[docs/setup/DOCKER_JUDGE0.md](docs/setup/DOCKER_JUDGE0.md)** - Setup Docker và Judge0

### 🎮 PvP System
- **[docs/pvp/OVERVIEW.md](docs/pvp/OVERVIEW.md)** - Tổng quan hệ thống PvP
- **[docs/pvp/USER_GUIDE.md](docs/pvp/USER_GUIDE.md)** - Hướng dẫn sử dụng PvP
- **[docs/pvp/DATABASE_SETUP.md](docs/pvp/DATABASE_SETUP.md)** - Setup database cho PvP
- **[docs/pvp/TESTING.md](docs/pvp/TESTING.md)** - Hướng dẫn test PvP
- **[docs/pvp/CHANGELOG.md](docs/pvp/CHANGELOG.md)** - Lịch sử thay đổi

### 🌟 Features
- **[docs/features/LEADERBOARD.md](docs/features/LEADERBOARD.md)** - Hệ thống bảng xếp hạng
- **[docs/features/AI_INTEGRATION.md](docs/features/AI_INTEGRATION.md)** - Tích hợp AI

### 🐛 Troubleshooting
- **[docs/troubleshooting/DEBUG_GUIDE.md](docs/troubleshooting/DEBUG_GUIDE.md)** - Hướng dẫn debug

### 📖 Chi tiết hơn
- **[docs/PVP_GUIDE.md](docs/PVP_GUIDE.md)** - PvP guide (legacy)
- **[docs/PVP_COMPETITION_DESIGN.md](docs/PVP_COMPETITION_DESIGN.md)** - Competition design
- **[docs/AI_GUIDE.md](docs/AI_GUIDE.md)** - AI guide (legacy)
- **[docs/INSTALLATION.md](docs/INSTALLATION.md)** - Installation (legacy)
- **[docs/JUDGE0_SETUP.md](docs/JUDGE0_SETUP.md)** - Judge0 setup (legacy)

## 📁 Cấu trúc dự án

```
DoAnChuyenNganh/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   │   ├── auth/       # Authentication
│   │   │   ├── admin/      # Admin dashboard
│   │   │   ├── practice/   # Practice mode
│   │   │   ├── simplePvp/  # PvP system
│   │   │   └── ui/         # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── ...
├── server/                # Express Backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Custom middleware
│   │   └── ...
│   ├── scripts/           # Utility scripts
│   └── ...
├── docs/                  # 📚 Documentation
│   ├── setup/            # Setup guides
│   ├── pvp/              # PvP documentation
│   ├── features/         # Feature docs
│   └── troubleshooting/  # Debug guides
├── docker-compose.yml     # Docker configuration
└── README.md             # This file
```

## 🎯 Tính năng đã hoàn thành

### ✅ Backend
- [x] Kết nối MongoDB với Mongoose
- [x] Authentication với JWT và OAuth
- [x] User management với role-based access
- [x] Challenge CRUD operations
- [x] Submission system với Judge0 integration
- [x] AI analysis cho code submissions
- [x] PvP system với real-time communication
- [x] Friend system với real-time notifications
- [x] Leaderboard và statistics
- [x] WebSocket cho real-time updates

### ✅ Frontend
- [x] Authentication pages với OAuth buttons
- [x] Code editor với Monaco Editor
- [x] Challenge list và detail pages
- [x] Submission analysis với AI feedback
- [x] PvP arena với real-time updates
- [x] Friend management UI
- [x] Combined leaderboard modal
- [x] Admin dashboard
- [x] Responsive design
- [x] Dark mode support

## 🔄 API Endpoints

### Authentication
```
POST /api/auth/register       - Đăng ký
POST /api/auth/login          - Đăng nhập
GET  /api/auth/me             - Thông tin user
GET  /api/auth/google         - OAuth Google
GET  /api/auth/github         - OAuth GitHub
GET  /api/auth/facebook       - OAuth Facebook
```

### Challenges
```
GET    /api/challenges        - Danh sách challenges
GET    /api/challenges/:id    - Chi tiết challenge
POST   /api/challenges        - Tạo challenge (admin)
PUT    /api/challenges/:id    - Cập nhật (admin)
DELETE /api/challenges/:id    - Xóa (admin)
```

### PvP System
```
GET    /api/pvp/rooms         - Danh sách phòng
POST   /api/pvp/rooms         - Tạo phòng
POST   /api/pvp/rooms/:id/join - Tham gia phòng
GET    /api/pvp/leaderboard   - Bảng xếp hạng PvP
GET    /api/pvp/stats/me      - Thống kê của tôi
```

### Friends
```
GET    /api/friends           - Danh sách bạn bè
POST   /api/friends/request   - Gửi lời mời
PUT    /api/friends/:id       - Chấp nhận/từ chối
DELETE /api/friends/:id       - Xóa bạn
```

### Leaderboard
```
GET /api/leaderboard/practice  - Bảng xếp hạng Practice
GET /api/pvp/leaderboard       - Bảng xếp hạng PvP
```

## 🐛 Troubleshooting

### Lỗi thường gặp

**MongoDB không kết nối:**
```bash
# Kiểm tra và start MongoDB
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

**Port 5000 đã được sử dụng:**
```bash
# Tìm và kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Judge0 không hoạt động:**
```bash
# Kiểm tra containers
docker-compose ps

# Restart
docker-compose restart judge0
```

Xem thêm: [docs/troubleshooting/DEBUG_GUIDE.md](docs/troubleshooting/DEBUG_GUIDE.md)

## 🚀 Roadmap

### Phase 2
- [ ] Tournament mode
- [ ] Team battles (2v2)
- [ ] Spectator mode
- [ ] Code replay system
- [ ] Achievement system
- [ ] Learning paths
- [ ] Mobile app

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

MIT License - Xem [LICENSE](LICENSE) file

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](../../issues)
- **Email**: support@bughunter.com

---

**Made with ❤️ by BugHunter Team**

**Version:** 2.0.0 | **Last Updated:** 2025-12-01