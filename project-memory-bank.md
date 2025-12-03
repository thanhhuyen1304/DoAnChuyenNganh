# BugHunter Project Memory Bank

## Last Updated: December 3, 2025

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
- ✅ **Settings Page** - User preferences and security
  - ✅ Theme toggle (Light/Dark mode)
  - ✅ Background customization with image upload
  - ✅ Language preference (Vietnamese/English)
  - ✅ Password change for local accounts
  - ✅ Account info display (email, username, login method)
  - ✅ Language preference persistence to database
- ✅ **Profile Page** - User profile with avatar, XP, rank, badges - COMPLETE
  - ✅ Avatar upload and management with drag-drop
  - ✅ User information display and edit (email, phone, username)
  - ✅ XP and rank display with progression
  - ✅ Badges showcase
  - ✅ Profile statistics and achievements
  - ✅ Favorite languages selection and display
  - ✅ Challenge completion tracking
  - ✅ Learning time statistics
  - ✅ Progress bars and ranking percentile
  - ✅ Edit/Save/Cancel functionality
  - ✅ Password change in profile
  - ✅ Responsive design with dark mode

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

### Admin Features
#### User Management
- ✅ User activity tracking
- ✅ User statistics viewing
- ✅ User report management

#### Challenge Management
- ✅ CRUD bài tập (tạo, sửa, xóa, import/export)
- ✅ Phân loại độ khó, loại bug, gắn tag (syntax, logic, performance)
- ✅ Quản lý test case: input, output, chấm điểm
- ✅ Problem scraper (auto scrape từ CSES.fi)
- ✅ Bulk import/export challenges

#### System Management
- ✅ System settings configuration
- ✅ Achievement management
- ✅ Training data management
- ✅ Admin dashboard with statistics

#### Event & PvP Management
- 🔄 Leaderboard system (implemented, being refined)
- ❌ Tạo giải đấu định kỳ, xếp hạng user
- ❌ Theo dõi số lượng người tham gia, thống kê kết quả

### 3. AI/ML/DL Features
#### AI Debug Assistant
- ✅ **ChatBox Component** - 24/7 AI Mentor integrated into frontend
  - ✅ Real-time chat interface with message history
  - ✅ Floating window (380px × 450px) on bottom-right corner
  - ✅ Responsive design with dark mode support
  - ✅ Message threading and conversation history
  - ✅ Code block syntax highlighting with highlight.js
  - ✅ Markdown rendering for AI responses
  - ✅ Chat session management (save/load/delete)
  - ✅ Copy message functionality
  - ✅ Message rating system (👍/👎)
  - ✅ Auto-scroll to latest messages

#### AdaptiveAI - Client-side Learning System
- ✅ Self-learning AI with localStorage persistence
  - ✅ Stores user interactions and learned patterns locally
  - ✅ Learns from user feedback (👍/👎 ratings)
  - ✅ Optional server sync endpoint for cross-device sync
  - ✅ Maintains conversation history with context awareness
  - ✅ Tracks user preferences and interaction patterns
  - ✅ JSON-based storage format for flexibility

#### Gemini Pro AI Integration
- ✅ **GeminiProAI Wrapper Class** - Google Generative AI integration
  - ✅ API Key configuration via environment variables (VITE_GEMINI_API_KEY)
  - ✅ Model: gemini-1.5-flash (latest lightweight model)
  - ✅ System prompt customization for BugHunter context
  - ✅ Conversation history management
  - ✅ Multi-turn conversation support
  - ✅ Temperature and token control
  - ✅ Proper error handling with detailed error messages
  - ✅ Request/response logging for debugging
  - ✅ Test connection utility for API validation

#### HybridAI - Multi-AI Strategy
- ✅ 3-tier AI response prioritization:
  1. AdaptiveAI (local learned patterns)
  2. Training data (pre-trained responses)
  3. Gemini Pro (cloud-based fallback)
- ✅ Automatic fallback mechanism if primary AI unavailable
- ✅ Response caching and optimization
- ✅ Error recovery and graceful degradation

#### Machine Learning - Personalization
- ❌ Ghi nhận lịch sử bug mà user thường gặp
- ❌ Gợi ý bài tập phù hợp trình độ và loại lỗi hay mắc
- ❌ Điều chỉnh độ khó tự động theo tiến bộ người dùng

#### Deep Learning - Error Classification
- ❌ NLP đọc message lỗi → phân loại (syntax, logic, runtime, performance, security)
- ❌ Đề xuất tài liệu/hướng dẫn liên quan

#### AI Mentor (Chatbot 24/7)
- ✅ Real-time AI assistant for programming help
- ✅ Natural Vietnamese language support
- ✅ Context-aware responses based on conversation history
- ✅ Code debugging and explanation capabilities
- ✅ Best practices and coding tips
- ✅ Algorithm and data structure guidance
- ✅ Multi-language programming support (Python, Java, C++, JavaScript, etc.)

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
   <!-- Xem lại 2 chức năng này -->
   - ❌ Rate Limiting
   - ❌ Email Verification

2. **Database Models**
   - ✅ User Model (Complete với OAuth, XP, rank, badges)
     - ✅ Fields: email, username, password, avatar
     - ✅ OAuth fields: oauth.google, oauth.github, oauth.facebook
     - ✅ loginMethod field để lưu phương thức đăng nhập ('local', 'google', 'github', 'facebook')
     - ✅ XP, rank, badges support
     - ✅ Password hashing với bcryptjs
     - ✅ Settings (theme, background, language)
     - ✅ Favorite languages tracking
   - ✅ Challenge Model với test cases và validation
   - ✅ Submission Model cho kết quả làm bài
   - ✅ Achievement Model (badges system)
   - ✅ Favorite Model (challenge favorites)
   - ✅ ChatHistory Model (conversation persistence)
   - ✅ TrainingData Model (AI training samples)
   - ✅ Report Model (user reports)
   - ✅ Feedback Model (user feedback)
   - ✅ SystemSettings Model (admin configuration)
   - ✅ Test Case Model (embedded trong Challenge)

3. **Services**
   - ✅ Judge0Service - Code execution với Judge0 API
   - ✅ AIAnalysisService - AI analysis với Gemini và rule-based fallback
   - ✅ Error handling và fallback mechanisms

3. **API Routes**
   - ✅ Auth Routes với validation
   - ✅ Challenge Routes (CRUD + admin functions)
   - ✅ User Routes (profile management)
   - ✅ Favorite Routes (challenge favorites)
   - ✅ Admin Routes (challenge management)
   - ✅ Scraper Routes (problem scraping)
   - ✅ Report Routes (user reports)
   - ✅ Feedback Routes (user feedback)
   - ✅ Achievement Routes (badges & achievements)
   - ✅ System Settings Routes (admin settings)
   - ✅ Chat Routes (chatbox messages)
   - ✅ Leaderboard Routes (ranking system)
   - ✅ Training Data Routes (AI training data management)

4. **Middleware**
   - ✅ Authentication Middleware với role checking
   - ✅ Request Validation với express-validator
   - ✅ Error Handling Middleware
   - ✅ Admin role middleware
   - ✅ File Upload Middleware
   - ✅ Rate Limiting Middleware (OAuth & password reset endpoints)

### Frontend (client/)
1. **Authentication Pages**
   - ✅ Complete Layout với responsive design
   - ✅ Login Form với API integration
   - ✅ Register Form với validation
   - ✅ OAuth Buttons (Google, GitHub, Facebook) trong Login và Register
   - ✅ Form Validation với error handling
   - ✅ OAuth Callback handler (OAuthCallback.tsx và OAuthError.tsx)
   - ✅ Routes trong App.tsx
   - ✅ **Password Reset** (ForgotPassword.tsx)
     - ✅ Request reset code via email/phone
     - ✅ Verify reset code and set new password
     - ✅ RequestResetForm component with SMS/Email support
     - ✅ VerifyResetForm component with OTP verification
     - ✅ Rate limiting for reset requests
     - ✅ 10-minute code expiration
     - ✅ Backend routes: /request-reset, /verify-reset

2. **Main Components**
   - ✅ **ClientDashboard** - User dashboard with activity streak
   - ✅ Challenge List
   - ❌ Challenge Detail
   - ❌ Code Editor
   - ❌ Submission Form
   - ✅ **Profile Page** - User profile with avatar, XP, rank, badges (COMPLETE)
     - ✅ Avatar upload with drag-drop and preview
     - ✅ User info editing (email, phone)
     - ✅ XP and rank display with progression bars
     - ✅ Badges showcase
     - ✅ Favorite languages selection
     - ✅ Challenge completion stats
     - ✅ Learning time tracking
     - ✅ Ranking percentile display
     - ✅ Password change functionality
   - ✅ **Settings Page** - User preferences and security (IMPLEMENTED)
     - ✅ Theme settings
     - ✅ Background customization
     - ✅ Language preferences
     - ✅ Password management
     - ✅ Account information display
   - ✅ Leaderboard (UI component ready)
   - ❌ PvP Lobby
   - ❌ PvP Room
   - ✅ **ChatBox Component** - Full-featured AI chat interface
     - ✅ Floating chat window with minimize/maximize
     - ✅ Chat history sidebar
     - ✅ Multi-turn conversation support
     - ✅ Message copy functionality
     - ✅ Code syntax highlighting
     - ✅ Markdown message rendering
     - ✅ Session management (new/load/delete)
     - ✅ Message statistics dashboard
   - ✅ **NotificationBox Component** - Real-time notifications
   - ✅ **Header Component** - Navigation with language switcher

3. **Common Components**
   - ✅ UI Components (shadcn/ui)
   - ✅ Loading States
   - ✅ Error Messages
   - ✅ Success Messages
   - ✅ Alert Components
   - ❌ Modal Components

3. **Admin Components**
   - ✅ Admin Dashboard với tabs
   - ✅ Challenge Management (CRUD, Import/Export)
   - ✅ Challenge creation form với test cases
   - ✅ Problem Scraper (CSES.fi scraping)
   - ✅ Advanced Scraper for various sources
   - ✅ Statistics display
   - ✅ Training Data Management (CRUD, Extract from Chat)
   - ✅ API Tester component
   - ✅ Database Debugger component
   - ✅ Challenge Import/Export feature
   - ✅ User Management (view user data)
   - ✅ Achievement Management (badges system)

## Security Implementation
- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ CORS Configuration
- ✅ Helmet Security Headers
- ✅ Environment variable protection
- ✅ OAuth secure token handling
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

## Technical Improvements (November 17, 2025)
- ✅ **API Configuration**: Centralized API base URL management
  - getApiBase() helper function
  - Environment variable VITE_API_URL for dynamic configuration
  - Automatic /api path handling
- ✅ **Code Quality**:
  - TypeScript strict type checking
  - Proper error handling with type safety
  - Error message logging for debugging
  - Removed all hard-coded localhost URLs
- ✅ **Environment Configuration**:
  - VITE_GEMINI_API_KEY for API security
  - VITE_API_URL for backend endpoint configuration
  - OAuth credentials in environment variables
- ✅ **Routing Improvements**:
  - OAuth redirect routes for backwards compatibility
  - Proper Express middleware ordering
  - CORS configured for frontend requests

## Testing Strategy
- ❌ Unit Tests (Jest)
- ❌ Integration Tests
- ❌ E2E Tests (Playwright)
- ❌ Performance Tests
- ❌ API Tests

## Current Focus
- ✅ Hoàn thiện hệ thống authentication (OAuth + JWT)
- ✅ Implement AI chatbot with self-learning capabilities
- ✅ Standardize API configuration across frontend
- ✅ Challenge system CRUD operations
- ✅ User dashboard and statistics
- ✅ Admin dashboard with extended features
- ✅ Training data management system
- ✅ Problem scraper integration
- 🔄 Leaderboard system refinement
- ❌ Implement Code Editor với syntax highlighting
- ❌ Tích hợp Judge0 API cho code execution

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

## Known Issues & Improvements Needed
1. ✅ TypeScript errors in auth controller (Fixed: October 2, 2025)
2. ✅ Hard-coded API URLs causing double /api/api paths (Fixed: November 17, 2025)
3. ✅ Gemini API model deprecation - updated to gemini-1.5-flash (Fixed: November 17, 2025)
4. ✅ OAuth routes returning 404 - added redirect routes (Fixed: November 17, 2025)
5. ✅ Mongoose duplicate index warning (Fixed: November 17, 2025)
6. ❌ Missing environment variable validation Thiếu Xác Thực Biến Môi Trường 
    Mục Đích: Kiểm tra tất cả các biến môi trường cần thiết tồn tại và có giá trị đúng trước khi ứng dụng khởi động.
7. ❌ Incomplete error handling for edge cases Xử Lý Lỗi Không Hoàn Chỉnh
    Mục Đích: Xử lý các tình huống lỗi bất ngờ để ứng dụng không crash.
8. ❌ No input validation middleware for all routes Thiếu Xác Thực Input
    Mục Đích: Kiểm tra dữ liệu từ user trước khi xử lý để tránh dữ liệu sai.
9. ❌ Missing rate limiting for API endpoints Thiếu Rate Limiting cho API
    Mục Đích: Giới hạn số request để tránh brute force và abuse API.
10. ❌ Challenge system execution (Judge0 integration)
11. ❌ Server sync endpoint for AdaptiveAI not yet fully tested
12. ❌ PvP real-time features (Socket.io integration needed)

## Recent Changes Log

### December 2, 2025 - File Upload Middleware & Advanced AI Features Complete
- ✅ **File Upload Middleware Implementation** (`server/src/middleware/upload.ts`):
  - ✅ Single file upload with disk storage (multer integration)
  - ✅ Multiple files upload (max 5 files per request)
  - ✅ Image upload middleware (JPEG, PNG, GIF, WebP)
  - ✅ Document upload middleware (JSON, TXT, PDF)
  - ✅ Avatar-specific upload middleware (optimized for user avatars)
  - ✅ Memory storage upload (for file processing in memory)
  - ✅ File validation (size limit: 10MB, type checking, MIME validation)
  - ✅ Automatic directory management:
    - ✅ uploads/images for image files
    - ✅ uploads/documents for document files
    - ✅ uploads/avatars for user avatars
    - ✅ uploads/general for mixed files
  - ✅ Comprehensive error handling (MulterError, file size, invalid type)
  - ✅ Helper utilities:
    - ✅ `getFileUrl()` - Get public file URL
    - ✅ `deleteFile()` - Delete uploaded file
    - ✅ `cleanupOldFiles()` - Auto cleanup files older than 7 days
  - ✅ Express middleware integration with error handler

- ✅ **Knowledge Graph Service Implementation** (`server/src/services/knowledgeGraphService.ts`):
  - ✅ `buildGraph()` - Build knowledge graph from training data + challenges
    - ✅ Creates nodes: training_data, challenge, category, tag
    - ✅ Creates links: category, tag, similar (Word2Vec-based), learning_path
    - ✅ Node visualization properties (size, color, position)
  - ✅ `buildFilteredGraph()` - Filter graph by categories, tags, search query
  - ✅ `buildErrorBasedGraph()` - Build error-focused graph for user practice
    - ✅ Analyzes recent user submissions and errors
    - ✅ Creates error nodes and highlights related resources
    - ✅ Provides error summary with recommendations
  - ✅ `findTrainingDataForErrors()` - Find training data for specific error types
  - ✅ `findSimilarTrainingData()` - Find similar content using Word2Vec similarity

- ✅ **Personalized Learning Plan Service** (`server/src/services/personalizedPlanService.ts`):
  - ✅ `buildPlan()` - Create comprehensive personalized learning plan
  - ✅ User profile analysis:
    - ✅ Total submissions & accepted count
    - ✅ Experience level detection (beginner/intermediate/advanced)
    - ✅ Preferred languages tracking
    - ✅ Category & difficulty statistics
    - ✅ Error pattern analysis
    - ✅ Weakness identification (categories & tags with errors)
  - ✅ Challenge recommendations:
    - ✅ Scores based on focus categories, language preference, difficulty
    - ✅ Excludes completed challenges
    - ✅ Difficulty adjustment based on experience level
  - ✅ Training data recommendations:
    - ✅ Targets categories with most errors
    - ✅ Matches focus tags and topics
    - ✅ Prioritizes high-quality content
  - ✅ Learning path generation:
    - ✅ Step-by-step progression with training + challenges
    - ✅ Organized by focus categories
    - ✅ Includes reasoning for each recommendation

- ✅ **Keyword Extraction Service** (`server/src/services/keywordExtractionService.ts`):
  - ✅ Keyword extraction from user messages:
    - ✅ Programming concepts (array, function, recursion, etc.)
    - ✅ Languages (Python, JavaScript, Java, C++, C#, C)
    - ✅ Error types (syntax, runtime, logic, type, reference, etc.)
    - ✅ Topics (debug, algorithm, data-structure, best-practices, testing, git)
    - ✅ User intent detection (question, exercise, error, learning, general)
    - ✅ Difficulty level inference (Easy, Medium, Hard)
  - ✅ Context-aware search:
    - ✅ `findTrainingDataByKeywords()` - Uses Word2Vec similarity + keyword matching
    - ✅ `findChallengesByKeywords()` - Filter challenges by extracted keywords
    - ✅ Relevance scoring based on keyword matches
  - ✅ Response context generation:
    - ✅ Gathers related training data, challenges, error-based recommendations
    - ✅ Suggests topics based on extracted keywords
  - ✅ Dynamic system prompt generation:
    - ✅ Creates contextual prompts for AI responses
    - ✅ Includes training data examples
    - ✅ Lists relevant challenges
    - ✅ Provides error-based recommendations
    - ✅ Guides AI to use BugHunter context in responses

- ✅ **Knowledge Graph Controller & Routes** (`server/src/controllers/knowledgeGraph.controller.ts` & `server/src/routes/knowledgeGraph.routes.ts`):
  - ✅ `GET /api/knowledge-graph/` - Get full knowledge graph
    - ✅ Support filtering by categories, tags, search query
  - ✅ `GET /api/knowledge-graph/stats` - Get graph statistics
    - ✅ Node count by type, link count by type
  - ✅ `GET /api/knowledge-graph/personalized` - Get personalized learning graph
    - ✅ User profile, recommendations, learning path
  - ✅ `GET /api/knowledge-graph/error-based` - Get error-focused graph
    - ✅ Option to filter by specific challenge
    - ✅ Error analysis and recommendations
  - ✅ `POST /api/knowledge-graph/find-training-for-errors` - Find training data for errors
    - ✅ Accept array of error messages and error types
    - ✅ Returns top N most relevant training data

- ✅ **Database Model: Language Preference** (`server/src/models/languagePreference.model.ts`):
  - ✅ Stores in 'favorite' collection to unify data structure
  - ✅ Unique index on (user_id, type) for fast lookups
  - ✅ Automatic timestamp management (created_at, updated_at)

- ✅ **Test Scripts** (for validation & data seeding):
  - ✅ `test-chatbot-create-history.ts` - Create 100+ sample chat histories with ratings
  - ✅ `test-chatbot-data-integration.ts` - Comprehensive integration test suite
  - ✅ `test-knowledge-graph-chatbot.ts` - Test knowledge graph with user errors
  - ✅ `test-personalized-plan.ts` - Test personalized learning plan generation

### December 1, 2025 - Language Preference Persistence Complete
- ✅ **Language Preference Persistence Implementation** (Frontend & Backend):
  - ✅ `Settings.tsx` - Language preference UI with Vietnamese/English buttons
    - ✅ Language selection interface in Settings page
    - ✅ Integration with LanguageContext for global state management
    - ✅ Real-time UI update on language change
  - ✅ Backend Routes:
    - ✅ `GET /api/users/me/preferences` - Retrieve user language preferences
    - ✅ `PATCH /api/users/me/preferences` - Update language preferences
  - ✅ Backend Controller Methods:
    - ✅ `getMyPreferences()` - Fetch preferences with auto-migration from User model
    - ✅ `updateMyPreferences()` - Persist language preferences to LanguagePreference collection
  - ✅ Database Model:
    - ✅ `LanguagePreference` model with user_id and type fields
    - ✅ Unique index on (user_id, type) for efficient queries
    - ✅ Storage in "favorite" collection (MongoDB)
  - ✅ Features:
    - ✅ Auto-migration from legacy User.favoriteLanguages field
    - ✅ Duplicate removal and validation of language values
    - ✅ Backward compatibility with User model
    - ✅ Error handling for invalid language inputs
    - ✅ Detailed logging for debugging
  - ✅ API Documentation:
    - ✅ `LANGUAGE_PREFERENCES_API.md` with full endpoint documentation
    - ✅ Request/response examples
    - ✅ Error handling guide
    - ✅ Usage patterns and best practices

### November 30, 2025 - Password Reset System Complete
- ✅ **Password Reset Implementation** (Frontend & Backend):
  - ✅ `ForgotPassword.tsx` - Main password reset page with responsive design
  - ✅ `RequestResetForm.tsx` - Form to request reset code via email or phone
    - ✅ SMS/Email support with fallback mechanism
    - ✅ Rate limiting (IP-based and identifier-based)
    - ✅ Input validation and error handling
    - ✅ Loading states and success messages
  - ✅ `VerifyResetForm.tsx` - Form to verify OTP code and set new password
    - ✅ 6-digit OTP input with auto-focus
    - ✅ Password strength validation
    - ✅ Error handling and retry logic
    - ✅ 10-minute code expiration
  - ✅ Backend Routes:
    - ✅ `POST /api/auth/request-reset` - Request password reset code
    - ✅ `POST /api/auth/verify-reset` - Verify code and set new password
  - ✅ Backend Controller Methods:
    - ✅ `requestPasswordReset()` - Generate and send reset code
    - ✅ `verifyPasswordReset()` - Verify code and update password
  - ✅ Security Features:
    - ✅ Rate limiting middleware (otpRequestRateLimitIP, otpRequestRateLimitIdentifier)
    - ✅ Rate limiting for verify (otpVerifyRateLimitIP, otpVerifyRateLimitIdentifier)
    - ✅ Privacy protection (generic response for non-existent users)
    - ✅ Crypto-based code generation
    - ✅ Time-based code expiration (10 minutes)
  - ✅ User Experience:
    - ✅ Smooth form transitions between request and verify steps
    - ✅ Dark mode support
    - ✅ Responsive design (mobile, tablet, desktop)
    - ✅ Toast notifications for feedback
    - ✅ Loading indicators during API calls
    - ✅ Back button to login page
    - ✅ Vietnamese and English language support

### November 24, 2025 - Extended Backend Routes & Admin Features Complete
- ✅ **Expanded Backend Routes**:
  - ✅ Favorite Routes: Create, read, delete favorite challenges
  - ✅ Admin Routes: Challenge bulk operations, statistics
  - ✅ Report Routes: User report management
  - ✅ Feedback Routes: Collect user feedback
  - ✅ Achievement Routes: Badge/achievement management
  - ✅ System Settings Routes: Admin configuration
  - ✅ Chat Routes: Chatbox message persistence
  - ✅ Leaderboard Routes: User ranking system
  - ✅ Training Data Routes: AI training sample management
  - ✅ Scraper Routes: Problem scraping from multiple sources
- ✅ **Database Models Expansion**:
  - ✅ Achievement Model (badges, icons, conditions)
  - ✅ Favorite Model (user favorites with metadata)
  - ✅ ChatHistory Model (conversation persistence with ratings)
  - ✅ TrainingData Model (AI training samples with categories)
  - ✅ Report Model (user problem reports)
  - ✅ Feedback Model (user feedback collection)
  - ✅ SystemSettings Model (admin configuration)
- ✅ **Admin Dashboard Features**:
  - ✅ Training Data Management tab with CRUD operations
  - ✅ Challenge list viewing with filters
  - ✅ Extract training data from chat history
  - ✅ Bulk import/export training data
  - ✅ Problem Scraper with CSES.fi support
  - ✅ Advanced Scraper for multiple sources
  - ✅ API Tester component for debugging
  - ✅ Database Debugger for data inspection
  - ✅ Challenge Import/Export functionality
- ✅ **UI Improvements**:
  - ✅ Responsive TrainingDataManagement component
  - ✅ Tabs for Training Data and Challenges sections
  - ✅ Pagination with gradient styling
  - ✅ Search and filter capabilities
  - ✅ Dark mode support
- ✅ **Scraper System**:
  - ✅ CSES.fi problem scraper
  - ✅ Multiple problem source support
  - ✅ Auto test case extraction
  - ✅ Difficulty classification
  - ✅ Bulk import to database
- ✅ **Styling Refinement**:
  - ✅ Updated padding in TrainingDataManagement (pt-16 md:pt-20)
  - ✅ Pagination styling with header gradient colors
  - ✅ Responsive design improvements

### November 17, 2025 - Server Optimization & Profile/Settings/Dashboard Complete
- ✅ **Fixed Mongoose Duplicate Index Warning**:
  - Removed duplicate `{ key: 1 }` index definition in systemSettingsSchema
  - The `unique: true` field property already creates the index automatically
  - Mongoose warning eliminated, server runs cleanly
- ✅ **Profile Page** (`client/src/components/pages/Profile.tsx`) - COMPLETE:
  - Avatar upload with drag-drop support and file validation
  - Avatar preview with fallback to UI avatars API
  - User information display and editing (email, phone, username)
  - XP and rank display with progression system
  - Rank-based color gradients and emoji icons
  - Badge showcase with empty state handling
  - Favorite languages selection and display (JavaScript, Python, Java, C++, Ruby, PHP, C#, Go)
  - Challenge completion tracking (completed/total)
  - Learning time statistics in minutes
  - Progress bars for completion percentage and XP progression
  - Ranking percentile display (top X% users)
  - Password change functionality for account security
  - Edit/Save/Cancel functionality with form validation
  - Login method badges (Google, GitHub, Facebook, Local)
  - Responsive design with dark mode support
  - Error and loading state handling
  - API integration for profile updates
- ✅ **Settings Page** (`client/src/components/pages/Settings.tsx`):
  - Theme toggle (Light/Dark mode) with persistent storage
  - Background customization with predefined options and custom image upload
  - Language preference switcher (Vietnamese/English)
  - Password change functionality for local accounts
  - Account information display (email, username, login method)
  - Responsive design with smooth animations
  - Dark mode support
- ✅ **ClientDashboard Component** - User activity tracking:
  - Activity streak calendar with fire-themed colors
  - Daily login/submission tracking
  - Gamification stats (XP, rank, badges, learning time)
  - Sidebar navigation (Home, Library, Favorites)
  - Admin panel access for administrators
  - Session-based activity recording
- ✅ **API Base Standardization** (continued refinement)
- ✅ **ChatBox Component** improvements
- ✅ **Gemini Pro AI** integration updates
- ✅ **ChatBox Component**: Full-featured AI chat interface
  - Real-time messaging with conversation history
  - Floating window interface (380px × 450px)
  - Chat session management (save, load, delete)
  - Message rating system (👍/👎)
  - Code syntax highlighting with highlight.js
  - Markdown message rendering
  - Message copy functionality
  - Dark mode support
- ✅ **Gemini Pro AI Integration**:
  - Google Generative AI API integration (gemini-1.5-flash model)
  - API key configuration via VITE_GEMINI_API_KEY
  - System prompt customization for BugHunter context
  - Multi-turn conversation support
  - Temperature and token control
  - Detailed error logging and debugging
- ✅ **AdaptiveAI - Client-side Learning**:
  - Self-learning AI with localStorage persistence
  - User feedback learning (interaction patterns)
  - Optional server sync endpoint (/api/ai/learn)
  - Conversation context awareness
  - JSON-based storage format
- ✅ **HybridAI Strategy**:
  - 3-tier response prioritization (Adaptive → Training → Gemini)
  - Automatic fallback mechanism
  - Error recovery and graceful degradation
- ✅ **API Base Standardization**:
  - Created getApiBase() helper for centralized API configuration
  - Removed all hard-coded API URLs
  - Fixed double `/api/api` path issues
  - Standardized environment variable usage (VITE_API_URL)
- ✅ **OAuth Route Fixes**:
  - Added redirect routes for legacy OAuth paths (/auth/* → /api/auth/*)
  - Proper error handling for OAuth flows
  - Google, GitHub, Facebook OAuth fully functional
- ✅ **UI Components**:
  - NotificationBox for real-time alerts
  - Header with language switcher
  - Responsive design across all components
  - Dark mode support
- ✅ **AdminDashboard Fixes**:
  - Updated to use getApiBase() helper
  - Removed hard-coded localhost URLs
- ✅ **Testing & Debugging**:
  - testChatBox.ts for API validation
  - test-gemini.js for API connection testing
  - Comprehensive error logging in all AI components
  - TypeScript error fixes (proper error type handling)

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

## AI System Architecture (November 2025)

### Component Overview
1. **GeminiProAI** (`client/src/utils/geminiAI.ts`)
   - Wrapper around Google Generative AI API
   - Model: gemini-1.5-flash
   - Handles API calls, error logging, response parsing
   - Configuration: temperature, maxOutputTokens, topP, topK
   - Conversation history management

2. **AdaptiveAI** (`client/src/utils/adaptiveAI.ts`)
   - Client-side learning system
   - Stores interactions and patterns in localStorage
   - Optional server sync via `/api/ai/learn`
   - Learns from user feedback (👍/👎 ratings)
   - Persistent across sessions

3. **HybridAI** (in ChatBox component)
   - Orchestrates multi-AI strategy
   - Response priority: AdaptiveAI → Training Data → Gemini
   - Automatic fallback on failure
   - Error recovery and graceful degradation

### Data Flow
```
User Message
    ↓
ChatBox Component
    ↓
HybridAI Strategy
    ├→ Check AdaptiveAI (local patterns) → Return if match
    ├→ Check Training Data → Return if available
    └→ Fall back to Gemini Pro API
    ↓
Response Processing
    ├→ Markdown parsing
    ├→ Code syntax highlighting
    └→ Store in conversation history
    ↓
Display in ChatBox UI
```

### Configuration
- **API Key**: `VITE_GEMINI_API_KEY` in `.env.local`
- **Backend URL**: `VITE_API_URL` (defaults to http://localhost:5000)
- **Model**: `gemini-1.5-flash` (latest lightweight model)
- **System Prompt**: Customized for BugHunter programming assistant context

### Persistence
- **Conversation History**: stored in memory during session
- **Adaptive Patterns**: localStorage key `bughunter_ai_learning_data`
- **Chat Sessions**: Can be saved/loaded via backend API
- **User Ratings**: Feed learning for AdaptiveAI

### API Endpoints
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/histories` - Load chat history list
- `GET /api/chat/:id` - Load specific chat
- `POST /api/ai/learn` - Sync adaptive learning to server (optional)