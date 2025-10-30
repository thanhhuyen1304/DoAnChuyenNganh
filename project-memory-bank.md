# BugHunter Project Memory Bank

## Last Updated: December 28, 2024

## Project Overview
- **Name**: BugHunter
- **Type**: Web Application - Bug Fixing Learning Platform
- **Architecture**: Client-Server
- **Stack**: MERN (MongoDB, Express, React, Node.js) with TypeScript
- **Target**: Học lập trình thông qua việc sửa lỗi code thực tế

## Project Goals & Vision
- Xây dựng nền tảng web hỗ trợ người học lập trình tìm hiểu và sửa lỗi code
- Hỗ trợ đa ngôn ngữ: Python, C++, Java, C#, C, JavaScript
- Rèn kỹ năng debugging, tư duy logic, coding clean
- Môi trường thi đấu, luyện tập với gamification
- Ứng dụng AI/ML/DL để phân tích lỗi và cá nhân hóa học tập

## Core Features

### 1. User Features
#### Account Management
- ✅ Đăng ký/Đăng nhập với email và password
- ✅ OAuth Integration (Google, GitHub, Facebook) - COMPLETE
- ✅ User Model với trường loginMethod để lưu phương thức đăng nhập
- ✅ JWT Authentication với role-based access
- ✅ OAuth Buttons trên frontend (Login & Register)
- ✅ OAuth Callback & Error Handlers
- ❌ Hồ sơ cá nhân: avatar, thông tin, ngôn ngữ yêu thích, XP, rank, huy hiệu
- ❌ Quản lý mật khẩu, cập nhật thông tin

#### Challenge System
- ❌ Chọn bài tập từ danh sách có sẵn bug (Syntax bug, Logic bug)
- ❌ Editor trực tuyến hỗ trợ nhiều ngôn ngữ
- ❌ Chạy code trong môi trường sandbox an toàn (Judge0 API/Docker)
- ❌ Nhận phản hồi ngay (test case Pass/Fail, thời gian chạy, lỗi)
- ❌ Lưu kết quả luyện tập vào hồ sơ

#### Gamification System
- ❌ Nhận XP khi sửa lỗi thành công
- ❌ Tích lũy rank, huy hiệu theo thành tích
- ❌ Leaderboard toàn hệ thống (top điểm, top PvP, sự kiện)

#### PvP Challenge System
- ❌ Tạo phòng hoặc tham gia phòng đấu trực tiếp
- ❌ Thời gian thực: đếm ngược, so sánh kết quả submit
- ❌ Xếp hạng người thắng dựa trên tốc độ & số test case pass

### 2. Admin Features
#### User Management
- ❌ Xem danh sách user, tìm kiếm, khóa/mở tài khoản
- ❌ Theo dõi tiến độ luyện tập, thành tích

#### Challenge Management
- ❌ CRUD bài tập (tạo, sửa, xóa)
- ❌ Phân loại độ khó, loại bug, gắn tag (syntax, logic, performance)
- ❌ Quản lý test case: input, output, chấm điểm

#### Event & PvP Management
- ❌ Tạo giải đấu định kỳ, xếp hạng user
- ❌ Theo dõi số lượng người tham gia, thống kê kết quả

### 3. AI/ML/DL Features
#### AI Debug Assistant
- ❌ Phân tích lỗi trả về từ sandbox, đọc stacktrace
- ❌ Gợi ý nguyên nhân và cách khắc phục
- ❌ Đưa ra snippet mẫu
- ❌ Hỗ trợ đa ngôn ngữ lập trình

#### Machine Learning - Personalization
- ❌ Ghi nhận lịch sử bug mà user thường gặp
- ❌ Gợi ý bài tập phù hợp trình độ và loại lỗi hay mắc
- ❌ Điều chỉnh độ khó tự động theo tiến bộ người dùng

#### Deep Learning - Error Classification
- ❌ NLP đọc message lỗi → phân loại (syntax, logic, runtime, performance, security)
- ❌ Đề xuất tài liệu/hướng dẫn liên quan

#### AI Mentor (Chatbot 24/7)
- ❌ Giải thích khái niệm lập trình, cú pháp
- ❌ Gợi ý mẹo sửa bug & best practices coding
- ❌ Cộng đồng chatbox, hoặc chat cá nhân (Idea cho 80%+ completion)

## Technical Stack

### Backend
- **Framework**: Express.js (có thể nâng cấp lên NestJS)
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT + Passport.js (Google, GitHub, Facebook OAuth)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Sandbox**: Judge0 API (ưu tiên) hoặc Docker self-host

### Frontend
- **Framework**: React 18 với TypeScript
- **Styling**: TailwindCSS
- **State Management**: Redux Toolkit + Redux Persist
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **UI Components**: Headless UI + Heroicons
- **Real-time**: Socket.IO (cho PvP)

### AI/ML/DL
- **APIs**: OpenAI API, HuggingFace Transformers
- **Frameworks**: TensorFlow/PyTorch
- **NLP**: Cho phân tích lỗi và chatbot

### DevOps
- **CI/CD**: GitHub Actions
- **Frontend Deploy**: Vercel/Netlify
- **Backend Deploy**: Railway/AWS

## Current Implementation Status

### Backend (server/)
1. **Authentication System**
   - ✅ Complete Controller Structure
   - ✅ JWT Implementation với role-based access
   - ✅ Login/Register Routes với validation
   - ✅ OAuth Integration (Google, GitHub, Facebook) - Complete
     - ✅ Passport.js strategies configured
     - ✅ OAuth callbacks với JWT token generation
     - ✅ User Model với loginMethod field
     - ✅ Routes: /google, /github, /facebook với callbacks
   - ✅ TypeScript Type Definitions
   - ✅ Error Handling với consistent response format
   - ✅ Admin role system
   - ❌ Rate Limiting
   - ❌ Email Verification

2. **Database Models**
   - ✅ User Model (Complete với OAuth, XP, rank, badges)
     - ✅ Fields: email, username, password, avatar
     - ✅ OAuth fields: oauth.google, oauth.github, oauth.facebook
     - ✅ loginMethod field để lưu phương thức đăng nhập ('local', 'google', 'github', 'facebook')
     - ✅ XP, rank, badges support
     - ✅ Password hashing với bcryptjs
   - ✅ Challenge Model với test cases và validation
   - ✅ Submission Model cho kết quả làm bài
   - ❌ Badge Model
   - ❌ Ranking Model
   - ❌ PvP Room Model
   - ✅ Test Case Model (embedded trong Challenge)

3. **API Routes**
   - ✅ Auth Routes với validation
   - ✅ Challenge Routes (CRUD + admin functions)
   - ❌ User Profile Routes
   - ❌ Submission Routes
   - ❌ Ranking Routes
   - ❌ PvP Routes
   - ✅ Admin Routes (challenge management)

4. **Middleware**
   - ✅ Authentication Middleware với role checking
   - ✅ Request Validation với express-validator
   - ✅ Error Handling Middleware
   - ✅ Admin role middleware
   - ❌ File Upload Middleware
   - ❌ Rate Limiting Middleware

### Frontend (client/)
1. **Authentication Pages**
   - ✅ Complete Layout với responsive design
   - ✅ Login Form với API integration
   - ✅ Register Form với validation
   - ✅ OAuth Buttons (Google, GitHub, Facebook) trong Login và Register
   - ✅ Form Validation với error handling
   - ✅ OAuth Callback handler (OAuthCallback.tsx và OAuthError.tsx)
   - ✅ Routes trong App.tsx
   - ❌ Password Reset

2. **Main Components**
   - ❌ Dashboard
   - ❌ Challenge List
   - ❌ Challenge Detail
   - ❌ Code Editor
   - ❌ Submission Form
   - ❌ Profile Page
   - ❌ Leaderboard
   - ❌ PvP Lobby
   - ❌ PvP Room

3. **Common Components**
   - ✅ UI Components (shadcn/ui)
   - ✅ Loading States
   - ✅ Error Messages
   - ✅ Success Messages
   - ✅ Alert Components
   - ❌ Modal Components

4. **Admin Components**
   - ✅ Admin Dashboard với tabs
   - ✅ Challenge Management (CRUD)
   - ✅ Challenge creation form với test cases
   - ✅ Statistics display
   - ❌ User Management
   - ❌ Event Management

## Security Implementation
- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ CORS Configuration
- ✅ Helmet Security Headers
- ❌ XSS Protection
- ❌ CSRF Protection
- ❌ Rate Limiting
- ❌ Input Sanitization

## Performance Considerations
- ❌ API Caching
- ❌ Image Optimization
- ❌ Code Splitting
- ❌ Load Balancing
- ❌ Database Indexing
- ❌ Redis Caching

## Testing Strategy
- ❌ Unit Tests (Jest)
- ❌ Integration Tests
- ❌ E2E Tests (Playwright)
- ❌ Performance Tests
- ❌ API Tests

## Current Focus
- Hoàn thiện hệ thống authentication
- Xây dựng Challenge system cơ bản
- Implement Code Editor với syntax highlighting
- Tích hợp Judge0 API cho code execution

## Next Steps (Priority Order)
1. **Phase 1: Core Features**
   - Hoàn thiện OAuth integration
   - Implement Challenge model và routes
   - Xây dựng Code Editor component
   - Tích hợp Judge0 API

2. **Phase 2: Gamification**
   - Implement XP và ranking system
   - Tạo Badge system
   - Xây dựng Leaderboard

3. **Phase 3: PvP System**
   - Implement Socket.IO
   - Tạo PvP room system
   - Real-time competition features

4. **Phase 4: AI Features**
   - Tích hợp OpenAI API
   - Implement AI Debug Assistant
   - Personalization system

5. **Phase 5: Admin Panel**
   - Admin dashboard
   - Challenge management
   - User management

## Known Issues
1. ✅ TypeScript errors in auth controller (Fixed: October 2, 2025)
2. ❌ Missing environment variable validation
3. ❌ Incomplete error handling
4. ❌ OAuth callback implementation needs review
5. ❌ No input validation middleware
6. ❌ Missing rate limiting

## Recent Changes Log

### December 28, 2024 - OAuth Implementation Complete
- ✅ **Backend OAuth Complete**: 
  - Passport.js strategies configured cho Google, GitHub, Facebook
  - OAuth routes với callbacks
  - User model có loginMethod field để lưu phương thức đăng nhập
  - JWT token generation trong OAuth callbacks
- ✅ **Frontend OAuth Complete**: 
  - OAuth buttons đã được thêm vào Login và Register components
  - OAuth callback handler page đã được tạo
  - OAuth error handler page đã được tạo
  - Routes đã được cập nhật trong App.tsx

### December 19, 2024 - Major Update
- ✅ **Database Setup**: Thiết lập MongoDB với Mongoose và environment configuration
- ✅ **Models**: Tạo Challenge và Submission models với validation đầy đủ
- ✅ **Authentication**: Hoàn thiện auth system với admin role và consistent response format
- ✅ **Admin System**: Tạo CRUD operations cho challenge management
- ✅ **Frontend**: Cập nhật auth components với API integration
- ✅ **Admin Dashboard**: Tạo admin interface với challenge management và statistics
- ✅ **Setup Scripts**: Tạo database setup script với sample data
- ✅ **Documentation**: Tạo hướng dẫn setup MongoDB và chạy dự án
- ✅ **Environment**: Cấu hình environment variables và validation
- ✅ **Routes**: Tạo challenge routes với validation và admin protection

### October 2, 2025
- ✅ Fixed TypeScript errors in auth.controller.ts
- ✅ Added proper type definitions for auth middleware
- ✅ Improved JWT token generation logic

## Project Structure
```
bughunter/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── auth/      # Authentication components
│   │   ├── pages/         # Page components (empty)
│   │   ├── styles/        # Styling files (empty)
│   │   └── App.tsx
│   └── package.json
├── server/                # Express Backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── config/        # Configuration files
│   │   └── app.ts
│   └── package.json
└── project-memory-bank.md
```

## Legend
- ✅ Completed
- 🔄 In Progress
- ❌ Not Started/Pending

## Notes
- Cần validate environment variables trước khi deploy
- Consider implementing refresh tokens
- Cần thêm input validation middleware
- Consider adding rate limiting cho auth routes
- Cần implement proper error handling middleware
- Consider upgrading từ Express lên NestJS cho scalability