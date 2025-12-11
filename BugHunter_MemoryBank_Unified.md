# BugHunter Project Memory Bank

## 1. Project Brief

### Tổng quan dự án
BugHunter là một nền tảng web giáo dục hỗ trợ người học lập trình tìm hiểu và sửa lỗi code (debugging) một cách thực tế. Dự án hướng tới việc rèn luyện kỹ năng debugging, tư duy logic và coding clean thông qua môi trường thực hành và thi đấu.

### Mục tiêu chính
- Xây dựng nền tảng web hỗ trợ học lập trình qua việc sửa lỗi code.
- Hỗ trợ đa ngôn ngữ: Python, C++, Java, C#, C, JavaScript.
- Tạo môi trường thi đấu (PvP) và luyện tập với yếu tố Gamification.
- Ứng dụng AI/ML để phân tích lỗi và cá nhân hóa trải nghiệm học tập.

### Đối tượng mục tiêu
- Người học lập trình muốn nâng cao kỹ năng debug.
- Sinh viên CNTT cần môi trường thực hành.
- Lập trình viên muốn thử thách kỹ năng.

---

## 2. Product Context

### Vấn đề cần giải quyết
- Việc học lập trình thường tập trung vào viết code mới, thiếu chú trọng kỹ năng debug.
- Thiếu môi trường thực hành sửa lỗi thực tế và đa dạng.
- Học tập đơn điệu, thiếu tính cạnh tranh và tương tác.

### Giải pháp
- **Hệ thống bài tập Bug Fixing**: Cung cấp các bài tập có sẵn lỗi (Syntax, Logic) để người dùng sửa.
- **Gamification**: Tích hợp XP, Rank, Leaderboard để tạo động lực.
- **PvP Arena**: Cho phép thi đấu đối kháng thời gian thực để tăng tính hấp dẫn.
- **AI Assistant**: Hỗ trợ phân tích lỗi và gợi ý khi người dùng gặp khó khăn.

### Tính năng cốt lõi
1.  **User Features**:
    *   Đăng ký/Đăng nhập (Email, OAuth).
    *   Quản lý hồ sơ, XP, Rank.
    *   Làm bài tập sửa lỗi trên Code Editor trực tuyến.
    *   Thi đấu PvP thời gian thực.
2.  **Admin Features**:
    *   Quản lý người dùng.
    *   CRUD bài tập và Test cases.
    *   Thống kê hệ thống.
3.  **AI Features**:
    *   AI Debug Assistant (Gemini Integration).
    *   Phân tích lỗi và gợi ý sửa.

---

## 3. System Patterns

### Kiến trúc hệ thống
Dự án sử dụng kiến trúc **Client-Server** với **MERN Stack**:

```
┌─────────────────┐      HTTP/WS       ┌──────────────────┐
│  Client (React) │ ◄────────────────► │ Server (Express) │
└─────────────────┘                    └────────┬─────────┘
        │                                       │
        ▼                                       ▼
┌─────────────────┐                    ┌──────────────────┐
│  User Interface │                    │     Services     │
│ - Monaco Editor │                    │ - Auth Service   │
│ - Dashboard     │                    │ - PvP Service    │
│ - PvP Arena     │                    │ - AI Service     │
└─────────────────┘                    │ - Judge Service  │
                                       └────────┬─────────┘
                                                │
                       ┌────────────────┬───────┴───────┬────────────────┐
                       ▼                ▼               ▼                ▼
                  ┌─────────┐      ┌─────────┐     ┌─────────┐      ┌─────────┐
                  │ MongoDB │      │ Judge0  │     │ Gemini  │      │ Socket  │
                  │ (Data)  │      │(Sandbox)│     │   AI    │      │   IO    │
                  └─────────┘      └─────────┘     └─────────┘      └─────────┘
```

### Design Patterns
- **MVC (Model-View-Controller)**: Áp dụng cho Backend (Express).
- **Service Layer Pattern**: Tách biệt business logic (AuthService, Judge0Service, AIAnalysisService).
- **Repository Pattern** (Implicit via Mongoose): Tương tác với Database.
- **Observer Pattern**: Sử dụng Socket.IO cho tính năng Real-time PvP.

### Data Models
- **User**: Thông tin, OAuth, XP, Rank.
- **Challenge**: Bài tập, Test cases, Code mẫu.
- **Submission**: Kết quả làm bài, AI Analysis.
- **PvPRoom**: Phòng đấu, Trạng thái, Participants.
- **PvPMatch**: Kết quả trận đấu, Winner.
- **Friend**: Quản lý bạn bè.

---

## 4. Tech Context

### Stack công nghệ
- **Backend**: Node.js, Express.js, TypeScript.
- **Frontend**: React 18, TypeScript, TailwindCSS, Shadcn/ui.
- **Database**: MongoDB (Mongoose).
- **Real-time**: Socket.IO.
- **Code Execution**: Judge0 (Self-hosted Docker).
- **AI**: Google Gemini API.
- **Authentication**: JWT, Passport.js (OAuth).

### Development Tools
- **IDE**: VS Code.
- **API Testing**: Postman.
- **Version Control**: Git/GitHub.
- **Containerization**: Docker.

### Deployment
- **Frontend**: Vercel/Netlify.
- **Backend**: Railway/AWS.
- **CI/CD**: GitHub Actions.

---

## 5. Active Context

### Trạng thái hiện tại (02/12/2024)
- **PvP System**: Đã hoàn thiện (Room, Match, Real-time, Friend system).
- **Core Features**: Đã hoàn thiện (Auth, Challenge, Submission, Judge0 integration).
- **AI Features**: Đã tích hợp Gemini AI cho phân tích lỗi.
- **Frontend**: Đã hoàn thiện các trang chính (Dashboard, Editor, PvP, Profile).

### Công việc đang tập trung
- Cải thiện Error Handling và Edge cases.
- Tối ưu hóa hiệu năng cho Production.
- Chuẩn bị cho Deployment.

### Các thay đổi gần đây
- **02/12/2024**: Hoàn thiện PvP System (Room, Match, WebSocket).
- **21/11/2024**: Hoàn thiện Challenge System & Gamification.
- **28/12/2024**: Hoàn thiện OAuth Integration.

---

## 6. Progress

### Đã hoàn thành ✅
- **Authentication**: Login/Register, OAuth (Google, GitHub, Facebook), JWT.
- **Challenge System**: CRUD bài tập, Code Editor (Monaco), Judge0 Integration.
- **Gamification**: XP, Rank, Leaderboard.
- **PvP System**: Real-time competition, Room management, Friend system.
- **AI Integration**: Gemini AI Debug Assistant.
- **Admin Dashboard**: Quản lý bài tập, User cơ bản.

### Đang thực hiện 🔄
- Performance optimization.
- Error handling improvement.

### Chưa thực hiện ❌
- Tournament Mode (Giải đấu).
- Advanced AI Personalization (ML-based).
- Unit/Integration Tests.
- Rate Limiting.

---

## 7. Project Rules

### Quy tắc Code
- **Backend**: Tuân thủ cấu trúc Controller-Service. Sử dụng TypeScript strict mode.
- **Frontend**: Sử dụng Functional Components, Hooks. Tách nhỏ component.
- **Naming**: CamelCase cho biến/hàm, PascalCase cho Class/Component.

### Quy trình Git
- Commit message rõ ràng (feat, fix, docs, refactor).
- Feature branch workflow.

### Bảo mật
- Validate input đầu vào (express-validator).
- Không lưu hardcode secrets (dùng .env).
- Luôn kiểm tra quyền (Role-based access) cho các API nhạy cảm.

### Documentation
- Cập nhật Memory Bank khi có thay đổi lớn về kiến trúc hoặc tính năng.
- Comment code cho các logic phức tạp.