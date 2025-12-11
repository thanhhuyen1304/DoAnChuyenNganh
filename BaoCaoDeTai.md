# BÁO CÁO ĐỒ ÁN CHUYÊN NGÀNH
## NỀN TẢNG LUYỆN TẬP VÀ SỬA LỖI LẬP TRÌNH BUGHUNTER

---

## THÔNG TIN ĐỒ ÁN

**Tên đề tài:** BugHunter - Nền tảng Web hỗ trợ học lập trình qua việc sửa lỗi code  
**Trường:** Đại học Công nghệ TP.HCM (HUTECH)  
**Năm thực hiện:** 2024 - 2025  
**Công nghệ chính:** MERN Stack (MongoDB, Express, React, Node.js), TypeScript, AI Integration  

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Mục tiêu và phạm vi](#2-mục-tiêu-và-phạm-vi)
3. [Vấn đề và giải pháp](#3-vấn-đề-và-giải-pháp)
4. [Công nghệ sử dụng](#4-công-nghệ-sử-dụng)
5. [Kiến trúc hệ thống](#5-kiến-trúc-hệ-thống)
6. [Cơ sở dữ liệu](#6-cơ-sở-dữ-liệu)
7. [Tính năng chính](#7-tính-năng-chính)
8. [Kết quả đạt được](#8-kết-quả-đạt-được)
9. [Đánh giá và hướng phát triển](#9-đánh-giá-và-hướng-phát-triển)
10. [Kết luận](#10-kết-luận)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Giới thiệu

BugHunter là một nền tảng web giáo dục được thiết kế để giúp người học lập trình nâng cao kỹ năng thông qua phương pháp thực hành sửa lỗi (debugging). Hệ thống cung cấp môi trường code trực tuyến, tích hợp Gamification (trò chơi hóa) và Trí tuệ nhân tạo (AI) để tạo ra trải nghiệm học tập thú vị và hiệu quả.

Dự án được xây dựng trên nền tảng MERN Stack hiện đại kết hợp với TypeScript, hỗ trợ đa ngôn ngữ lập trình như Python, C++, Java, C#, C, JavaScript.

### 1.2. Bối cảnh thực hiện

Trong quá trình học lập trình, sinh viên thường gặp khó khăn lớn trong việc tìm và sửa lỗi code (debugging). Các phương pháp học truyền thống thường tập trung nhiều vào viết code mới (writing code) mà ít chú trọng kỹ năng đọc hiểu và sửa lỗi. Ngoài ra, việc học lập trình thường khô khan và thiếu tính cạnh tranh.

BugHunter ra đời nhằm giải quyết các vấn đề trên bằng cách tạo ra một sân chơi nơi người học có thể rèn luyện tư duy logic, kỹ năng debugging và thi đấu với nhau trong thời gian thực.

---

## 2. MỤC TIÊU VÀ PHẠM VI

### 2.1. Mục tiêu chính

#### Mục tiêu chung
- Xây dựng nền tảng web toàn diện hỗ trợ học lập trình qua debugging.
- Tạo môi trường thi đấu (PvP) và luyện tập hấp dẫn.
- Ứng dụng AI để hỗ trợ phân tích và hướng dẫn người học.

#### Mục tiêu cụ thể
- **Kỹ năng**: Giúp người dùng rèn luyện kỹ năng đọc code, tư duy logic và coding clean.
- **Đa ngôn ngữ**: Hỗ trợ biên dịch và chạy code cho nhiều ngôn ngữ phổ biến.
- **Tương tác**: Xây dựng hệ thống thi đấu đối kháng thời gian thực (Real-time PvP).
- **Thông minh**: Tích hợp AI để phân tích lỗi và đưa ra gợi ý sửa lỗi chính xác.

### 2.2. Phạm vi dự án

#### Module 1: Người dùng (User Features)
- **Quản lý tài khoản**: Đăng ký/Đăng nhập (Email, OAuth Google/GitHub/Facebook), Quản lý hồ sơ, Rank, XP.
- **Hệ thống bài tập**: Danh sách bài tập sửa lỗi (Syntax, Logic), Code Editor trực tuyến (Monaco Editor).
- **Sandbox**: Môi trường chạy code an toàn (Judge0).
- **Gamification**: Hệ thống điểm kinh nghiệm (XP), Bảng xếp hạng (Leaderboard), Huy hiệu.
- **PvP System**: Thi đấu đối kháng thời gian thực, Phòng chờ, Chat, Kết bạn.

#### Module 2: Quản trị viên (Admin Features)
- **Dashboard**: Thống kê người dùng, bài tập.
- **Quản lý bài tập**: CRUD bài tập, Test cases, Phân loại độ khó.
- **Quản lý người dùng**: Xem danh sách, khóa/mở tài khoản.

#### Module 3: AI & Advanced Features
- **AI Debug Assistant**: Phân tích lỗi từ Judge0, gợi ý sửa lỗi (Google Gemini).
- **Phân tích code**: Đánh giá chất lượng code và đưa ra lời khuyên.

### 2.3. Đối tượng sử dụng

1. **Người học lập trình (Students/Developers)**: Muốn rèn luyện kỹ năng debug, tư duy logic.
2. **Giảng viên/Mentor**: Có thể đóng góp bài tập hoặc sử dụng nền tảng để kiểm tra kỹ năng sinh viên.
3. **Quản trị viên**: Quản lý nội dung và vận hành hệ thống.

---

## 3. VẤN ĐỀ VÀ GIẢI PHÁP

### 3.1. Vấn đề hiện tại
- **Thiếu kỹ năng Debug**: Sinh viên thường lúng túng khi gặp lỗi, không biết cách đọc stacktrace.
- **Học tập thụ động**: Các bài tập lập trình thông thường thiếu tính tương tác và cạnh tranh.
- **Khó khăn khi tự học**: Khi gặp lỗi khó, người tự học không có người hướng dẫn ngay lập tức.

### 3.2. Giải pháp đề xuất

#### Giải pháp công nghệ
1. **Môi trường thực hành thực tế**:
   - Tích hợp **Monaco Editor** (giống VS Code) cho trải nghiệm code quen thuộc.
   - Sử dụng **Judge0** để thực thi code an toàn, hỗ trợ nhiều ngôn ngữ.

2. **Gamification & PvP**:
   - Biến việc sửa lỗi thành trò chơi với XP, Rank (Newbie -> Expert).
   - Chế độ thi đấu **PvP Real-time** sử dụng **Socket.IO** để tăng tính cạnh tranh.

3. **Trợ lý AI thông minh**:
   - Tích hợp **Google Gemini AI** để đóng vai trò như một Mentor ảo, giải thích lỗi và gợi ý hướng sửa 24/7.

---

## 4. CÔNG NGHỆ SỬ DỤNG

### 4.1. Backend Technologies
- **Runtime**: Node.js
- **Framework**: Express.js (RESTful API)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Passport.js (OAuth), JWT (JSON Web Token)
- **Real-time**: Socket.IO (cho tính năng PvP)
- **Code Execution**: Judge0 (Self-hosted với Docker)
- **AI Integration**: Google Gemini API

### 4.2. Frontend Technologies
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS, Shadcn/ui
- **State Management**: Redux Toolkit
- **Code Editor**: Monaco Editor
- **HTTP Client**: Axios

### 4.3. DevOps & Tools
- **Containerization**: Docker, Docker Compose
- **Version Control**: Git, GitHub
- **Deployment**: Vercel (Frontend), Railway/AWS (Backend)

---

## 5. KIẾN TRÚC HỆ THỐNG

### 5.1. Mô hình tổng quát (Client-Server)

```
┌─────────────────┐      HTTP/WS       ┌──────────────────┐
│  Client (React) │ ◄────────────────► │ Server (Express) │
└─────────────────┘                    └────────┬─────────┘
        │                                       │
        ▼                                       ▼
┌─────────────────┐                    ┌──────────────────┐
│  User Interface │                    │     Services     │
│ - Code Editor   │                    │ - Auth Service   │
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

### 5.2. Luồng xử lý chính

#### Luồng nộp bài (Submission Flow)
1. User sửa code trên Editor -> Nhấn Submit.
2. Client gửi code lên Server.
3. Server gửi code + test cases sang Judge0 Service.
4. Judge0 thực thi code trong Docker container an toàn.
5. Kết quả trả về Server -> Server so sánh với Output mong muốn.
6. Nếu lỗi -> Gửi thông tin lỗi sang AI Service để phân tích.
7. Trả kết quả cuối cùng (Pass/Fail, AI Analysis) về Client.

#### Luồng PvP (Real-time Flow)
1. User tạo phòng -> Server tạo Room ID (Socket.IO room).
2. User khác join phòng bằng Room ID.
3. Host bắt đầu -> Server gửi đề bài cho tất cả client cùng lúc.
4. Các client cập nhật tiến độ (Submit) -> Server broadcast tiến độ cho đối thủ.
5. Khi có người thắng hoặc hết giờ -> Server tính toán kết quả và XP -> Lưu DB.

---

## 6. CƠ SỞ DỮ LIỆU

### 6.1. Các Models chính

1. **User**:
   - Thông tin cơ bản (username, email, password, avatar).
   - OAuth info (Google, GitHub, Facebook).
   - Gamification (XP, Rank, Badges).
   - Thống kê (số bài đã làm, tỷ lệ thắng PvP).

2. **Challenge (Bài tập)**:
   - Tiêu đề, mô tả, độ khó, ngôn ngữ.
   - Code khởi tạo (chứa bug).
   - Test Cases (Input, Output, Hidden).

3. **Submission (Bài nộp)**:
   - UserID, ChallengeID.
   - Source code, Ngôn ngữ.
   - Kết quả (Pass/Fail), Thời gian chạy, Memory.
   - AI Analysis (nếu có).

4. **PvPRoom & PvPMatch**:
   - RoomID, Host, Participants.
   - Trạng thái phòng, Cài đặt (thời gian, độ khó).
   - Kết quả trận đấu, Người thắng cuộc.

5. **Friend**:
   - Quản lý danh sách bạn bè, trạng thái kết bạn.

---

## 7. TÍNH NĂNG CHÍNH

### 7.1. Tính năng Người dùng

#### Authentication & Profile
- Đăng nhập đa nền tảng (Google, GitHub, Facebook).
- Trang cá nhân hiển thị biểu đồ tiến độ, lịch sử hoạt động.
- Hệ thống Rank: Newbie, Beginner, Intermediate, Advanced, Expert.

#### Luyện tập (Practice Mode)
- Danh sách bài tập lọc theo độ khó, ngôn ngữ.
- Giao diện làm bài trực quan với Monaco Editor.
- Phản hồi tức thì từ hệ thống chấm điểm tự động.

#### Đấu trường (PvP Arena)
- **Tạo phòng/Tham gia phòng**: Dễ dàng với mã phòng 6 ký tự.
- **Phòng chờ (Waiting Room)**: Chat, xem thông tin đối thủ, trạng thái sẵn sàng.
- **Thi đấu**: Code song song, cập nhật trạng thái đối thủ real-time.
- **Kết quả**: Hiển thị chi tiết so sánh, cộng điểm XP cho người thắng.

#### Mạng xã hội
- Kết bạn, tìm kiếm người dùng.
- Mời bạn bè vào phòng đấu.
- Bảng xếp hạng (Leaderboard) toàn cầu.

### 7.2. Tính năng AI (AI Debug Assistant)
- Tự động phân tích khi code chạy sai hoặc gặp lỗi biên dịch.
- Giải thích nguyên nhân lỗi bằng ngôn ngữ tự nhiên dễ hiểu.
- Gợi ý đoạn code sửa lỗi (Snippet).

### 7.3. Tính năng Quản trị (Admin)
- Dashboard thống kê tổng quan hệ thống.
- Công cụ tạo và chỉnh sửa bài tập (Challenge Editor).
- Quản lý Test cases trực quan.
- Quản lý người dùng hệ thống.

---

## 8. KẾT QUẢ ĐẠT ĐƯỢC

### 8.1. Tiến độ hoàn thành
Dự án đã hoàn thành các chức năng cốt lõi và đang trong giai đoạn tinh chỉnh.

- **Authentication**: 100% (Hoàn thiện OAuth và JWT).
- **Core Practice System**: 100% (Editor, Judge0, Submission).
- **PvP System**: 100% (Real-time, Room logic, Ranking).
- **AI Integration**: 90% (Tích hợp Gemini, Fallback logic).
- **Admin Dashboard**: 100% (CRUD Challenges, User Mgmt).
- **Frontend UI/UX**: 95% (Responsive, Dark/Light mode).

### 8.2. Điểm nổi bật về kỹ thuật
- **Real-time Performance**: Hệ thống PvP hoạt động mượt mà với độ trễ thấp nhờ tối ưu Socket.IO.
- **Scalable Architecture**: Kiến trúc tách biệt rõ ràng giữa Client, Server và các Service (Judge0, AI).
- **Security**: Áp dụng các chuẩn bảo mật như Helmet, CORS, Rate Limiting (planned), Input Validation.
- **Code Quality**: Sử dụng TypeScript toàn bộ dự án giúp code chặt chẽ, dễ bảo trì.

---

## 9. ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN

### 9.1. Điểm mạnh
- **Tính thực tế cao**: Giải quyết đúng nhu cầu rèn luyện kỹ năng debug.
- **Công nghệ hiện đại**: MERN Stack + TypeScript + AI đảm bảo hiệu năng và trải nghiệm.
- **Tính tương tác**: Chế độ PvP tạo động lực học tập lớn.
- **Hỗ trợ AI**: Giúp người tự học không bị bế tắc khi gặp lỗi khó.

### 9.2. Hạn chế
- **Mobile Support**: Hiện tại tối ưu tốt nhất cho Desktop/Tablet do đặc thù viết code, trải nghiệm trên mobile còn hạn chế.
- **Tài nguyên**: Việc chạy Judge0 (Docker) tốn khá nhiều tài nguyên server.
- **AI Latency**: Phụ thuộc vào tốc độ phản hồi của Google Gemini API.

### 9.3. Hướng phát triển
- **Ngắn hạn**:
  - Tối ưu hóa hiệu năng Server và Database.
  - Thêm chế độ giải đấu (Tournament) cho nhiều người chơi.
  - Cải thiện giao diện Mobile.
- **Dài hạn**:
  - Phát triển Mobile App (React Native/Flutter).
  - Ứng dụng Deep Learning để phân loại lỗi và cá nhân hóa lộ trình học sâu hơn.
  - Mở rộng hỗ trợ nhiều ngôn ngữ lập trình hơn nữa.

---

## 10. KẾT LUẬN

Dự án **BugHunter** đã xây dựng thành công một nền tảng học lập trình hiện đại, kết hợp giữa giáo dục và giải trí (Edutainment). Với việc tích hợp các công nghệ tiên tiến như AI và Real-time communication, BugHunter không chỉ là công cụ hỗ trợ học tập mà còn là sân chơi bổ ích cho cộng đồng lập trình viên.

Dự án có tiềm năng phát triển lớn, có thể mở rộng thành một nền tảng tuyển dụng hoặc đánh giá năng lực lập trình viên trong tương lai.

---

*Báo cáo được tổng hợp dựa trên tiến độ thực tế của dự án BugHunter.*