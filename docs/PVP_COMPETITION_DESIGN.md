# Thiết Kế Hệ Thống PVP Thi Đấu

## 📋 Tổng Quan

Tài liệu này mô tả chi tiết thiết kế và implementation cho hệ thống PVP thi đấu code, bao gồm các chức năng:
- Tạo và quản lý phòng đấu
- Hệ thống sẵn sàng (Ready system)
- Chọn challenge tự động dựa trên độ khó
- Thi đấu real-time với code editor
- Xử lý submission và đánh giá test cases
- Xác định người chiến thắng và trao XP

## 🎯 Luồng Hoạt Động

### 1. Tạo Phòng và Chờ Người Chơi

```
Chủ phòng tạo phòng → Cài đặt (độ khó, thời gian) → Phòng được tạo
→ Chủ phòng vào WaitingRoom
→ Người chơi khác tham gia qua room code hoặc danh sách phòng
→ WebSocket broadcast: user_joined_room
```

**Components liên quan:**
- [`CreateRoomModal.tsx`](client/src/components/simplePvp/CreateRoomModal.tsx) - Tạo phòng
- [`WaitingRoom.tsx`](client/src/components/simplePvp/WaitingRoom.tsx) - Phòng chờ
- [`PvPRoom model`](server/src/models/pvpRoom.model.ts) - Database schema

### 2. Hệ Thống Sẵn Sàng (Ready System)

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

**WebSocket Events:**
- `ready_status_changed` - Khi người chơi toggle ready status
- `room_updated` - Cập nhật thông tin phòng

### 3. Bắt Đầu Trận Đấu

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
// Chọn challenge dựa trên độ khó của phòng
const challenge = await Challenge.aggregate([
  { $match: { 
    difficulty: room.settings.difficulty,
    isActive: true 
  }},
  { $sample: { size: 1 } }
]);
```

### 4. Giao Diện Thi Đấu (Arena)

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

**Components:**
- [`PvPArena.tsx`](client/src/components/simplePvp/PvPArena.tsx) - Arena chính
- [`Editor`](https://www.npmjs.com/package/@monaco-editor/react) - Code editor

### 5. Submit Code và Đánh Giá

```
User viết code → Click "Submit"
→ Backend: submitCode(matchId, code, language)
  ├── Lấy challenge của match
  ├── Run code qua Judge0 với TẤT CẢ test cases (public + hidden)
  ├── Tính điểm:
  │   - passedTests / totalTests
  │   - Thời gian hoàn thành (từ match.startedAt)
  ├── Cập nhật participant trong match:
  │   - score
  │   - passedTests
  │   - totalTests  
  │   - completionTime
  │   - submittedAt
  ├── Kiểm tra điều kiện thắng:
  │   - Nếu passedTests === totalTests → Có thể kết thúc
  └── WebSocket broadcast: submission_received
→ Client nhận kết quả:
  ├── Hiển thị số test cases passed
  ├── Hiển thị kết quả chi tiết (chỉ public test cases)
  └── Nếu pass all → Tự động gọi finishMatch() sau 2s
```

**Submission Flow:**
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

**Judge0 Integration:**
```typescript
// Chạy tất cả test cases (public + hidden)
const allTestCases = challenge.testCases; // Bao gồm cả hidden
const results = await judge0Service.runTestCases(
  code,
  language,
  allTestCases,
  challenge.timeLimit,
  challenge.memoryLimit
);
```

### 6. Xác Định Người Chiến Thắng

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
  ├── Set winner (người có nhiều test passed nhất)
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

### 7. Hiển Thị Kết Quả

```
Match completed → PvPResult modal mở
→ Hiển thị:
  ├── Winner announcement
  ├── Participants table:
  │   ├── Username
  │   ├── Score (%)
  │   ├── Tests passed (X/Y)
  │   ├── Completion time
  │   └── Winner badge
  ├── XP earned (for winner)
  ├── Detailed stats
  └── Actions:
      ├── "Xem lại code" (optional)
      ├── "Thách đấu lại"
      └── "Về trang chủ"
```

**Components:**
- [`PvPResult.tsx`](client/src/components/simplePvp/PvPResult.tsx) - Result modal

## 🔧 Implementation Details

### Backend APIs cần thiết

#### 1. POST /api/pvp/rooms/:roomId/start
```typescript
/**
 * Bắt đầu trận đấu
 * - Kiểm tra tất cả người chơi đã sẵn sàng
 * - Chọn challenge ngẫu nhiên theo độ khó
 * - Tạo PVPMatch document
 * - Broadcast match_started event
 */
router.post('/rooms/:roomId/start', auth, async (req, res) => {
  // Implementation
});
```

#### 2. POST /api/pvp/matches/:matchId/submit
```typescript
/**
 * Submit code trong trận đấu
 * - Chạy code qua Judge0 với ALL test cases
 * - Tính điểm dựa trên passed tests
 * - Cập nhật participant stats
 * - Kiểm tra điều kiện kết thúc
 * - Broadcast submission_received
 */
router.post('/matches/:matchId/submit', auth, async (req, res) => {
  // Implementation
});
```

#### 3. POST /api/pvp/matches/:matchId/finish
```typescript
/**
 * Kết thúc trận đấu
 * - Determine winner
 * - Calculate XP
 * - Update user stats
 * - Broadcast match_completed
 */
router.post('/matches/:matchId/finish', auth, async (req, res) => {
  // Implementation
});
```

#### 4. GET /api/pvp/matches/:matchId/status
```typescript
/**
 * Lấy trạng thái trận đấu real-time
 * - Current participants progress
 * - Time remaining
 * - Match status
 */
router.get('/matches/:matchId/status', auth, async (req, res) => {
  // Implementation
});
```

### WebSocket Events

```typescript
// Server → Client Events
interface PvPWebSocketEvents {
  // Room events
  'room_updated': (data: { roomId: string; room: Room }) => void;
  'user_joined_room': (data: { roomId: string; participant: Participant }) => void;
  'user_left_room': (data: { roomId: string; userId: string }) => void;
  'ready_status_changed': (data: { roomId: string; userId: string; isReady: boolean }) => void;
  
  // Match events
  'match_started': (data: { roomId: string; matchId: string; challenge: Challenge }) => void;
  'submission_received': (data: { matchId: string; userId: string; progress: number }) => void;
  'match_completed': (data: { matchId: string; winner: string; results: MatchResult }) => void;
  'time_warning': (data: { matchId: string; timeLeft: number }) => void;
}
```

### Database Models Updates

#### PVPMatch Model Enhancement
```typescript
// Thêm methods vào pvpMatch.model.ts
pvpMatchSchema.methods.updateParticipantSubmission = function(
  userId: ObjectId,
  submissionData: {
    code: string;
    language: string;
    passedTests: number;
    totalTests: number;
    score: number;
    testResults: any[];
  }
): boolean {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    const currentTime = Date.now() - this.startedAt.getTime();
    
    // Chỉ update nếu score tốt hơn hoặc lần submit đầu
    if (submissionData.score > participant.score || !participant.submissions) {
      participant.score = submissionData.score;
      participant.passedTests = submissionData.passedTests;
      participant.totalTests = submissionData.totalTests;
      participant.completionTime = currentTime;
      participant.submittedAt = new Date();
      
      // Lưu submission history
      if (!participant.submissions) {
        participant.submissions = [];
      }
      participant.submissions.push({
        code: submissionData.code,
        language: submissionData.language,
        score: submissionData.score,
        submittedAt: new Date(),
        testResults: submissionData.testResults
      });
      
      return true;
    }
  }
  return false;
};
```

### Frontend State Management

#### PvPPage State
```typescript
const [gameState, setGameState] = useState<{
  phase: 'lobby' | 'waiting' | 'playing' | 'finished';
  currentRoom: Room | null;
  currentMatch: { matchId: string; challenge: Challenge } | null;
  matchResult: MatchResult | null;
}>({
  phase: 'lobby',
  currentRoom: null,
  currentMatch: null,
  matchResult: null
});
```

#### WebSocket Integration
```typescript
useEffect(() => {
  const ws = getWebSocketService();
  
  // Match started - chuyển sang arena
  ws.on('match_started', (data) => {
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      currentMatch: {
        matchId: data.matchId,
        challenge: data.challenge
      }
    }));
  });
  
  // Match completed - hiển thị kết quả
  ws.on('match_completed', (data) => {
    setGameState(prev => ({
      ...prev,
      phase: 'finished',
      matchResult: data.results
    }));
  });
  
  return () => {
    ws.off('match_started');
    ws.off('match_completed');
  };
}, []);
```

## 🎮 User Experience Flow

### Complete User Journey
```
1. User vào trang PVP
   ↓
2. Tạo phòng hoặc tham gia phòng có sẵn
   ↓
3. Vào WaitingRoom, đợi người chơi khác
   ↓
4. Click "Sẵn sàng" khi đã ready
   ↓
5. Chủ phòng click "Bắt đầu" (khi all ready)
   ↓
6. Chuyển sang PvPArena
   - Đọc mô tả bài
   - Xem test cases công khai
   - Viết code
   ↓
7. Submit code
   - Nhận kết quả test cases
   - Thấy progress của mình
   ↓
8. Tiếp tục cải thiện hoặc đợi hết giờ
   ↓
9. Trận kết thúc (pass all tests hoặc timeout)
   ↓
10. Xem kết quả trong PvPResult
    - Thắng/Thua
    - XP nhận được
    - Chi tiết performance
```

## 🔐 Security Considerations

### 1. Anti-Cheating Measures
- Không hiển thị hidden test cases cho client
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

// Chỉ chủ phòng mới start match
if (room.hostId.toString() !== userId.toString()) {
  throw new Error('Only host can start match');
}
```

### 3. Data Validation
- Validate code length (max 10,000 chars)
- Validate language selection
- Validate match status before operations
- Sanitize all user inputs

## ⚡ Performance Optimizations

### 1. Database Indexing
```typescript
// PVPMatch indexes
pvpMatchSchema.index({ roomId: 1 });
pvpMatchSchema.index({ status: 1, startedAt: -1 });
pvpMatchSchema.index({ 'participants.userId': 1 });
pvpMatchSchema.index({ winnerId: 1 });
```

### 2. WebSocket Optimization
- Chỉ broadcast cho participants của room
- Throttle frequent updates (max 1/second)
- Use rooms để isolate events

### 3. Judge0 Optimization
- Connection pooling
- Timeout handling
- Fallback mechanism khi Judge0 down

## 🧪 Testing Strategy

### 1. Unit Tests
- Challenge selection algorithm
- Winner determination logic
- Score calculation
- XP calculation

### 2. Integration Tests
- Complete match flow
- WebSocket event handling
- Judge0 integration
- Database operations

### 3. End-to-End Tests
- Full user journey
- Multiple concurrent matches
- Edge cases (disconnect, timeout, etc.)

## 📈 Monitoring & Metrics

### Key Metrics to Track
- Average match duration
- Submission success rate
- Judge0 response time
- WebSocket connection stability
- User retention in matches

### Logging
```typescript
// Log critical events
logger.info('Match started', { matchId, roomId, participants });
logger.info('Submission received', { matchId, userId, score });
logger.info('Match completed', { matchId, winner, duration });
logger.error('Judge0 error', { error, matchId });
```

## 🚀 Future Enhancements

### Phase 2 Features
1. **Replay System** - Xem lại code và submissions
2. **Spectator Mode** - Xem người khác thi đấu
3. **Tournament Mode** - Thi đấu loại trực tiếp
4. **Team Mode** - 2v2 hoặc team battles
5. **Ranked System** - MMR và divisions
6. **Achievement System** - Badges và milestones
7. **Code Review** - Sau trận xem code của đối thủ
8. **Chat System** - Chat trong arena (với moderation)

### Performance Improvements
1. **Caching** - Cache challenges, reduce DB calls
2. **Load Balancing** - Distribute Judge0 workload
3. **CDN** - Static assets delivery
4. **Database Sharding** - Scale for many concurrent matches

## 📚 Related Documentation
- [`PVP_USER_FLOW.md`](PVP_USER_FLOW.md) - User flow overview
- [`PVP_GUIDE.md`](PVP_GUIDE.md) - Setup and usage guide
- [`JUDGE0_SETUP.md`](JUDGE0_SETUP.md) - Judge0 configuration
- [`pvpMatch.model.ts`](server/src/models/pvpMatch.model.ts) - Match schema
- [`judge0Service.ts`](server/src/services/judge0Service.ts) - Code execution service

---

**Last Updated:** 2025-12-01
**Version:** 1.0.0
**Authors:** Kilo Code Team