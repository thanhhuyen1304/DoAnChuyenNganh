# 🐛 PvP Bug Fixes - Báo cáo sửa lỗi

## Tổng quan
Đã sửa 2 lỗi quan trọng trong hệ thống PvP:
1. ✅ Dialog Arena đóng khi click ra ngoài
2. ✅ Logic xác định hòa không chính xác

---

## 🔧 Chi tiết các sửa đổi

### 1. Fix Dialog đóng khi click outside
**File:** [`client/src/components/simplePvp/PvPArena.tsx`](client/src/components/simplePvp/PvPArena.tsx:238-241)

**Vấn đề:** 
- Khi người chơi đang trong trận đấu và click chuột ra ngoài Dialog, trang Arena bị đóng và không thể mở lại
- Dialog tự động đóng khi click outside hoặc nhấn ESC

**Giải pháp:**
```typescript
<DialogContent 
  className="sm:max-w-[1200px] h-[90vh] flex flex-col"
  onInteractOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()}
>
```

**Kết quả:** 
- Dialog chỉ đóng khi người chơi chủ động nhấn nút "Rời trận đấu"
- Ngăn chặn đóng vô tình khi click outside hoặc nhấn ESC

---

### 2. Fix logic xác định hòa

#### 2.1. Cập nhật Model - Xác định người thắng
**File:** [`server/src/models/pvpMatch.model.ts`](server/src/models/pvpMatch.model.ts:183-225)

**Vấn đề:**
- Hàm `determineWinner()` luôn chọn 1 người thắng duy nhất
- Không có logic kiểm tra trường hợp hòa (cùng điểm số và cùng thời gian)

**Giải pháp:**
```typescript
pvpMatchSchema.methods.determineWinner = function(): void {
  if (this.participants.length === 0) return;
  
  // Sort participants theo điểm và thời gian
  const sortedParticipants = [...this.participants].sort((a, b) => {
    const aPassedAll = a.passedTests === a.totalTests;
    const bPassedAll = b.passedTests === b.totalTests;
    
    if (aPassedAll && !bPassedAll) return -1;
    if (!aPassedAll && bPassedAll) return 1;
    
    if (a.score !== b.score) return b.score - a.score;
    return a.completionTime - b.completionTime;
  });
  
  const topScore = sortedParticipants[0].score;
  const topTime = sortedParticipants[0].completionTime;
  
  // Tìm tất cả người chơi có cùng điểm cao nhất và cùng thời gian
  const topParticipants = sortedParticipants.filter(p => 
    p.score === topScore && p.completionTime === topTime
  );
  
  // Nếu có nhiều hơn 1 người -> HÒA
  if (topParticipants.length > 1) {
    topParticipants.forEach(p => {
      p.isWinner = true;
    });
    this.winnerId = null; // Không có người thắng duy nhất
  } else {
    // Có 1 người thắng rõ ràng
    const winner = sortedParticipants[0];
    this.winnerId = winner.userId;
    winner.isWinner = true;
  }
};
```

**Logic mới:**
1. Tìm điểm cao nhất và thời gian nhanh nhất
2. Kiểm tra có bao nhiêu người có cùng điểm và thời gian
3. Nếu > 1 người → Hòa (tất cả đều `isWinner = true`, `winnerId = null`)
4. Nếu = 1 người → Người đó thắng

---

#### 2.2. Cập nhật UI - Hiển thị kết quả hòa
**File:** [`client/src/components/simplePvp/PvPResult.tsx`](client/src/components/simplePvp/PvPResult.tsx:76-123)

**Thay đổi:**
```typescript
{(() => {
  const winners = matchResult.participants.filter(p => p.isWinner);
  
  if (winners.length > 1) {
    // Hiển thị HÒA với giao diện màu xanh
    return (
      <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-blue-700">HÒA!</h2>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
        <p className="text-lg text-blue-600 mb-2">Trận đấu kết thúc với kết quả hòa</p>
        <p className="text-md text-blue-500">{winners.map(w => w.username).join(' & ')} có cùng điểm số!</p>
        {/* XP display */}
      </div>
    );
  } else if (winner) {
    // Hiển thị người thắng với giao diện màu vàng như cũ
    return (/* ... */);
  }
  return null;
})()}
```

**Giao diện:**
- **Hòa:** Nền xanh (blue/purple gradient), icon Users, hiển thị tên tất cả người hòa
- **Thắng:** Nền vàng (yellow/orange gradient), icon Crown, hiển thị tên người thắng

---

#### 2.3. Cập nhật Controller - Xử lý stats
**File:** [`server/src/controllers/simplePvpNew.controller.ts`](server/src/controllers/simplePvpNew.controller.ts:780-821)

**Thay đổi:**
```typescript
// Update user stats and XP
if (match.winnerId) {
  // Có 1 người thắng rõ ràng
  await User.findByIdAndUpdate(match.winnerId, {
    $inc: {
      'pvpStats.wins': 1,
      'pvpStats.totalMatches': 1,
      experience: winnerXP
    }
  });

  // Update losers
  for (const participant of match.participants) {
    if (participant.userId.toString() !== match.winnerId?.toString()) {
      await User.findByIdAndUpdate(participant.userId, {
        $inc: {
          'pvpStats.losses': 1,
          'pvpStats.totalMatches': 1
        }
      });
    }
  }
} else {
  // HÒA - tất cả winners nhận XP nhưng tính là hòa
  const winners = match.participants.filter(p => p.isWinner);
  const drawXP = Math.floor(winnerXP / 2); // Chia đôi XP cho hòa

  for (const winner of winners) {
    await User.findByIdAndUpdate(winner.userId, {
      $inc: {
        'pvpStats.draws': 1,
        'pvpStats.totalMatches': 1,
        experience: drawXP
      }
    });
  }

  // Non-winners vẫn tính là thua
  for (const participant of match.participants) {
    if (!participant.isWinner) {
      await User.findByIdAndUpdate(participant.userId, {
        $inc: {
          'pvpStats.losses': 1,
          'pvpStats.totalMatches': 1
        }
      });
    }
  }
}
```

**Logic mới:**
- **Có người thắng (`winnerId != null`):**
  - Người thắng: +1 wins, +1 totalMatches, +winnerXP experience
  - Người thua: +1 losses, +1 totalMatches

- **Hòa (`winnerId == null`):**
  - Người hòa: +1 draws, +1 totalMatches, +(winnerXP/2) experience
  - Người không hòa: +1 losses, +1 totalMatches

---

## 📊 Tổng kết thay đổi

| File | Dòng | Thay đổi |
|------|------|----------|
| `PvPArena.tsx` | 238-241 | Thêm props ngăn Dialog đóng |
| `pvpMatch.model.ts` | 183-225 | Thêm logic kiểm tra hòa |
| `PvPResult.tsx` | 76-123 | Thêm UI hiển thị hòa |
| `simplePvpNew.controller.ts` | 780-821 | Xử lý stats cho hòa |

---

## ✅ Kết quả

### Trước khi fix:
- ❌ Click ra ngoài → Dialog đóng, không mở lại được
- ❌ 2 người cùng điểm → Hệ thống vẫn chọn 1 người thắng
- ❌ Không có thông báo hòa

### Sau khi fix:
- ✅ Dialog chỉ đóng khi nhấn nút "Rời trận đấu"
- ✅ 2 người cùng điểm → Hiển thị HÒA chính xác
- ✅ UI riêng cho kết quả hòa (màu xanh)
- ✅ Stats được cập nhật đúng (draws field)
- ✅ XP chia đôi cho người hòa

---

## 🧪 Test Cases

### Test 1: Dialog không đóng khi click outside
1. Vào trận đấu PvP
2. Click ra ngoài Dialog (vào backdrop)
3. **Kỳ vọng:** Dialog vẫn mở, không đóng
4. Nhấn ESC
5. **Kỳ vọng:** Dialog vẫn mở, không đóng
6. Nhấn nút "Rời trận đấu"
7. **Kỳ vọng:** Dialog đóng

### Test 2: Hiển thị kết quả hòa
1. 2 người chơi submit code
2. Cả 2 có cùng điểm số (ví dụ: 100%)
3. Cả 2 có cùng thời gian hoàn thành
4. Kết thúc trận đấu
5. **Kỳ vọng:** 
   - Hiển thị "HÒA!" với nền màu xanh
   - Hiển thị tên cả 2 người
   - Cả 2 đều có badge "🏆 Người thắng"
   - Stats: draws +1 cho cả 2

### Test 3: Stats được cập nhật đúng
1. Kiểm tra `pvpStats.draws` trước trận
2. Tạo trận hòa (cùng điểm, cùng thời gian)
3. Kiểm tra `pvpStats.draws` sau trận
4. **Kỳ vọng:** `draws` tăng 1 cho mỗi người hòa

---

## 📝 Ghi chú

- User model đã có sẵn field `pvpStats.draws`, không cần thay đổi
- Logic hòa chỉ xét cùng điểm số VÀ cùng thời gian hoàn thành
- XP cho người hòa = 50% XP người thắng
- Tất cả thay đổi tương thích ngược, không ảnh hưởng match cũ

---

**Ngày sửa:** 2025-12-01  
**Người thực hiện:** Kilo Code