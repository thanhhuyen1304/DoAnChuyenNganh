# BugHunter Project

## Tổng quan
BugHunter là nền tảng web học lập trình thông qua việc sửa lỗi code thực tế. Hệ thống hỗ trợ nhiều ngôn ngữ lập trình và tích hợp các tính năng PvP, AI analysis để nâng cao trải nghiệm học tập.

## Tính năng chính
- **Hệ thống tài khoản**: Đăng ký/đăng nhập với OAuth (Google, GitHub, Facebook)
- **Challenges**: Hệ thống bài tập với các lỗi code thực tế
- **Code Editor**: Editor trực tuyến với syntax highlighting
- **Judge0 Integration**: Chạy code trong môi trường sandbox an toàn
- **AI Analysis**: Phân tích lỗi và gợi ý sửa code
- **PvP System**: Đấu đối kháng thời gian thực
- **Gamification**: XP, ranking, leaderboard

## Kiến trúc
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT + Passport.js
- **Code Execution**: Judge0 (self-hosted với Docker)
- **AI**: Google Gemini API với fallback rule-based

## Quick Start

### Yêu cầu
- Node.js 18+
- MongoDB 5.0+
- Docker & Docker Compose

### Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd DoAnChuyenNganh
```

2. **Cài đặt dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Cấu hình môi trường**
```bash
# Tạo file .env trong thư mục server
cd server
cp .env.example .env
# Chỉnh sửa các biến môi trường cần thiết
```

4. **Setup Judge0 với Docker**
```bash
# Từ thư mục gốc
docker-compose up -d
```

5. **Khởi động MongoDB**
```bash
# Windows
net start MongoDB

# macOS/Linux
brew services start mongodb-community
# hoặc
sudo systemctl start mongod
```

6. **Khởi động ứng dụng**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

7. **Truy cập ứng dụng**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Tài khoản Admin
- **Email**: admin@bughunter.com
- **Password**: admin123

## Cấu trúc dự án
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
├── docker-compose.yml     # Docker Configuration
└── README.md
```

## Tài liệu hướng dẫn chi tiết
- [Hướng dẫn cài đặt chi tiết](docs/INSTALLATION.md)
- [Hướng dẫn Judge0 & Docker](docs/JUDGE0_SETUP.md)
- [Hướng dẫn PvP System](docs/PVP_GUIDE.md)
- [Hướng dẫn AI Integration](docs/AI_GUIDE.md)
- [Hướng dẫn Debug](docs/DEBUG_GUIDE.md)

## Tính năng đã hoàn thành

### Backend ✅
- Authentication với JWT và OAuth
- User management với role-based access
- Challenge CRUD operations
- Submission system với Judge0 integration
- AI analysis cho code submissions
- PvP system với real-time communication
- Leaderboard và statistics

### Frontend ✅
- Authentication pages với OAuth buttons
- Code editor với Monaco Editor
- Challenge list và detail pages
- Submission analysis với AI feedback
- PvP arena với real-time updates
- Admin dashboard
- Responsive design

## Contributing
1. Fork repository
2. Tạo feature branch
3. Implement changes với tests
4. Submit pull request

## License
MIT License