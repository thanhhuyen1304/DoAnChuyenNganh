# Hướng Dẫn Cài Đặt Database cho Chức Năng PvP

## 📋 Tổng Quan

Chức năng PvP cần các collections sau trong MongoDB:
- `users` - Thông tin người dùng và thống kê PvP
- `rooms` - Phòng đấu đang chờ và đang hoạt động
- `matches` - Lịch sử các trận đấu đã hoàn thành
- `friends` - Quan hệ bạn bè và lời mời kết bạn
- `challenges` - Các bài tập dùng cho PvP (đã có sẵn)

## 🚀 Quick Setup

### Bước 1: Chạy Script Setup Database

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
- ✅ Hiển thị thống kê database

### Bước 2: Khởi Động Server

```bash
npm start
```

### Bước 3: Kiểm Tra Frontend

```bash
cd client
npm run dev
```

Mở trình duyệt tại `http://localhost:3000` và vào trang PvP.

## 📊 Database Schema

### Users Collection
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

### Rooms Collection
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
  problems: [{
    id: String,
    title: String,
    description: String,
    difficulty: String,
    timeLimit: Number,
    memoryLimit: Number,
    testCases: [{
      input: String,
      expectedOutput: String
    }]
  }],
  results: [{
    userId: ObjectId (ref: 'User'),
    username: String,
    score: Number,
    completionTime: Number,
    submissions: Number,
    rank: Number,
    ratingChange: Number
  }],
  createdAt: Date,
  updatedAt: Date,
  startedAt: Date,
  completedAt: Date
}
```

### Matches Collection
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
  problems: [{
    id: String,
    title: String,
    difficulty: String,
    submissions: [{
      userId: ObjectId (ref: 'User'),
      code: String,
      language: String,
      status: String,
      score: Number,
      executionTime: Number,
      memoryUsage: Number,
      submittedAt: Date
    }]
  }],
  status: String ('in-progress' | 'completed' | 'cancelled'),
  winner: ObjectId (ref: 'User'),
  winnerUsername: String,
  startedAt: Date,
  completedAt: Date,
  duration: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Friends Collection
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
  lastInteraction: Date,
  friendshipLevel: Number,
  totalMatches: Number,
  messagesExchanged: Number,
  blockReason: String,
  canSeeOnlineStatus: Boolean,
  canInviteToMatches: Boolean,
  canViewStats: Boolean
}
```

## 🔧 Manual Setup (Nếu script không hoạt động)

### 1. Kết nối MongoDB
```bash
mongosh
use bughunter
```

### 2. Tạo Admin User
```javascript
db.users.insertOne({
  email: "admin@bughunter.com",
  username: "admin",
  password: "$2a$10$...", // Sẽ được hash tự động
  favoriteLanguages: ["Python", "JavaScript", "Java"],
  experience: 1000,
  rank: "Expert",
  badges: ["admin", "founder"],
  rating: 1500,
  level: 10,
  role: "admin",
  pvpStats: {
    wins: 0,
    losses: 0,
    draws: 0,
    totalMatches: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageCompletionTime: 0
  }
});
```

### 3. Tạo Test Room
```javascript
db.rooms.insertOne({
  name: "CodeMaster's Arena",
  description: "Phòng luyện tập cho lập trình viên intermediate",
  hostId: ObjectId("ADMIN_USER_ID"), // Thay bằng ID admin user thực tế
  hostUsername: "admin",
  participants: [{
    userId: ObjectId("ADMIN_USER_ID"),
    username: "admin",
    rating: 1500,
    joinedAt: new Date(),
    isReady: false
  }],
  settings: {
    mode: "1vs1",
    difficulty: "medium",
    timeLimit: 30,
    language: "any",
    isPrivate: false,
    maxParticipants: 2,
    autoStart: false,
    allowSpectators: true
  },
  status: "waiting",
  currentRound: 1,
  totalRounds: 1,
  problems: [],
  results: []
});
```

## 🧪 Test Chức Năng

### 1. Test Tạo Phòng
1. Login với admin user
2. Vào trang PvP
3. Click "Tạo Phòng"
4. Điền thông tin và submit
5. Kiểm tra trong MongoDB: `db.rooms.find().pretty()`

### 2. Test Tham Gia Phòng
1. Login với testuser1
2. Trong danh sách phòng, click "Tham Gia"
3. Kiểm tra participants trong room

### 3. Test API Endpoints
```bash
# Get rooms
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/pvp/rooms

# Create room
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name":"Test Room","settings":{"difficulty":"medium","timeLimit":15}}' \
     http://localhost:5000/api/pvp/rooms
```

## 🔍 Troubleshooting

### Server không khởi động
```bash
# Kiểm tra port
netstat -an | grep 5000

# Kiểm tra MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"
```

### TypeScript errors
```bash
# Kiểm tra TypeScript compilation
cd server
npm run build

# Hoặc chạy với ts-node
npx ts-node scripts/setup-pvp-simple.ts
```

### Database connection errors
```bash
# Kiểm tra MongoDB URI
echo $MONGODB_URI

# Test connection manually
mongosh $MONGODB_URI
```

## 📝 Notes Quan Trọng

1. **Indexes**: Các models đã có indexes để tối ưu performance
2. **Authentication**: Tất cả PvP routes cần JWT token
3. **Validation**: Frontend và backend đều có validation
4. **Error Handling**: Proper error responses với status codes
5. **Type Safety**: TypeScript interfaces đã được định nghĩa

## 🚀 Production Deployment

1. **Environment Variables**: Đảm bảo các biến môi trường được set
2. **MongoDB Security**: Sử dụng authentication và SSL
3. **Password Security**: Thay đổi mật khẩu admin mặc định
4. **Rate Limiting**: Implement rate limiting cho API endpoints
5. **Monitoring**: Add logging và monitoring cho production

## 📚 Related Files

- `server/src/models/user.model.ts` - User model và PvP stats
- `server/src/models/room.model.ts` - Room model với participants
- `server/src/models/match.model.ts` - Match model với results
- `server/src/models/friend.model.ts` - Friend system model
- `server/src/controllers/pvp.controller.ts` - PvP API endpoints
- `client/src/services/pvpApi.ts` - Frontend API service
- `client/src/components/pvp/CreateRoomModal.tsx` - Create room UI
- `client/src/components/pages/PvPPage.tsx` - Main PvP page

---

**Sau khi setup xong, chức năng tạo phòng PvP sẽ hoạt động với database thật! 🎉**