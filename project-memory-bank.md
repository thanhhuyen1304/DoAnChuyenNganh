# BugHunter Project Memory Bank

## Last Updated: November 21, 2024

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
- ✅ Hồ sơ cá nhân: avatar, thông tin, ngôn ngữ yêu thích, XP, rank, huy hiệu
- ✅ Quản lý mật khẩu, cập nhật thông tin (Profile page với updateMe API)

#### Challenge System
- ✅ Chọn bài tập từ danh sách có sẵn bug (Syntax bug, Logic bug) - ProblemsList component
- ✅ Editor trực tuyến hỗ trợ nhiều ngôn ngữ - CodeEditor với Monaco Editor
- ✅ Chạy code trong môi trường sandbox an toàn (Judge0 API/Docker) - Judge0Service với self-hosted
- ✅ Nhận phản hồi ngay (test case Pass/Fail, thời gian chạy, lỗi) - SubmissionAnalysis component
- ✅ Lưu kết quả luyện tập vào hồ sơ - Submission model và routes

#### Gamification System
- ✅ Nhận XP khi sửa lỗi thành công - calculateXP function trong submission controller
- ✅ Tích lũy rank, huy hiệu theo thành tích - updateUserRank function, rank system (Newbie → Expert)
- ✅ Leaderboard toàn hệ thống (top điểm, top PvP, sự kiện) - Leaderboard component và routes

#### PvP Challenge System
- ❌ Tạo phòng hoặc tham gia phòng đấu trực tiếp
- ❌ Thời gian thực: đếm ngược, so sánh kết quả submit
- ❌ Xếp hạng người thắng dựa trên tốc độ & số test case pass

### 2. Admin Features
#### User Management
- ✅ Xem danh sách user, tìm kiếm, khóa/mở tài khoản - User routes và controllers
- ✅ Theo dõi tiến độ luyện tập, thành tích - Progress tracking API (getMyProgress, getProgressByUsername)

#### Challenge Management
- ✅ CRUD bài tập (tạo, sửa, xóa) - Challenge controller và Admin Dashboard
- ✅ Phân loại độ khó, loại bug, gắn tag (syntax, logic, performance) - Challenge model với difficulty, category, tags
- ✅ Quản lý test case: input, output, chấm điểm - TestCase schema với points, isHidden

#### Event & PvP Management
- ❌ Tạo giải đấu định kỳ, xếp hạng user
- ❌ Theo dõi số lượng người tham gia, thống kê kết quả

### 3. AI/ML/DL Features
#### AI Debug Assistant
- ✅ Phân tích lỗi trả về từ sandbox, đọc stacktrace - AIAnalysisService với error analysis
- ✅ Gợi ý nguyên nhân và cách khắc phục - Code suggestions và recommendations
- ✅ Đưa ra snippet mẫu - CodeSuggestions với suggestedCode
- ✅ Hỗ trợ đa ngôn ngữ lập trình - Support Python, JavaScript, Java, C++, C#, C
- ✅ Tích hợp Gemini AI (gemini-pro, gemini-1.5-flash, gemini-1.5-pro) với fallback rule-based

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
- **Sandbox**: Judge0 API self-hosted với Docker Compose (có fallback mechanisms)

### Frontend
- **Framework**: React 18 với TypeScript
- **Styling**: TailwindCSS
- **State Management**: Redux Toolkit + Redux Persist
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **UI Components**: Headless UI + Heroicons
- **Real-time**: Socket.IO (cho PvP)

### AI/ML/DL
- **APIs**: Google Gemini API (gemini-pro, gemini-1.5-flash, gemini-1.5-pro) với fallback rule-based
- **Frameworks**: TensorFlow/PyTorch (chưa implement)
- **NLP**: Rule-based error analysis với Gemini AI integration

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
   - ✅ Submission Model cho kết quả làm bài (với AI analysis, execution results)
   - ❌ Badge Model (chưa có model riêng, chỉ có field trong User)
   - ✅ Ranking System (tính toán từ XP, không cần model riêng)
   - ❌ PvP Room Model
   - ✅ Test Case Model (embedded trong Challenge)

3. **Services**
   - ✅ Judge0Service - Code execution với Judge0 API
   - ✅ AIAnalysisService - AI analysis với Gemini và rule-based fallback
   - ✅ Error handling và fallback mechanisms

3. **API Routes**
   - ✅ Auth Routes với validation
   - ✅ Challenge Routes (CRUD + admin functions)
   - ✅ User Profile Routes (getMyProgress, updateMe, getProgressByUsername)
   - ✅ Submission Routes (submit, getUserSubmissions, getAllUserSubmissions, getSubmissionById, getUserSubmissionStats)
   - ✅ Ranking Routes (Leaderboard routes với getTopLearners)
   - ❌ PvP Routes
   - ✅ Admin Routes (challenge management, scraper, import-export)

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
   - ✅ Dashboard - Dashboard.tsx với user stats và progress
   - ✅ Challenge List - ProblemsList component
   - ✅ Challenge Detail - ProblemDetail component
   - ✅ Code Editor - CodeEditor với Monaco Editor, syntax highlighting, submit functionality
   - ✅ Submission Form - Integrated trong CodeEditor với handleSubmit
   - ✅ Profile Page - Profile.tsx với progress tracking, edit profile
   - ✅ Leaderboard - Leaderboard component và page
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
- ✅ Hoàn thiện hệ thống authentication - COMPLETE
- ✅ Xây dựng Challenge system cơ bản - COMPLETE
- ✅ Implement Code Editor với syntax highlighting - COMPLETE
- ✅ Tích hợp Judge0 API cho code execution - COMPLETE với self-hosted Judge0
- 🔄 Cải thiện error handling và edge cases cho production
- 🔄 Hoàn thiện PvP System

## Next Steps (Priority Order)
1. **Phase 1: Core Features** ✅ COMPLETE
   - ✅ Hoàn thiện OAuth integration
   - ✅ Implement Challenge model và routes
   - ✅ Xây dựng Code Editor component
   - ✅ Tích hợp Judge0 API

2. **Phase 2: Gamification** ✅ COMPLETE
   - ✅ Implement XP và ranking system
   - 🔄 Tạo Badge system (UI có nhưng chưa có backend logic)
   - ✅ Xây dựng Leaderboard

3. **Phase 3: PvP System** ❌ NOT STARTED
   - ❌ Implement Socket.IO
   - ❌ Tạo PvP room system
   - ❌ Real-time competition features

4. **Phase 4: AI Features** ✅ MOSTLY COMPLETE
   - ✅ Tích hợp Gemini AI (thay vì OpenAI)
   - ✅ Implement AI Debug Assistant
   - ❌ Personalization system (ML-based)

5. **Phase 5: Admin Panel** ✅ COMPLETE
   - ✅ Admin dashboard
   - ✅ Challenge management
   - ✅ User management (basic)

## Known Issues
1. ✅ TypeScript errors in auth controller (Fixed: October 2, 2025)
2. ❌ Missing environment variable validation
3. ✅ Incomplete error handling (Đã cải thiện với fallback mechanisms)
4. ✅ OAuth callback implementation needs review (Đã hoàn thiện)
5. ✅ No input validation middleware (Đã có express-validator)
6. ❌ Missing rate limiting
7. ✅ Judge0 system errors trên Windows (Đã có fallback mechanism, không ảnh hưởng chức năng)

## Recent Changes Log

### November 21, 2024 - Major Features Complete
- ✅ **Challenge System Complete**: 
  - CodeEditor component với Monaco Editor
  - Submission system với Judge0 integration
  - Test cases execution và feedback
  - ProblemDetail và ProblemsList components
- ✅ **Gamification Complete**:
  - XP system với calculateXP function
  - Ranking system (Newbie → Expert) với updateUserRank
  - Leaderboard component và API
- ✅ **AI Analysis Complete**:
  - AIAnalysisService với Gemini AI integration
  - Error analysis, code suggestions, recommendations
  - Fallback to rule-based analysis
- ✅ **User Features Complete**:
  - Profile page với progress tracking
  - Dashboard với user stats
  - User routes và controllers
- ✅ **Judge0 Integration**:
  - Self-hosted Judge0 với Docker Compose
  - Fallback mechanisms cho Windows compatibility
  - Error handling và validation

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