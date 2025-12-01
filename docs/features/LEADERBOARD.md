# Hệ thống Bảng Xếp Hạng

## 📋 Tổng quan

BugHunter có 2 bảng xếp hạng riêng biệt:
1. **Bài Đơn (Practice)**: Xếp hạng theo điểm làm bài tập
2. **PvP**: Xếp hạng theo thành tích thi đấu

## 🎯 Tính năng

### Bảng Xếp Hạng Bài Đơn
- **Số bài đã hoàn thành**: Tổng số challenge đã pass
- **Điểm cao nhất**: Điểm cao nhất từ 1 bài
- **Tổng điểm**: Tổng experience points
- **Thời gian hoạt động**: Số ngày đã sử dụng
- **Huy chương**: Badge dựa trên thành tích
- **Cấp bậc**: Beginner, Intermediate, Advanced, Expert

### Bảng Xếp Hạng PvP
- **Số trận thắng/thua/hòa**: Win/Loss/Draw stats
- **Tỷ lệ thắng**: Win rate percentage
- **Tổng XP**: Total XP earned from PvP
- **Tổng số trận**: Total matches played
- **Elo Rating**: Competitive ranking score

## 🎨 UI Features

### Top 3 Highlighting
- 🏆 **#1**: Vàng, icon trophy
- 🥈 **#2**: Bạc, icon medal
- 🥉 **#3**: Đồng, icon medal

### Responsive Design
- Desktop: Full table view
- Mobile: Card view với swipe
- Dark mode support

### Real-time Updates
- Auto-refresh mỗi 5 phút
- Manual refresh button
- WebSocket updates cho live changes

## 🔧 Implementation

### Backend APIs

#### Practice Leaderboard
```
GET /api/leaderboard/practice?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "...",
      "username": "admin",
      "avatar": "...",
      "completedCount": 0,
      "highestScore": 100,
      "totalPoints": 1000,
      "activityDays": 5,
      "badges": ["👑"],
      "highestBadge": "👑",
      "userRank": "Expert",
      "experience": 1000
    }
  ],
  "total": 10
}
```

#### PvP Leaderboard
```
GET /api/pvp/leaderboard?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "...",
      "username": "admin",
      "avatar": "...",
      "totalXP": 1000,
      "wins": 0,
      "losses": 0,
      "draws": 0,
      "totalMatches": 0,
      "winRate": 0
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

### Frontend Component

**File:** `client/src/components/CombinedLeaderboardModal.tsx`

**Key Features:**
- Tabs để chuyển giữa Practice và PvP
- Infinite scroll cho leaderboard dài
- Search/filter users
- Export leaderboard

## 📊 Admin Handling

### Admin trong Leaderboard

**Practice Leaderboard:**
- `completedCount`: 999
- `totalPoints`: 999999
- `experience`: 999999
- `highestBadge`: 👑
- Luôn ở vị trí #1

**PvP Leaderboard:**
- `wins`: 999
- `totalXP`: 999999
- `totalMatches`: 999
- `winRate`: 100
- Luôn ở vị trí #1

### Implementation
```typescript
// Backend: Thêm admin vào đầu danh sách
const adminEntry = {
  rank: 1,
  userId: adminUser._id,
  username: adminUser.username,
  completedCount: 999,
  totalPoints: 999999,
  // ...
};
finalResults.unshift(adminEntry);
```

## 🐛 Bug Fixes (2025-12-01)

### 1. Lỗi Duplicate Keys
**Vấn đề:** React warning về duplicate keys khi render

**Giải pháp:**
```typescript
// Trước
key={entry.userId}

// Sau
key={`practice-${entry.userId}-${index}`}
key={`pvp-${entry.userId}-${index}`}
```

### 2. Nút Bảng Xếp Hạng Link Sai
**Vấn đề:** Nút ở Header link đến `/practice` thay vì mở modal

**Giải pháp:**
```typescript
// Header.tsx
const [showLeaderboard, setShowLeaderboard] = useState(false);

// Thay Link thành button
<button onClick={() => setShowLeaderboard(true)}>
  <Trophy className="mr-2" />
  Bảng xếp hạng
</button>

// Thêm modal
<CombinedLeaderboardModal 
  isOpen={showLeaderboard}
  onClose={() => setShowLeaderboard(false)}
/>
```

### 3. Admin Không Ở Top 1
**Vấn đề:** Admin được chèn dựa trên điểm thực tế

**Giải pháp:**
- Set admin stats rất cao (999, 999999)
- Dùng `unshift()` để đặt admin ở đầu
- Apply cho cả Practice và PvP leaderboard

## 💡 Cách Sử Dụng

### Xem Bảng Xếp Hạng

1. Click nút **"Bảng xếp hạng"** ở Header hoặc Hero section
2. Modal mở với 2 tabs
3. Chuyển giữa "Bài Đơn" và "PvP"
4. Scroll để xem thêm users

### Thông Tin Hiển Thị

**Tab Bài Đơn:**
- 🏆 Hạng
- 👤 Avatar & tên
- 🏅 Huy chương cao nhất
- ✅ Số bài đã làm
- ⏰ Thời gian hoạt động
- 🎯 Cấp bậc
- 📊 Tổng điểm
- ⭐ Điểm cao nhất

**Tab PvP:**
- 🏆 Hạng
- 👤 Avatar & tên
- 🎮 Số trận đấu
- ✅ Thắng
- ❌ Thua
- ⚖️ Hòa
- 📈 Tỷ lệ thắng
- 💎 Tổng XP

## 🔄 Updates & Cải tiến

### Script Set Admin Points
**File:** `server/scripts/set-admin-points.ts`

Tự động:
- Tìm hoặc tạo user admin
- Set experience = 1000 điểm
- Khởi tạo pvpStats nếu chưa có

**Cách chạy:**
```bash
cd server
npx tsx scripts/set-admin-points.ts
```

### Leaderboard Controller Updates

**Thêm `getPracticeLeaderboard`:**
- API mới cho xếp hạng bài đơn chi tiết
- Endpoint: `GET /api/leaderboard/practice?limit=50`
- Thông tin đầy đủ hơn so với `getTopLearners`

**Cập nhật `getLeaderboard` (PvP):**
- Tự động thêm admin
- Chỉ thêm admin khi offset = 0 (trang đầu)
- Sắp xếp dựa trên wins và totalXP

### Hero Component Updates

**Thay đổi:**
- Nút "Xem khóa học" → "Xếp hạng"
- Icon Trophy với hover effect (vàng)
- Mở modal xếp hạng khi click

## 📈 Future Improvements

### Phase 2
- [ ] Cache leaderboard data
- [ ] Real-time updates khi có submission mới
- [ ] Filter theo thời gian (tuần này, tháng này)
- [ ] Export leaderboard (CSV, JSON)
- [ ] Share on social media
- [ ] Personal rank tracking
- [ ] Historical rankings

### Performance
- [ ] Implement pagination
- [ ] Cache với Redis
- [ ] CDN cho avatars
- [ ] Optimize database queries

## 🧪 Testing

### Test Checklist
- [ ] Modal mở đúng
- [ ] 2 tabs hoạt động
- [ ] Dữ liệu hiển thị đầy đủ
- [ ] Admin xuất hiện với điểm cao
- [ ] Icons và colors đúng
- [ ] Responsive trên mobile
- [ ] Dark mode hoạt động
- [ ] Không có duplicate key warnings

### Test API
```bash
# Test Practice Leaderboard
curl http://localhost:5000/api/leaderboard/practice?limit=10

# Test PVP Leaderboard (cần token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/pvp/leaderboard?limit=10
```

## 📚 Files Modified

### Backend
1. `server/src/controllers/leaderboard.controller.ts`
2. `server/src/controllers/simplePvpNew.controller.ts`
3. `server/src/routes/leaderboard.routes.ts`
4. `server/scripts/set-admin-points.ts`

### Frontend
1. `client/src/components/CombinedLeaderboardModal.tsx`
2. `client/src/components/Header.tsx`
3. `client/src/components/Hero.tsx`

---

**Last Updated:** 2025-12-01
**Version:** 2.0.0