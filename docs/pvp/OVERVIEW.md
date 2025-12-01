# Tổng quan Hệ thống PVP

## 📋 Giới thiệu

Hệ thống PvP (Player vs Player) cho phép người dùng thi đấu đối kháng thời gian thực trong các trận đấu lập trình. Đây là tính năng nổi bật của BugHunter, kết hợp giữa học tập và cạnh tranh.

## 🎯 Tính năng chính

### 1. Quản lý Phòng
- **Tạo phòng**: Tùy chỉnh tên, mật khẩu, độ khó, thời gian
- **Tham gia phòng**: Qua room code hoặc danh sách công khai
- **Phòng riêng tư**: Bảo vệ bằng mật khẩu
- **Chế độ**: 1v1, Tournament, Practice

### 2. Hệ thống Ready
- Người chơi đánh dấu "Sẵn sàng" trước khi bắt đầu
- Real-time sync trạng thái sẵn sàng
- Chủ phòng có thể bắt đầu khi tất cả đã sẵn sàng

### 3. Matchmaking Thông minh
- Tìm đối thủ dựa trên Elo rating
- Auto-matching trong 30 giây
- Cancel queue bất kỳ lúc nào

### 4. Hệ thống Bạn bè
- Gửi/nhận lời mời kết bạn
- Quản lý danh sách bạn bè
- Mời bạn vào phòng riêng
- Xem thống kê đấu với bạn bè

### 5. Thi đấu Real-time
- Code editor với syntax highlighting
- Đồng hồ đếm ngược
- Live progress của đối thủ
- Auto-submit khi hết giờ

### 6. Ranking & Statistics
- **Elo Rating System**: Điểm ranking từ 1200
- **Leaderboard**: Bảng xếp hạng toàn server
- **Statistics**: Win rate, average time, streaks
- **Match History**: Lịch sử các trận đấu

## 🏗️ Kiến trúc Hệ thống

### Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB với Mongoose
- **Real-time**: Socket.IO (WebSocket)
- **Code Execution**: Judge0 API
- **Authentication**: JWT tokens

### Database Models

#### User Model
```typescript
{
  username: String,
  email: String,
  rating: Number,        // Elo rating (1200 mặc định)
  level: Number,
  pvpStats: {
    wins: Number,
    losses: Number,
    draws: Number,
    totalMatches: Number,
    winRate: Number,
    currentStreak: Number,
    bestStreak: Number,
    averageCompletionTime: Number,
    totalXP: Number
  }
}
```

#### Room Model
```typescript
{
  name: String,
  hostId: ObjectId,
  participants: [{
    userId: ObjectId,
    username: String,
    rating: Number,
    isReady: Boolean,
    joinedAt: Date
  }],
  settings: {
    mode: 'I1vs1' | 'tournament' | 'practice',
    difficulty: 'easy' | 'medium' | 'hard' | 'expert',
    timeLimit: Number,
    isPrivate: Boolean,
    password: String,
    maxParticipants: Number
  },
  status: 'waiting' | 'in-progress' | 'completed',
  createdAt: Date
}
```

#### PVPMatch Model
```typescript
{
  roomId: ObjectId,
  challengeId: ObjectId,
  participants: [{
    userId: ObjectId,
    username: String,
    score: Number,
    passedTests: Number,
    totalTests: Number,
    completionTime: Number,
    submittedAt: Date,
    isWinner: Boolean
  }],
  status: 'in-progress' | 'completed' | 'cancelled',
  winnerId: ObjectId,
  startedAt: Date,
  completedAt: Date
}
```

#### Friend Model
```typescript
{
  requesterId: ObjectId,
  recipientId: ObjectId,
  status: 'pending' | 'accepted' | 'declined' | 'blocked',
  requestedAt: Date,
  respondedAt: Date
}
```

## 🔄 Luồng hoạt động

### 1. Tạo và Tham gia Phòng
```
User tạo phòng → Cấu hình settings → Phòng được tạo
→ Người khác tham gia → WebSocket broadcast user_joined_room
→ Tất cả đánh dấu "Sẵn sàng"
```

### 2. Bắt đầu Trận đấu
```
Tất cả ready → Host click "Bắt đầu"
→ Backend chọn challenge ngẫu nhiên theo độ khó
→ Tạo PVPMatch document
→ WebSocket broadcast match_started
→ Tất cả chuyển sang Arena
```

### 3. Thi đấu
```
User viết code → Submit → Judge0 chạy test cases
→ Tính điểm dựa trên passed tests
→ WebSocket broadcast submission_received
→ Tiếp tục improve hoặc đợi hết giờ
```

### 4. Kết thúc
```
Pass all tests hoặc timeout → finishMatch()
→ Determine winner dựa trên:
  1. Passed tests (nhiều hơn)
  2. Score percentage
  3. Completion time (nhanh hơn)
→ Calculate XP và update Elo rating
→ WebSocket broadcast match_completed
→ Hiển thị kết quả
```

## 🎮 Elo Rating System

### Công thức
```
ExpectedA = 1 / (1 + 10^((RatingB - RatingA) / 400))
NewRatingA = RatingA + K * (ActualScoreA - ExpectedScoreA)
```

### K Factor
- **Người mới** (< 30 trận): K = 32
- **Người thường** (30-100 trận): K = 24
- **Người Pro** (> 100 trận): K = 16

### Điểm thưởng
- **Easy**: +20 XP
- **Medium**: +50 XP
- **Hard**: +100 XP
- **Expert**: +200 XP

## 📊 WebSocket Events

### Server → Client
```typescript
'room_updated'          // Cập nhật thông tin phòng
'user_joined_room'      // Có người tham gia
'user_left_room'        // Có người rời đi
'ready_status_changed'  // Trạng thái ready thay đổi
'match_started'         // Trận đấu bắt đầu
'submission_received'   // Có submission mới
'match_completed'       // Trận kết thúc
'friend_request'        // Lời mời kết bạn
'friend_accepted'       // Chấp nhận kết bạn
```

### Client → Server
```typescript
'room:join'             // Tham gia phòng
'room:leave'            // Rời phòng
'room:ready'            // Đánh dấu sẵn sàng
'matchmaking:start'     // Bắt đầu tìm trận
'matchmaking:cancel'    // Hủy tìm trận
'friend:request'        // Gửi lời mời kết bạn
```

## 🆕 Tính năng Mới (2025-12-01)

### Leaderboard Tổng hợp
- **Tab "Bài Đơn"**: Xếp hạng theo practice submissions
  - Số bài hoàn thành
  - Điểm cao nhất
  - Tổng điểm
  - Thời gian hoạt động
  - Huy chương và cấp bậc

- **Tab "PvP"**: Xếp hạng theo PvP stats
  - Số trận thắng/thua/hòa
  - Tỷ lệ thắng
  - Tổng XP
  - Tổng số trận

### Hệ thống Bạn bè Mở rộng
- Gửi lời mời kết bạn real-time
- Quản lý danh sách bạn bè
- Xem online status
- Mời bạn vào phòng riêng

### UI/UX Improvements
- Top 3 có màu vàng đặc biệt (🏆 #1, 🥈 #2, 🥉 #3)
- Dark mode support
- Responsive design
- Smooth scrolling
- Icons và badges

## 🔒 Bảo mật

### Anti-Cheating
- Không hiển thị hidden test cases
- Không gửi code của đối thủ
- Server-side validation tất cả submissions
- Rate limiting: Max 1 submission / 5s

### Authorization
- Chỉ participants mới được submit
- Chỉ host mới start match
- Kiểm tra ownership khi delete room

### Data Validation
- Validate code length (max 10,000 chars)
- Validate language selection
- Sanitize user inputs

## ⚡ Performance

### Database Indexes
```typescript
// Performance indexes
db.users.createIndex({ "rating": -1 })
db.rooms.createIndex({ "status": 1, "createdAt": -1 })
db.pvpMatches.createIndex({ "participants.userId": 1 })
db.friends.createIndex({ "requesterId": 1, "recipientId": 1 })
```

### Caching
- Cache user profiles
- Cache leaderboard (refresh mỗi 5 phút)
- Cache active rooms list

### WebSocket Optimization
- Chỉ broadcast cho participants của room
- Throttle frequent updates (max 1/second)
- Use rooms để isolate events

## 🐛 Bug Fixes Gần đây

### Dialog Closing Issue (Fixed)
- **Vấn đề**: Dialog đóng khi click vào nội dung
- **Giải pháp**: Thêm `onInteractOutside` handler

### Draw Logic Issue (Fixed)
- **Vấn đề**: Không handle trường hợp hòa đúng
- **Giải pháp**: Cập nhật winner determination logic

### Leaderboard Duplicate Keys (Fixed)
- **Vấn đề**: React warning về duplicate keys
- **Giải pháp**: Sử dụng `key={`pvp-${userId}-${index}`}`

### Admin Position (Fixed)
- **Vấn đề**: Admin không luôn ở top 1
- **Giải pháp**: Set admin stats cao và dùng `unshift()`

## 📚 Tài liệu liên quan

- [USER_GUIDE.md](USER_GUIDE.md) - Hướng dẫn sử dụng cho người dùng
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Chi tiết implementation
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Setup database
- [TESTING.md](TESTING.md) - Hướng dẫn testing
- [CHANGELOG.md](CHANGELOG.md) - Lịch sử thay đổi

## 🚀 Roadmap

### Phase 2 (Tương lai)
- [ ] **Replay System**: Xem lại code và submissions
- [ ] **Spectator Mode**: Xem người khác thi đấu
- [ ] **Tournament Mode**: Thi đấu loại trực tiếp
- [ ] **Team Mode**: 2v2 team battles
- [ ] **Ranked Seasons**: Mùa giải với rewards
- [ ] **Achievement System**: Badges và milestones
- [ ] **Code Review**: Xem code của đối thủ sau trận
- [ ] **In-game Chat**: Chat với moderation

---

**Last Updated:** 2025-12-01
**Version:** 2.0.0