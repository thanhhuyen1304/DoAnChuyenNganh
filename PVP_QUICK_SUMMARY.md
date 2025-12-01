# 🎮 TÓM TẮT HỆ THỐNG PVP - QUICK REFERENCE

## 🎯 Vấn Đề Hiện Tại

Bạn đã có:
- ✅ Tạo phòng
- ✅ Vào phòng chờ
- ✅ Xem danh sách người chơi

Bạn cần:
- ❌ Hệ thống "Sẵn sàng"
- ❌ Bắt đầu trận đấu (chọn bài tự động)
- ❌ Thi đấu code (submit và đánh giá)
- ❌ Xác định người thắng
- ❌ Hiển thị kết quả + XP

## 📊 LUỒNG HOÀN CHỈNH

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. TẠO/VÀO PHÒNG CHỜ                          │
│  User A tạo phòng → User B tham gia → Cả hai vào WaitingRoom   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. HỆ THỐNG SẴN SÀNG                          │
│  User A click "Sẵn sàng" ──┐                                    │
│  User B click "Sẵn sàng" ──┼─→ Cả hai isReady = true           │
│  Chủ phòng: Nút "Bắt đầu" enabled                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   3. BẮT ĐẦU TRẬN ĐẤU                            │
│  Chủ phòng click "Bắt đầu"                                       │
│      ↓                                                           │
│  Backend:                                                        │
│    • Chọn challenge ngẫu nhiên (dựa trên độ khó phòng)          │
│    • Tạo PVPMatch document                                       │
│    • Broadcast "match_started" → Cả hai vào PvPArena            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. THI ĐẤU CODE                               │
│  PvPArena hiển thị:                                              │
│    • Đề bài                                                      │
│    • Test cases CÔNG KHAI (không hiện test cases ẩn)            │
│    • Code editor                                                 │
│    • Timer đếm ngược                                             │
│                                                                  │
│  User viết code → Submit:                                        │
│    • Backend chạy code qua Judge0 với TẤT CẢ test cases         │
│    • Tính điểm: passedTests / totalTests                         │
│    • Trả về: Chỉ hiển thị kết quả test cases công khai          │
│    • Broadcast: submission_received (để đối thủ biết progress)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  5. XÁC ĐỊNH NGƯỜI THẮNG                         │
│                                                                  │
│  Điều kiện kết thúc:                                             │
│    A. Có người pass ALL test cases                               │
│       → Auto finish match sau 2s                                 │
│                                                                  │
│    B. Hết thời gian                                              │
│       → Auto finish match                                        │
│                                                                  │
│  Logic xác định thắng:                                           │
│    1. Ai pass all tests TRƯỚC → Thắng                            │
│    2. Nếu không có ai pass all:                                  │
│       • So sánh số test cases passed                             │
│       • Nếu bằng nhau → So sánh thời gian                        │
│                                                                  │
│  Tính XP (cho người thắng):                                      │
│    • Easy: +20 XP                                                │
│    • Medium: +50 XP                                              │
│    • Hard: +100 XP                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    6. HIỂN THỊ KẾT QUẢ                           │
│  PvPResult modal hiển thị:                                       │
│    • 🏆 Winner announcement                                      │
│    • Stats của cả hai:                                           │
│      - Score (%)                                                 │
│      - Tests passed (X/Y)                                        │
│      - Thời gian hoàn thành                                      │
│    • +XP cho người thắng                                         │
│    • Actions: "Thách đấu lại" | "Về trang chủ"                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔑 ĐIỂM QUAN TRỌNG

### 1. Test Cases - Public vs Hidden

```typescript
// Challenge có 2 loại test cases:
{
  testCases: [
    { input: "1", expectedOutput: "2", isHidden: false },  // Public
    { input: "2", expectedOutput: "4", isHidden: false },  // Public
    { input: "100", expectedOutput: "200", isHidden: true }, // Hidden
    { input: "-1", expectedOutput: "0", isHidden: true }    // Hidden
  ]
}

// Khi submit:
// ✅ Backend: Chạy TẤT CẢ test cases (public + hidden)
// ✅ Client: Chỉ hiển thị kết quả public test cases

// Lý do: Tăng tính thử thách, users không biết hết test cases
```

### 2. Xác Định Winner - Algorithm

```typescript
function determineWinner(participants) {
  // Sort theo thứ tự ưu tiên:
  return participants.sort((a, b) => {
    // 1. Ưu tiên người pass ALL tests
    if (a.passedTests === a.totalTests && b.passedTests !== b.totalTests) {
      return -1; // a wins
    }
    
    // 2. So sánh số tests passed
    if (a.passedTests !== b.passedTests) {
      return b.passedTests - a.passedTests; // More is better
    }
    
    // 3. So sánh score
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    
    // 4. So sánh thời gian
    return a.completionTime - b.completionTime; // Faster is better
  })[0]; // Winner là người đầu tiên
}
```

### 3. Auto Finish - Hai Trường Hợp

```typescript
// Case 1: User pass ALL tests
if (passedTests === totalTests) {
  setTimeout(() => {
    finishMatch(); // Auto finish sau 2s
  }, 2000);
}

// Case 2: Timer hết
useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        finishMatch(); // Auto finish
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, []);
```

## 🚀 CÁC BƯỚC IMPLEMENTATION

### Bước 1: Backend (60% công việc)

```bash
# Tạo các file:
server/src/routes/pvp.routes.ts          # Routes
server/src/controllers/pvp.controller.ts  # Controllers
server/src/services/pvp.service.ts        # Business logic (optional)
```

**APIs cần thiết:**
1. `POST /api/pvp/rooms/:roomId/ready` - Set ready status
2. `POST /api/pvp/rooms/:roomId/start` - Start match
3. `POST /api/pvp/matches/:matchId/submit` - Submit code
4. `GET /api/pvp/matches/:matchId/status` - Get status
5. `POST /api/pvp/matches/:matchId/finish` - Finish match

### Bước 2: Frontend (30% công việc)

```bash
# Update các file:
client/src/components/simplePvp/WaitingRoom.tsx  # Ready system
client/src/components/simplePvp/PvPArena.tsx     # Auto finish
client/src/components/simplePvp/PvPResult.tsx    # NEW - Result display
client/src/components/simplePvp/PvPPage.tsx      # Orchestration
client/src/services/simplePvpApi.ts              # API methods
```

### Bước 3: Testing (10% công việc)

- Test với 2 users real-time
- Test các scenarios:
  - User A pass all tests trước
  - Hết thời gian
  - Disconnect giữa chừng
  - Submit nhiều lần

## 📝 CODE EXAMPLES QUAN TRỌNG

### Backend: Submit Code

```typescript
async submitCode(matchId: string, userId: string, code: string, language: string) {
  const match = await PVPMatch.findById(matchId).populate('challengeId');
  const challenge = match.challengeId;
  
  // 1. Run ALL test cases (public + hidden)
  const results = await judge0Service.runTestCases(
    code,
    language,
    challenge.testCases, // ALL
    challenge.timeLimit,
    challenge.memoryLimit
  );
  
  // 2. Calculate score
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const score = Math.round((passedTests / totalTests) * 100);
  
  // 3. Update participant
  match.updateParticipantSubmission(userId, {
    code, language, passedTests, totalTests, score, testResults: results
  });
  await match.save();
  
  // 4. Broadcast
  io.to(`match_${matchId}`).emit('submission_received', {
    matchId, userId, passedTests, totalTests, score
  });
  
  // 5. Return ONLY public results to client
  const publicResults = results.filter((r, idx) => 
    !challenge.testCases[idx].isHidden
  );
  
  return { score, passedTests, totalTests, testResults: publicResults };
}
```

### Frontend: Ready System

```typescript
// WaitingRoom.tsx
const [isReady, setIsReady] = useState(false);

const handleReadyToggle = async () => {
  await simplePvpApi.setReadyStatus(room._id, !isReady);
  setIsReady(!isReady);
};

const allReady = room?.participants.every(p => p.isReady) && 
                 room?.participants.length >= 2;

// UI
<Button
  onClick={handleReadyToggle}
  variant={isReady ? "default" : "outline"}
>
  {isReady ? '✓ Sẵn sàng' : 'Sẵn sàng'}
</Button>

{isHost && (
  <Button onClick={handleStartMatch} disabled={!allReady}>
    Bắt đầu trận đấu
  </Button>
)}
```

## 📚 TÀI LIỆU CHI TIẾT

1. **[PVP_IMPLEMENTATION_RECOMMENDATIONS.md](PVP_IMPLEMENTATION_RECOMMENDATIONS.md)**
   - Code examples chi tiết
   - Checklist implementation
   - Best practices

2. **[docs/PVP_COMPETITION_DESIGN.md](docs/PVP_COMPETITION_DESIGN.md)**
   - Thiết kế architecture đầy đủ
   - Database schema
   - WebSocket events
   - Security considerations

3. **[PVP_USER_FLOW.md](PVP_USER_FLOW.md)**
   - Luồng người dùng
   - Components liên quan
   - Integration details

## ❓ FAQ

**Q: Tại sao không hiển thị hidden test cases cho client?**
A: Để tăng tính thử thách. Users phải viết code tổng quát, không chỉ pass test cases công khai.

**Q: Nếu cả hai không pass test case nào thì sao?**
A: Vẫn xác định winner dựa trên score (%) và thời gian. Người submit trước sẽ có lợi thế về thời gian.

**Q: Có thể submit nhiều lần không?**
A: Có, mỗi lần submit sẽ update nếu score tốt hơn. Nhưng nên có rate limiting (max 1 lần/5s).

**Q: Chuyện gì xảy ra nếu user disconnect giữa chừng?**
A: Match vẫn tiếp tục. Khi hết thời gian sẽ finish và xác định winner dựa trên submissions có sẵn.

**Q: XP tính như thế nào nếu không pass all tests?**
A: Có thể giảm XP dựa trên % tests passed. Ví dụ: 50% tests passed = 50% XP.

---

**TÓM LẠI:** Hệ thống đã gần hoàn thiện, chỉ cần implement thêm:
1. Ready system (đơn giản)
2. Start match logic (chọn challenge tự động)
3. Submit và finish logic (có sẵn Judge0 rồi)
4. Result display (UI component)

**Ước lượng thời gian:** 4-6 giờ cho developer có kinh nghiệm.