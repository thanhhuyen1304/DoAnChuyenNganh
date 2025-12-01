# Luồng Người Dùng trong Hệ Thống PvP

## Tổng quan
Hệ thống PvP (Player vs Player) được thiết kế để cung cấp trải nghiệm đấu đối kháng toàn diện cho người dùng, từ lúc đăng nhập đến khi kết thúc trận đấu.

## Luồng Chi Tiết

### 1. Đăng Nhập & Xác Thực
```
Người dùng → Trang Login → Đăng nhập thành công → Token JWT được lưu → Chuyển hướng đến trang chủ
```

**Components liên quan:**
- [`LoginPage.tsx`](client/src/components/pages/LoginPage.tsx)
- [`RegisterPage.tsx`](client/src/components/pages/RegisterPage.tsx)
- [`auth.routes.ts`](server/src/routes/auth.routes.ts)
- [`auth.ts`](server/src/middleware/auth.ts)

**Backend:**
- JWT token verification
- User authentication middleware
- Session management

### 2. Truy Cập Trang PvP
```
Người dùng → Click "Thi Đấu" → Chuyển đến trang PvP (/pvp)
```

**Components liên quan:**
- [`Header.tsx`](client/src/components/Header.tsx) - Navigation với mục "Thi Đấu"
- [`LanguageContext.tsx`](client/src/components/contexts/LanguageContext.tsx) - Bản dịch "nav.pvp"
- [`App.tsx`](client/src/App.tsx) - Routing configuration

### 3. Trang PvP - Giao Diện Chính
```
Trang PvP → Hiển thị:
├── Stats Overview (Online users, Active matches, Rooms waiting, User rating)
├── Tabs: Sảnh Chính, Online Users, Bạn Bè, Lịch Sử, Bảng Xếp Hạng
└── Actions: Matchmaking, Tạo phòng, Thách đấu
```

**Components chính:**
- [`PvPPage.tsx`](client/src/components/pages/PvPPage.tsx) - Trang chính
- [`PvPSection.tsx`](client/src/components/PvPSection.tsx) - Hero section
- [`AchievementSystem.tsx`](client/src/components/pvp/AchievementSystem.tsx) - Hệ thống thành tích

### 4. Hệ Thống Phòng Chờ (Room Management)

#### 4.1. Tạo Phòng Mới
```
User → Click "Tạo Phòng" → Mở modal → Điền thông tin:
- Tên phòng
- Chế độ (1vs1, Tournament)
- Độ khó (Easy, Medium, Hard)
- Giới hạn thời gian
- Số lượng bài tập
- Công khai/Riêng tư
- Mật khẩu (nếu riêng tư)
→ Click "Tạo Phòng" → Phòng được tạo
```

**Components:**
- [`CreateRoomModal.tsx`](client/src/components/pvp/CreateRoomModal.tsx)
- Backend API: `POST /api/pvp/rooms`

#### 4.2. Danh Sách Phòng Đang Chờ
```
Trang PvP → Tab "Sảnh Chính" → Hiển thị danh sách phòng:
├── Filter: Độ khó, Chế độ, Tìm kiếm
├── Room Card: Tên, Host, Players, Mode, Difficulty, Thời gian
└── Actions: Tham gia (nếu chưa đầy), Xem chi tiết
```

**Backend Integration:**
- Database: [`Room`](server/src/models/room.model.ts) model
- API: `GET /api/pvp/rooms`
- WebSocket: Real-time room updates

#### 4.3. Tham Gia Phòng
```
User → Click "Tham Gia" → Kiểm tra:
- Phòng công khai: Tham gia trực tiếp
- Phòng riêng tư: Nhập mật khẩu
- Phòng đầy: Hiển thị thông báo
→ Tham gia thành công → Vào phòng chờ
```

**Real-time Updates:**
- WebSocket events: `user_joined_room`, `room_updated`, `room_started`
- Toast notifications: Thành công/Lỗi

### 5. Hệ Thống Matchmaking

#### 5.1. Bắt Đầu Tìm Kiếm
```
User → Click "Matchmaking Nhanh" → Mở modal → Cài đặt:
- Độ khó mong muốn
- Chế độ chơi
- Khoảng rating đối thủ
→ Click "Bắt Đầu" → Thêm vào hàng đợi
```

**Components:**
- [`MatchmakingModal.tsx`](client/src/components/pvp/MatchmakingModal.tsx)
- Backend: [`WebSocketService`](server/src/services/websocket.service.ts)

#### 5.2. Thuật Toán Matchmaking
```
WebSocket Service → Tìm đối thủ phù hợp:
- Rating proximity (±200 điểm)
- Cùng độ khó
- Cùng chế độ
→ Tìm thấy → Tạo trận tự động
```

**Algorithm:**
- Elo rating system
- Priority queue based on waiting time
- Real-time matching

#### 5.3. Chấp Nhận/Từ Chối Trận Đấu
```
Hệ thống tìm thấy đối thủ → Hiển thị modal:
├── Thông tin đối thủ: Username, Rating, Level
├── Thời gian chấp nhận: 10 giây
└── Actions: Chấp nhận, Từ chối
```

**WebSocket Events:**
- `match_found` - Tìm thấy đối thủ
- `match_accepted` - Đối thủ chấp nhận
- `match_rejected` - Đối thủ từ chối
- `match_expired` - Hết thời gian

### 6. Hệ Thống Bạn Bè

#### 6.1. Gửi Lời Mời Kết Bạn
```
User → Tab "Bạn Bè" → Danh sách online users → 
Click "Kết bạn" → Gửi lời mời
→ Real-time notification đến người nhận
```

**Components:**
- [`FriendSystem.tsx`](client/src/components/pvp/FriendSystem.tsx)
- Backend: [`Friend`](server/src/models/friend.model.ts) model

#### 6.2. Quản Lý Lời Mời
```
User → Tab "Bạn Bè" → Tab "Lời mời" → Hiển thị:
├── Lời mời đã gửi
├── Lời mời nhận được
└── Actions: Chấp nhận, Từ chối
```

**Backend Features:**
- Friendship status tracking
- Mutual friend detection
- Block/unblock functionality

#### 6.3. Danh Sách Bạn Bè
```
Tab "Bạn Bè" → Hiển thị danh sách bạn:
├── Avatar, Username, Rating, Level
├── Trạng thái (Online, In-match, Away)
├── Statistics: Wins/Losses, Win rate
└── Actions: Nhắn tin, Thách đấu, Xóa bạn
```

### 7. Trận Đấu Thực Tế

#### 7.1. Bắt Đầu Trận
```
Hai người dùng chấp nhận → Hệ thống tạo trận:
├── Tạo phòng đấu riêng tư
├── Chọn bài tập ngẫu nhiên
├── Đồng bộ thời gian bắt đầu
├── Chuyển cả hai người đến trang đấu
└── Bắt đầu đếm ngược
```

**Components:**
- Real-time code editor
- Problem statement display
- Timer countdown
- Language selector

#### 7.2. Gửi Bài Lời
```
User viết code → Click "Nộp bài":
├── Validation: Syntax check
├── Submission: Gửi đến Judge0 API
├── Processing: Hiển thị trạng thái đang xử lý
└── Results: Test cases passed/failed, Execution time, Memory usage
```

**Backend Integration:**
- [`Judge0`](docker-compose.yml) service integration
- [`Match`](server/src/models/match.model.ts) tracking
- Real-time submission processing

#### 7.3. Theo Dõi Tiến Trình
```
Real-time updates trong trận:
├── Opponent progress indicator
├── Time remaining
├── Current submissions count
├── Score updates
└── Chat system (tương lai)
```

**WebSocket Events:**
- `submission_received` - Đối thủ nộp bài
- `match_completed` - Trận kết thúc
- `score_updated` - Cập nhật điểm số

### 8. Kết Thúc Trận Đấu

#### 8.1. Xác Định Kết Quả
```
Hết thời gian hoặc một người hoàn thành:
├── Tính điểm cuối cùng
├── Xác định người thắng/thua/hòa
├── Cập nhật rating Elo
├── Lưu vào lịch sử đấu
└── Thông báo kết quả
```

**Elo Rating System:**
- Win: +25-32 điểm (tùy rating đối thủ)
- Loss: -25-32 điểm
- Draw: 0 điểm
- K factor: 32 (cho người mới)

#### 8.2. Cập Nhật Thống Kê
```
Sau trận kết thúc:
├── User stats: Wins, Losses, Win rate, Streak
├── Level progression: XP calculation
├── Achievements: Unlock mới
└── Leaderboard: Cập nhật vị trí
```

**Backend Models:**
- [`User`](server/src/models/user.model.ts) - Cập nhật `pvpStats`
- [`Match`](server/src/models/match.model.ts) - Lưu kết quả trận
- [`Friend`](server/src/models/friend.model.ts) - Cập nhật `totalMatches`

### 9. Hệ Thống Thông Báo Real-time

#### 9.1. Toast Notifications
```
Tất cả actions quan trọng → Toast notification:
├── Success: Hoàn thành, Thắng, Kết bạn thành công
├── Error: Lỗi, Thất bại, Không thể kết nối
├── Warning: Cảnh báo, Sắp hết thời gian
└── Info: Thông tin, Đang xử lý
```

**Implementation:**
- [`toast.tsx`](client/src/components/ui/toast.tsx) - Custom toast component
- Sonner integration - Backup notification system
- Auto-dismiss với configurable duration

#### 9.2. WebSocket Events
```
Real-time events được xử lý:
├── Connection/Disconnection
├── Room updates
├── Matchmaking status
├── Friend requests
├── Match progress
└── System notifications
```

**Service:**
- [`WebSocketService`](server/src/services/websocket.service.ts) - Centralized event handling
- Memory management với cleanup
- Error handling và retry logic

### 10. Responsive Design

#### 10.1. Mobile Optimization
```
Tất cả PvP components được tối ưu cho mobile:
├── Grid layouts: 1 col trên mobile, 2-3 cols trên tablet
├── Touch-friendly buttons với adequate spacing
├── Collapsible sections cho không gian giới hạn
└── Swipeable tabs cho navigation
```

#### 10.2. Desktop Experience
```
Desktop layouts được tối ưu:
├── Full-width layouts với sidebar information
├── Hover states và tooltips
├── Keyboard shortcuts
└── Multi-window support
```

### 11. Backend Architecture

#### 11.1. API Endpoints
```
RESTful APIs cho PvP:
├── /api/pvp/rooms - Room management
├── /api/pvp/matchmaking - Matchmaking system
├── /api/pvp/friends - Friend system
├── /api/pvp/matches - Match history
├── /api/pvp/leaderboard - Rankings
└── /api/pvp/stats - User statistics
```

**Controller:**
- [`PvPController`](server/src/controllers/pvp.controller.ts) - Centralized logic
- Error handling với proper HTTP status codes
- Input validation và sanitization

#### 11.2. Database Models
```
MongoDB schemas:
├── User - Profile, stats, authentication
├── Room - Room configuration, participants
├── Match - Match results, submissions
└── Friend - Friend relationships, requests
```

### 12. Security Considerations

#### 12.1. Authentication & Authorization
```
JWT-based authentication:
├── Token validation trên tất cả requests
├── Role-based access control
├── Rate limiting cho sensitive operations
└── Session management với timeout
```

#### 12.2. Data Validation
```
Input validation ở tất cả layers:
├── Frontend: Client-side validation
├── Backend: Schema validation
├── SQL injection prevention
└── XSS protection với sanitization
```

### 13. Performance Optimizations

#### 13.1. Frontend
```
React optimizations:
├── Component memoization cho expensive renders
├── Virtual scrolling cho large lists
├── Lazy loading cho modals và tabs
├── Image optimization với WebP format
└── Bundle splitting theo route
```

#### 13.2. Backend
```
Server optimizations:
├── Database indexing cho queries
├── Connection pooling
├── Caching cho frequently accessed data
├── WebSocket connection management
└── Graceful degradation under load
```

### 14. Error Handling & Recovery

#### 14.1. Client-side
```
Frontend error handling:
├── Network error boundaries
├── Retry mechanisms với exponential backoff
├── Offline mode với queueing
├── Graceful degradation
└── User-friendly error messages
```

#### 14.2. Server-side
```
Backend error handling:
├── Comprehensive logging
├── Circuit breaker pattern
├── Fallback mechanisms
├── Health checks
└── Monitoring và alerting
```

### 15. Testing Strategy

#### 15.1. Unit Testing
```
Component testing:
├── Jest + React Testing Library
├── Mock WebSocket connections
├── Test user interactions
└── Coverage reporting
```

#### 15.2. Integration Testing
```
End-to-end testing:
├── Cypress cho user flows
├── WebSocket connection testing
├── API integration tests
├── Database transaction tests
└── Performance benchmarking
```

## Kết Luận

Hệ thống PvP được thiết kế với kiến trúc modular, scalable, và user-friendly:

1. **Real-time Experience**: WebSocket integration cho instant updates
2. **Responsive Design**: Tối ưu cho tất cả device types
3. **Comprehensive Features**: Full lifecycle từ matchmaking đến completion
4. **Robust Backend**: Scalable architecture với proper error handling
5. **Security First**: Authentication, validation, và protection layers
6. **Performance Optimized**: Efficient data handling và rendering

Luồng người dùng được thiết kế để mượt mà, trực quan, và đáng tin cậy, cung cấp trải nghiệm đấu đối kháng chất lượng cao.