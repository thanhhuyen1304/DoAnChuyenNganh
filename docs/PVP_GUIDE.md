# Hướng dẫn Hệ thống PvP (Player vs Player)

## Tổng quan
Hệ thống PvP cho phép người dùng thi đấu đối kháng thời gian thực trong các trận đấu lập trình. Hệ thống hỗ trợ tạo phòng, matchmaking, và theo dõi kết quả với ranking Elo.

## Tính năng chính
- **Tạo phòng**: Tùy chỉnh tên, mật khẩu, chế độ, độ khó
- **Matchmaking**: Tìm đối thủ thông minh dựa trên rating Elo
- **Real-time**: WebSocket cho cập nhật trực tiếp
- **Friend System**: Kết bạn và quản lý lời mời
- **Statistics**: Lịch sử đấu, win rate, ranking

## Database Schema

### User Model
```javascript
{
  username: String,
  email: String,
  rating: Number,        // Elo rating (default: 1200)
  level: Number,         // User level
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

### Room Model
```javascript
{
  name: String,
  description: String,
  hostId: ObjectId,
  participants: [{
    userId: ObjectId,
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
    mode: String,        // '1vs1', 'tournament', 'practice'
    difficulty: String,   // 'easy', 'medium', 'hard', 'expert'
    timeLimit: Number,
    language: String,
    isPrivate: Boolean,
    password: String,
    maxParticipants: Number,
    autoStart: Boolean,
    allowSpectators: Boolean
  },
  status: String,        // 'waiting', 'in-progress', 'completed', 'cancelled'
  problems: [ProblemSchema],
  results: [ResultSchema],
  createdAt: Date,
  updatedAt: Date
}
```

### Match Model
```javascript
{
  roomId: ObjectId,
  roomName: String,
  participants: [{
    userId: ObjectId,
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
  problems: [ProblemSchema],
  status: String,        // 'in-progress', 'completed', 'cancelled'
  winner: ObjectId,
  startedAt: Date,
  completedAt: Date,
  duration: Number
}
```

### Friend Model
```javascript
{
  requesterId: ObjectId,
  recipientId: ObjectId,
  requesterUsername: String,
  recipientUsername: String,
  status: String,        // 'pending', 'accepted', 'declined', 'blocked'
  requestedAt: Date,
  respondedAt: Date,
  totalMatches: Number,
  canSeeOnlineStatus: Boolean,
  canInviteToMatches: Boolean,
  canViewStats: Boolean
}
```

## Setup Database

### Quick Setup
Chạy script để tạo sample data:
```bash
cd server
npm run ts-node scripts/setup-pvp-simple.ts
```

Script này sẽ:
- Tạo admin user (`admin@bughunter.com` / `admin123`)
- Tạo 2 test users (`testuser1`, `testuser2`) với mật khẩu `test123`
- Tạo sample room "CodeMaster's Arena"
- Tạo sample match đã hoàn thành
- Tạo sample friend request

### Manual Setup
```bash
# Kết nối MongoDB
mongosh
use bughunter

# Tạo indexes cho performance
db.users.createIndex({ "rating": -1 })
db.rooms.createIndex({ "status": 1, "createdAt": -1 })
db.matches.createIndex({ "participants.userId": 1, "completedAt": -1 })
db.friends.createIndex({ "requesterId": 1, "recipientId": 1 })
```

## API Endpoints

### Room Management
```
GET    /api/pvp/rooms              - Lấy danh sách phòng
POST   /api/pvp/rooms              - Tạo phòng mới
GET    /api/pvp/rooms/:id          - Chi tiết phòng
POST   /api/pvp/rooms/:id/join     - Tham gia phòng
DELETE /api/pvp/rooms/:id          - Xóa phòng
```

### Matchmaking
```
POST   /api/pvp/matchmaking        - Bắt đầu tìm trận
DELETE /api/pvp/matchmaking        - Hủy tìm trận
```

### Friend System
```
GET    /api/pvp/friends            - Danh sách bạn bè
POST   /api/pvp/friends/request    - Gửi lời mời
PUT    /api/pvp/friends/:id        - Chấp nhận/từ chối
DELETE /api/pvp/friends/:id        - Xóa bạn
```

### Match History
```
GET    /api/pvp/matches            - Lịch sử đấu
GET    /api/pvp/matches/:id        - Chi tiết trận
```

### Statistics
```
GET    /api/pvp/leaderboard        - Bảng xếp hạng
GET    /api/pvp/stats              - Thống kê người dùng
```

## WebSocket Events

### Client → Server
```javascript
// Room events
socket.emit('room:join', { roomId, token })
socket.emit('room:leave', { roomId })
socket.emit('room:ready', { roomId, isReady })

// Matchmaking
socket.emit('matchmaking:start', { settings })
socket.emit('matchmaking:cancel')

// Friend system
socket.emit('friend:request', { userId })
socket.emit('friend:accept', { requestId })
socket.emit('friend:decline', { requestId })
```

### Server → Client
```javascript
// Room updates
socket.on('room:updated', (room) => {})
socket.on('room:user_joined', (user) => {})
socket.on('room:user_left', (user) => {})
socket.on('room:started', (match) => {})

// Matchmaking
socket.on('match:found', (opponent) => {})
socket.on('match:accepted', () => {})
socket.on('match:rejected', () => {})

// Friend system
socket.on('friend:request_received', (request) => {})
socket.on('friend:accepted', (friend) => {})
socket.on('friend:online', (userId) => {})
socket.on('friend:offline', (userId) => {})
```

## Luồng người dùng

### 1. Đăng nhập → Trang PvP
```
User đăng nhập → Navigation đến trang PvP → Load user profile và statistics
```

### 2. Tạo phòng → Chờ người tham gia
```
Click "Tạo Phòng" → Điền thông tin → Phòng được tạo → Chờ người tham gia
```

### 3. Tham gia phòng → Sẵn sàng
```
Danh sách phòng → Click "Tham Gia" → Vào phòng chờ → Click "Sẵn sàng"
```

### 4. Bắt đầu trận → Đấu
```
Cả hai sẵn sàng → Host bắt đầu trận → Chuyển đến trang đấu → Bắt đầu đếm ngược
```

### 5. Kết thúc trận → Cập nhật ranking
```
Hết thời gian hoặc hoàn thành → Tính điểm → Cập nhật Elo rating → Lưu kết quả
```

## Elo Rating System

### Công thức tính toán
- **Win**: +25-32 điểm (tùy rating đối thủ)
- **Loss**: -25-32 điểm
- **Draw**: 0 điểm
- **K factor**: 32 (cho người mới)

### Expected Score
```
ExpectedA = 1 / (1 + 10^((RatingB - RatingA) / 400))
```

### New Rating
```
NewRatingA = RatingA + K * (ActualScoreA - ExpectedScoreA)
```

## Testing Multi-User

### Bước 1: Khởi động hệ thống
```bash
# Server
cd server
npm run dev

# Client
cd client
npm run dev
```

### Bước 2: Đăng nhập bằng 2 user
- **User 1**: Tab bình thường
- **User 2**: Incognito window
- Cả hai đăng nhập với tài khoản khác nhau

### Bước 3: Test tạo và tham gia phòng
1. User 1 tạo phòng
2. User 2 thấy phòng trong danh sách
3. User 2 tham gia phòng
4. Kiểm tra real-time updates

### Bước 4: Debug
Mở browser DevTools (F12) và xem console:
- Client logs: WebSocket connection, events received
- Server logs: Room updates, match creation

## Troubleshooting

### Không thấy real-time updates
- Kiểm tra WebSocket connection trong console
- F5 refresh lại trang để reconnect
- Đảm bảo cả hai user đều đã login

### Authentication error
- Đảm bảo đã login với token hợp lệ
- Kiểm tra localStorage có `token` không

### Room không hiển thị
- Refresh lại danh sách phòng
- Kiểm tra status phòng (`waiting` chứ không phải `in-progress`)

### Matchmaking không hoạt động
- Kiểm tra WebSocket connection
- Xem logs server để debug
- Đảm bảo có user khác trong hàng đợi

## Performance Optimization

### Database Indexes
```javascript
// Performance indexes
db.users.createIndex({ "rating": -1 })
db.rooms.createIndex({ "status": 1, "createdAt": -1 })
db.matches.createIndex({ "participants.userId": 1, "completedAt": -1 })
db.friends.createIndex({ "requesterId": 1, "recipientId": 1 })
```

### Caching
- Cache user profiles và statistics
- Cache leaderboard data
- Cache active rooms list

### WebSocket Optimization
- Limit events per second
- Batch updates for room lists
- Disconnect inactive users

## Security Considerations

### Input Validation
- Validate tất cả room settings
- Sanitize room names và descriptions
- Rate limit room creation

### Authorization
- Check room ownership cho delete operations
- Verify participant permissions
- Validate friend requests

### Rate Limiting
- Limit room creation per user
- Limit matchmaking requests
- Limit friend requests per day