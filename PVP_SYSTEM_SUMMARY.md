# 🎮 Hệ thống PvP (Player vs Player) - BugHunter

## 📋 Tổng quan

Hệ thống PvP là một tính năng đối kháng thời gian thực cho phép người dùng thi đấu với nhau trong các trận đấu lập trình. Hệ thống được xây dựng với kiến trúc đầy đủ từ frontend, backend, database cho đến real-time communication.

## 🏗️ Kiến trúc hệ thống

### Frontend (React/TypeScript)
- **PvPPage**: Trang chính với đầy đủ tính năng
- **CreateRoomModal**: Tạo phòng đấu với các chế độ 1vs1, Tournament
- **MatchmakingModal**: Tìm đối thủ thông minh dựa trên rating Elo
- **FriendSystem**: Hệ thống kết bạn và quản lý lời mời
- **AchievementSystem**: Hệ thống thành tích và phần thưởng
- **Responsive Design**: Tối ưu cho mobile, tablet và desktop

### Backend (Node.js/TypeScript + Express)
- **PvPController**: Xử lý tất cả logic PvP
- **WebSocketService**: Real-time communication
- **Database Models**: User, Room, Match, Friend schemas
- **Authentication**: JWT-based với role-based access
- **API Endpoints**: RESTful APIs cho tất cả tính năng

### Database (MongoDB)
- **User Model**: Rating, level, pvpStats
- **Room Model**: Quản lý phòng đấu
- **Match Model**: Theo dõi trận đấu
- **Friend Model**: Hệ thống bạn bè

## 🚀 Tính năng chính

### 1. Hệ thống phòng đấu
- **Tạo phòng**: Tùy chỉnh tên, mật khẩu, chế độ
- **Phòng chờ**: Quản lý người tham gia
- **Chế độ đấu**: 1vs1, Tournament (với nhiều người)
- **Cài đặt**: Time limit, difficulty, language restrictions

### 2. Matchmaking thông minh
- **Elo Rating**: Hệ thống xếp hạng Elo
- **Smart Matching**: Tìm đối thủ tương xứng
- **Queue System**: Hàng đợi với real-time updates
- **Cancel/Accept**: Hủy hoặc chấp nhận trận đấu

### 3. Hệ thống xã hội
- **Friend List**: Quản lý danh sách bạn bè
- **Friend Requests**: Gửi và nhận lời mời
- **Online Status**: Hiển thị trạng thái người dùng
- **Chat Integration**: Chat trong phòng chờ

### 4. Lịch sử và thống kê
- **Match History**: Lịch sử đấu chi tiết
- **Leaderboard**: Bảng xếp hạng toàn cầu
- **Statistics**: Win rate, average score, best streak
- **Achievements**: Hệ thống thành tích và badges

### 5. Real-time Features
- **WebSocket**: Real-time updates
- **Live Notifications**: Toast notifications
- **Status Updates**: Online/away/in-match status
- **Match Progress**: Real-time score updates

## 🔄 Luồng người dùng

### 1. Đăng nhập → Trang chủ
- User đăng nhập với JWT token
- Điều hướng đến trang PvP từ navigation
- Load user profile và statistics

### 2. Tìm trận → Đấu
- Chọn giữa tạo phòng hoặc matchmaking
- Chờ đối thủ hoặc người tham gia
- Bắt đầu trận đấu với real-time updates

### 3. Đấu → Kết quả
- Submit code với Judge0 integration
- Real-time scoring và feedback
- Hiển thị kết quả và cập nhật rating

## 🛠️ Technical Implementation

### Frontend Technologies
- **React 18**: Component-based architecture
- **TypeScript**: Full type safety
- **Vite**: Fast development and build
- **Tailwind CSS**: Responsive design
- **Sonner**: Toast notifications
- **Socket.IO Client**: Real-time communication

### Backend Technologies
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **Socket.IO**: WebSocket server
- **JWT**: Authentication
- **Judge0**: Code execution

### Database Schema
```typescript
// User Model
interface IUser {
  username: string;
  email: string;
  rating: number; // Elo rating
  level: number;
  pvpStats: {
    wins: number;
    losses: number;
    draws: number;
    streak: number;
  };
  achievements: string[];
}

// Room Model
interface IRoom {
  name: string;
  mode: '1vs1' | 'tournament';
  creator: ObjectId;
  participants: ObjectId[];
  settings: {
    timeLimit: number;
    difficulty: string;
    languages: string[];
  };
}

// Match Model
interface IMatch {
  room: ObjectId;
  participants: ObjectId[];
  status: 'waiting' | 'active' | 'completed';
  results: {
    user: ObjectId;
    score: number;
    submission: ObjectId;
  }[];
}

// Friend Model
interface IFriend {
  requester: ObjectId;
  recipient: ObjectId;
  status: 'pending' | 'accepted' | 'blocked';
}
```

### API Endpoints
```
GET    /api/pvp/rooms              - Lấy danh sách phòng
POST   /api/pvp/rooms              - Tạo phòng mới
GET    /api/pvp/rooms/:id          - Chi tiết phòng
POST   /api/pvp/rooms/:id/join     - Tham gia phòng
DELETE /api/pvp/rooms/:id          - Xóa phòng

POST   /api/pvp/matchmaking        - Bắt đầu tìm trận
DELETE /api/pvp/matchmaking        - Hủy tìm trận

GET    /api/pvp/friends            - Danh sách bạn bè
POST   /api/pvp/friends/request    - Gửi lời mời
PUT    /api/pvp/friends/:id        - Chấp nhận/từ chối
DELETE /api/pvp/friends/:id        - Xóa bạn

GET    /api/pvp/matches            - Lịch sử đấu
GET    /api/pvp/matches/:id        - Chi tiết trận

GET    /api/pvp/leaderboard        - Bảng xếp hạng
GET    /api/pvp/achievements       - Thành tích

WebSocket Events:
- room:join, room:leave, room:update
- match:start, match:progress, match:end
- friend:request, friend:accept, friend:online
```

## 🎯 Điểm nổi bật

### 1. Performance
- **Optimized Queries**: Database indexes và aggregation
- **Caching**: Redis cho real-time data
- **Lazy Loading**: Components được load khi cần
- **Code Splitting**: Reduce bundle size

### 2. Security
- **Input Validation**: Express-validator cho tất cả inputs
- **Authentication**: JWT với refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevent abuse
- **Sanitization**: XSS protection

### 3. User Experience
- **Responsive**: Mobile-first design
- **Real-time**: Instant feedback
- **Intuitive**: Clean và modern UI
- **Accessible**: ARIA labels và keyboard navigation
- **Progressive**: Graceful degradation

### 4. Scalability
- **Microservices**: Modular architecture
- **Load Balancing**: Horizontal scaling ready
- **Database Sharding**: MongoDB cluster support
- **Caching Layer**: Redis integration
- **CDN Ready**: Static asset optimization

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+ (optional)
- Docker & Docker Compose

### Installation
```bash
# Clone repository
git clone <repository-url>
cd DoAnChuyenNganh

# Install dependencies
npm install

# Setup environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start services with Docker
docker-compose up -d

# Start development servers
npm run dev
```

### Environment Variables
```bash
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bughunter
JWT_SECRET=your-secret-key

# Client
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000

# Judge0
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=your-api-key
```

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client && npm run build

# Build server
cd server && npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## 📊 Monitoring & Analytics

### Metrics
- **Performance**: Response time, throughput
- **User Behavior**: Session duration, feature usage
- **System Health**: CPU, memory, database
- **Error Tracking**: Exception logging và alerting

### Logs
- **Structured Logging**: JSON format
- **Log Levels**: Debug, info, warn, error
- **Aggregation**: ELK stack integration
- **Retention**: 30-day retention policy

## 🔮 Future Enhancements

### Phase 2 Features
- **Tournament Mode**: Brackets và elimination
- **Team Battles**: 2v2, 3v3 modes
- **Spectator Mode**: Watch live matches
- **Replay System**: Match recording và playback
- **Custom Challenges**: User-created problems

### Phase 3 Features
- **AI Assistant**: Code completion hints
- **Learning Paths**: Personalized curriculum
- **Social Features**: Profiles, avatars, chat rooms
- **Gamification**: Daily quests, seasonal events
- **Mobile App**: Native iOS/Android apps

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request
5. Code review and merge

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb style guide
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Jest**: Unit and integration tests

## 📄 License

MIT License - see LICENSE file for details

---

**Note**: Đây là hệ thống PvP hoàn chỉnh với đầy đủ tính năng từ frontend đến backend. Hệ thống được thiết kế để scalable, secure và user-friendly.