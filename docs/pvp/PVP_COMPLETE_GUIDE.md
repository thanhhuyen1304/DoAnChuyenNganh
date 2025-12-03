# Hướng Dẫn PvP Hoàn Chỉnh - BugHunter

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Database Setup](#database-setup)
3. [Hệ Thống Thi Đấu](#hệ-thống-thi-đấu)
4. [User Flow](#user-flow)
5. [Testing Guide](#testing-guide)

---

## Tổng Quan

Hệ thống PvP (Player vs Player) cho phép người dùng thi đấu đối kháng thời gian thực trong các trận đấu lập trình.

### Tính Năng Chính

- ✅ **Tạo phòng**: Tùy chỉnh tên, mật khẩu, chế độ, độ khó
- ✅ **Matchmaking**: Tìm đối thủ thông minh dựa trên rating Elo
- ✅ **Real-time**: WebSocket cho cập nhật trực tiếp
- ✅ **Friend System**: Kết bạn và quản lý lời mời
- ✅ **Statistics**: Lịch sử đấu, win rate, ranking
- ✅ **Ready System**: Hệ thống sẵn sàng trước khi bắt đầu
- ✅ **Auto Match Selection**: Chọn challenge tự động theo độ khó

---

## Database Setup

### 🚀 Quick Setup

#### Bước 1: Chạy Script Setup

```bash
cd server
npm run ts-node scripts/setup-pvp-simple.ts
```

Script này sẽ:
- ✅ Tạo admin user (`admin@bughunter.com` / `admin123`)
- ✅ Tạo 2 test users (`testuser1`, `testuser2`) với mật khẩu `test123`
- ✅ Tạo sample room "CodeMaster's Arena"
- ✅ Tạo sample match đã hoàn thành
- ✅ Tạo sample friend request

#### Bước 2: Khởi Động Server

```bash
npm start
```

#### Bước 3: Kiểm Tra Frontend

```bash
cd client
npm run dev
```

### 📊 Database Schema

#### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  password: String,
  rating: Number (default: 1200),
  level: Number (default: 1),
  role: String (default: 'user'),
  pvpStats: {
    wins: Number,
    losses: Number,
    draws: Number,
    totalMatches: Number,
    winRate: Number,
    currentStreak: Number,
    bestStreak: Number,
    averageCompletionTime: Number
  }
}
```

#### Rooms Collection

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  hostId: ObjectId (ref: 'User'),
  hostUsername: String,
  participants: [{
    userId: ObjectId (ref: 'User'),
    username: String,
    rating: Number,
    joinedAt: Date,
    isReady: Boolean,
    progress: {
      problemId: String,
      startTime: Date,
      completedAt: Date,
      score: Number
    }
  }],
  settings: {
    mode: String ('1vs1' | 'tournament' | 'practice'),
    difficulty: String ('easy' | 'medium' | 'hard' | 'expert'),
    timeLimit: Number,
    language: String,
    isPrivate: Boolean,
    password: String,
    maxParticipants: Number,
    autoStart: Boolean,
    allowSpectators: Boolean
  },
  status: String ('waiting' | 'in-progress' | 'completed' | 'cancelled'),
  problems: Array,
  results: Array,
  createdAt: Date,
  updatedAt: Date
}
```

#### Matches Collection

```javascript
{
  _id: ObjectId,
  roomId: ObjectId (ref: 'Room'),
  roomName: String,
  participants: [{
    userId: ObjectId (ref: 'User'),
    username: String,
    rating: Number,
    ratingChange: Number,
    finalScore: Number,
    completionTime: Number,
    submissions: Number,
    rank: Number
  }],
  settings: {
    mode: String,
    difficulty: String,
    timeLimit: Number,
    language: String
  },
  problems: Array,
  status: String ('in-progress' | 'completed' | 'cancelled'),
  winner: ObjectId (ref: 'User'),
  winnerUsername: String,
  startedAt: Date,
  completedAt: Date,
  duration: Number
}
```

#### Friends Collection

```javascript
{
  _id: ObjectId,
  requesterId: ObjectId (ref: 'User'),
  recipientId: ObjectId (ref: 'User'),
  requesterUsername: String,
  recipientUsername: String,
  status: String ('pending' | 'accepted' | 'declined' | 'blocked'),
  requestedAt: Date,
  respondedAt: Date,
  totalMatches: Number,
  canSeeOnlineStatus: Boolean,
  canInviteToMatches: Boolean,
  canViewStats: Boolean
}
```

---

## Hệ Thống Thi Đấu

### 🎯 Luồng Hoạt Động

#### 1. Tạo Phòng và Chờ Người Chơi

```
Chủ phòng tạo phòng → Cài đặt (độ khó, thời gian) → Phòng được tạo
→ Chủ phòng vào WaitingRoom
→ Người chơi khác tham gia qua room code hoặc danh sách phòng
→ WebSocket broadcast: user_joined_room
```

**Components:**
- `CreateRoomModal.tsx` - Tạo phòng
- `WaitingRoom.tsx` - Phòng chờ
- `PvPRoom model` - Database schema

#### 2. Hệ Thống Sẵn Sàng (Ready System)

```
Người chơi vào phòng → Click nút "Sẵn sàng"
→ Backend cập nhật participant.isReady = true
→ WebSocket broadcast: ready_status_changed
→ Tất cả client nhận update và hiển thị status mới
→ Khi tất cả sẵn sàng: Chủ phòng có thể bắt đầu
```

**Logic kiểm tra:**
```typescript
const allReady = room.participants.every(p => p.isReady) && 
                 room.participants.length >= 2;
```

#### 3. Bắt Đầu Trận Đấu

```
Chủ phòng click "Bắt đầu" (khi allReady = true)
→ Backend: startMatch(roomId)
  ├── Chọn challenge ngẫu nhiên theo độ khó
  ├── Tạo PVPMatch document
  ├── Cập nhật room.status = 'in-progress'
  ├── WebSocket broadcast: match_started
  └── Return: { matchId, challenge }
→ Tất cả client chuyển sang PvPArena
```

**Challenge Selection Algorithm:**
```typescript
const challenge = await Challenge.aggregate([
  { $match: { 
    difficulty: room.settings.difficulty,
    isActive: true 
  }},
  { $sample: { size: 1 } }
]);
```

#### 4. Giao Diện Thi Đấu (Arena)

```
PvPArena mở → Hiển thị:
├── Timer đếm ngược (timeLimit từ settings)
├── Challenge description (chỉ hiện public test cases)
├── Code Editor (Monaco Editor)
├── Language selector
├── Submit button
└── Real-time opponent progress
```

**Không hiển thị:**
- Hidden test cases (chỉ dùng để đánh giá)
- Code của đối thủ
- Kết quả chi tiết của đối thủ (chỉ hiện progress %)

#### 5. Submit Code và Đánh Giá

```
User viết code → Click "Submit"
→ Backend: submitCode(matchId, code, language)
  ├── Lấy challenge của match
  ├── Run code qua Judge0 với TẤT CẢ test cases (public + hidden)
  ├── Tính điểm:
  │   - passedTests / totalTests
  │   - Thời gian hoàn thành (từ match.startedAt)
  ├── Cập nhật participant trong match
  ├── Kiểm tra điều kiện thắng
  └── WebSocket broadcast: submission_received
→ Client nhận kết quả và hiển thị
```

**Submission Result:**
```typescript
interface SubmissionResult {
  score: number;              // Percentage (0-100)
  passedTests: number;        // Số test cases passed
  totalTests: number;         // Tổng số test cases
  testResults: Array<{
    testCase: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: string;
    passed: boolean;
    executionTime: number;
    memory: number;
  }>;
}
```

#### 6. Xác Định Người Chiến Thắng

**Trường hợp 1: Có người hoàn thành tất cả test cases**
```
User A pass all tests first → Auto call finishMatch()
→ Backend: determineWinner()
  ├── Sort participants by:
  │   1. passedTests === totalTests (first)
  │   2. completionTime (faster wins)
  ├── Set winnerId và isWinner flag
  ├── Calculate XP:
  │   - Easy: +20 XP
  │   - Medium: +50 XP
  │   - Hard: +100 XP
  └── Update match.status = 'completed'
→ WebSocket broadcast: match_completed
→ All clients show PvPResult
```

**Trường hợp 2: Hết thời gian**
```
Timer reaches 0 → Auto call finishMatch()
→ Backend: determineWinner()
  ├── Sort participants by:
  │   1. passedTests (more is better)
  │   2. score percentage
  │   3. completionTime (faster is better)
  ├── Set winner
  ├── Calculate XP (reduced if not all tests passed)
  └── Update match.status = 'completed'
→ WebSocket broadcast: match_completed
→ All clients show PvPResult
```

**Winner Determination Algorithm:**
```typescript
pvpMatchSchema.methods.determineWinner = function(): void {
  const sortedParticipants = [...this.participants].sort((a, b) => {
    // 1. Ưu tiên người pass all tests
    const aPassedAll = a.passedTests === a.totalTests;
    const bPassedAll = b.passedTests === b.totalTests;
    
    if (aPassedAll && !bPassedAll) return -1;
    if (!aPassedAll && bPassedAll) return 1;
    
    // 2. So sánh số tests passed
    if (a.passedTests !== b.passedTests) {
      return b.passedTests - a.passedTests;
    }
    
    // 3. So sánh score percentage
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    
    // 4. So sánh thời gian (nhanh hơn = tốt hơn)
    return a.completionTime - b.completionTime;
  });
  
  const winner = sortedParticipants[0];
  if (winner) {
    this.winnerId = winner.userId;
    winner.isWinner = true;
  }
};
```

### 📡 API Endpoints

#### Room Management
```
GET    /api/pvp/rooms              - Lấy danh sách phòng
POST   /api/pvp/rooms              - Tạo phòng mới
GET    /api/pvp/rooms/:id          - Chi tiết phòng
POST   /api/pvp/rooms/:id/join     - Tham gia phòng
POST   /api/pvp/rooms/:id/start    - Bắt đầu trận đấu
DELETE /api/pvp/rooms/:id          - Xóa phòng
```

#### Match Management
```
POST   /api/pvp/matches/:id/submit   - Submit code
POST   /api/pvp/matches/:id/finish   - Kết thúc trận
GET    /api/pvp/matches/:id/status   - Lấy trạng thái trận
```

#### Friend System
```
GET    /api/pvp/friends            - Danh sách bạn bè
POST   /api/pvp/friends/request    - Gửi lời mời
PUT    /api/pvp/friends/:id        - Chấp nhận/từ chối
DELETE /api/pvp/friends/:id        - Xóa bạn
```

#### Statistics
```
GET    /api/pvp/leaderboard        - Bảng xếp hạng
GET    /api/pvp/stats              - Thống kê người dùng
GET    /api/pvp/matches            - Lịch sử đấu
```

### 🔌 WebSocket Events

#### Client → Server
```javascript
socket.emit('room:join', { roomId, token })
socket.emit('room:leave', { roomId })
socket.emit('room:ready', { roomId, isReady })
```

#### Server → Client
```javascript
socket.on('room_updated', (room) => {})
socket.on('user_joined_room', (user) => {})
socket.on('user_left_room', (user) => {})
socket.on('ready_status_changed', (data) => {})
socket.on('match_started', (match) => {})
socket.on('submission_received', (data) => {})
socket.on('match_completed', (results) => {})
```

### 🏆 Elo Rating System

**Công thức tính toán:**
- **Win**: +25-32 điểm (tùy rating đối thủ)
- **Loss**: -25-32 điểm
- **Draw**: 0 điểm
- **K factor**: 32 (cho người mới)

**Expected Score:**
```
ExpectedA = 1 / (1 + 10^((RatingB - RatingA) / 400))
```

**New Rating:**
```
NewRatingA = RatingA + K * (ActualScoreA - ExpectedScoreA)
```

---

## User Flow

### Luồng Chi Tiết

#### 1. Đăng Nhập & Xác Thực
```
Người dùng → Trang Login → Đăng nhập thành công 
→ Token JWT được lưu → Chuyển hướng đến trang chủ
```

#### 2. Truy Cập Trang PvP
```
Người dùng → Click "Thi Đấu" → Chuyển đến trang PvP (/pvp)
→ Hiển thị:
  ├── Stats Overview (Online users, Active matches, Rooms waiting)
  ├── Tabs: Sảnh Chính, Online Users, Bạn Bè, Lịch Sử
  └── Actions: Matchmaking, Tạo phòng, Thách đấu
```

#### 3. Tạo Phòng Mới
```
User → Click "Tạo Phòng" → Mở modal → Điền thông tin:
- Tên phòng
- Chế độ (1vs1, Tournament)
- Độ khó (Easy, Medium, Hard)
- Giới hạn thời gian
- Công khai/Riêng tư
→ Click "Tạo Phòng" → Phòng được tạo
```

#### 4. Tham Gia Phòng
```
User → Click "Tham Gia" → Kiểm tra:
- Phòng công khai: Tham gia trực tiếp
- Phòng riêng tư: Nhập mật khẩu
- Phòng đầy: Hiển thị thông báo
→ Tham gia thành công → Vào phòng chờ
```

#### 5. Sẵn Sàng và Bắt Đầu
```
User → Click "Sẵn sàng"
→ Đợi người chơi khác sẵn sàng
→ Host click "Bắt đầu"
→ Chuyển sang PvPArena
```

#### 6. Thi Đấu
```
User → Đọc đề bài → Viết code → Submit
→ Xem kết quả test cases
→ Tiếp tục cải thiện hoặc đợi hết giờ
→ Trận kết thúc → Xem kết quả
```

---

## Testing Guide

### 🚀 Bước 1: Khởi động hệ thống

#### Server
```bash
cd server
npm run dev
```
Server chạy tại http://localhost:5000

#### Client
```bash
cd client
npm run dev
```
Client chạy tại http://localhost:5174

### 🔐 Bước 2: Đăng nhập bằng 2 user

#### User 1 (Tab 1)
1. Mở trình duyệt, truy cập http://localhost:5174/login
2. Đăng nhập với:
   - Email: `admin@bughunter.com`
   - Password: `admin123`
3. Vào http://localhost:5174/pvp

#### User 2 (Tab 2 - Incognito)
1. Mở tab ẩn danh/incognito window
2. Truy cập http://localhost:5174/login
3. Đăng nhập với user khác

### 🎮 Bước 3: Test Multi-User Room

#### Test Case 1: User 1 tạo phòng, User 2 tham gia

**User 1:**
1. Click "Tạo phòng"
2. Điền thông tin:
   - Tên: `Test Room Real-time`
   - Độ khó: `Trung bình`
   - Thời gian: `15 phút`
3. Click "Tạo phòng"
4. Chờ trong Waiting Room

**User 2:**
1. Tại trang PvP, thấy phòng trong danh sách
2. Click "Tham gia"
3. Vào Waiting Room

**Kiểm tra:**
- ✅ User 1 thấy User 2 tham gia (real-time)
- ✅ User 2 thấy thông báo đã tham gia
- ✅ Danh sách participants cập nhật real-time

#### Test Case 2: Ready Status

**User 1 & 2:**
1. Trong Waiting Room, cả hai click "Sẵn sàng"
2. Khi cả hai đều sẵn sàng, host có thể bắt đầu

#### Test Case 3: Bắt đầu trận đấu

**User 1 (Host):**
1. Click "Bắt đầu trận đấu"
2. Cả hai chuyển sang PvPArena

**Kiểm tra:**
- ✅ Challenge được chọn ngẫu nhiên
- ✅ Timer bắt đầu đếm ngược
- ✅ Code editor hoạt động
- ✅ Submit button có sẵn

### 🔍 Debug và Troubleshooting

#### Kiểm tra Console Logs

**Client logs:**
- `🔌 Socket.IO connected successfully!`
- `📢 Room updated event received:`
- `📢 User joined room event received:`

**Server logs:**
- `📢 Broadcasting room update for room:`
- `SimplePvPApi: Sending request with token:`

#### Common Issues

**1. Không thấy real-time update:**
- Kiểm tra WebSocket connection trong console
- F5 refresh để reconnect
- Đảm bảo cả hai user đã login

**2. Authentication error:**
- Đảm bảo đã login với token hợp lệ
- Kiểm tra localStorage có `token`

**3. Room không hiển thị:**
- Refresh danh sách phòng
- Kiểm tra status phòng (`waiting`)

### 📊 Expected Behavior

1. **Real-time Updates**: Khi một người tham gia/rời, người khác thấy ngay
2. **Live Notifications**: Toast notifications khi có sự kiện
3. **Auto-refresh**: Danh sách phòng tự động cập nhật
4. **Participant List**: Hiển thị đúng số người và status

### 🧪 Test Checklist

- [ ] User 1 tạo phòng thành công
- [ ] User 2 thấy phòng trong danh sách
- [ ] User 2 tham gia phòng thành công
- [ ] User 1 thấy User 2 tham gia real-time
- [ ] Room code hoạt động
- [ ] Ready status cập nhật real-time
- [ ] Bắt đầu trận đấu thành công
- [ ] Submit code hoạt động
- [ ] Xác định winner đúng
- [ ] XP được cập nhật

---

## 🔒 Security Considerations

### 1. Anti-Cheating Measures
- Không hiển thị hidden test cases
- Không gửi code của đối thủ
- Server-side validation cho tất cả submissions
- Rate limiting cho submissions (max 1 lần/5s)

### 2. Authorization Checks
```typescript
// Chỉ participants mới được submit
const isParticipant = match.participants.some(p => 
  p.userId.toString() === userId.toString()
);
if (!isParticipant) {
  throw new Error('Unauthorized');
}
```

### 3. Data Validation
- Validate code length (max 10,000 chars)
- Validate language selection
- Validate match status before operations
- Sanitize all user inputs

---

## ⚡ Performance Optimizations

### 1. Database Indexing
```typescript
pvpMatchSchema.index({ roomId: 1 });
pvpMatchSchema.index({ status: 1, startedAt: -1 });
pvpMatchSchema.index({ 'participants.userId': 1 });
```

### 2. WebSocket Optimization
- Chỉ broadcast cho participants của room
- Throttle frequent updates (max 1/second)
- Use rooms để isolate events

### 3. Judge0 Optimization
- Connection pooling
- Timeout handling
- Fallback mechanism khi Judge0 down

---

## 🎯 Future Enhancements

### Phase 2 Features
1. **Replay System** - Xem lại code và submissions
2. **Spectator Mode** - Xem người khác thi đấu
3. **Tournament Mode** - Thi đấu loại trực tiếp
4. **Team Mode** - 2v2 hoặc team battles
5. **Ranked System** - MMR và divisions
6. **Achievement System** - Badges và milestones

---

**Last Updated:** 2025-12-03
**Version:** 2.0.0