# Cập Nhật Bảng Xếp Hạng

## Tổng Quan
Đã thực hiện các cập nhật cho hệ thống bảng xếp hạng, bao gồm:
1. Set điểm cho admin là 1000
2. Hiển thị admin trong bảng xếp hạng PVP
3. Tạo bảng xếp hạng tổng hợp với 2 tab (Bài đơn & PVP)
4. Thêm thông tin chi tiết (số bài, điểm cao nhất, thời gian hoạt động, huy chương)

## Các Thay Đổi Được Thực Hiện

### 1. Backend Changes

#### a. Script Set Admin Points
**File:** `server/scripts/set-admin-points.ts`
- Tự động tìm hoặc tạo user admin
- Set experience = 1000 điểm
- Đảm bảo role = 'admin'
- Khởi tạo pvpStats nếu chưa có

**Cách chạy:**
```bash
cd server
npx tsx scripts/set-admin-points.ts
```

#### b. Leaderboard Controller Updates
**File:** `server/src/controllers/leaderboard.controller.ts`

**Thay đổi `getTopLearners`:**
- Thêm thông tin chi tiết: `createdAt`, `badges`, `rank`, `experience`
- Tính toán thời gian hoạt động (`activityDays`)
- Tự động thêm admin vào bảng xếp hạng với 1000 điểm
- Admin được chèn vào vị trí phù hợp dựa trên điểm

**Thêm `getPracticeLeaderboard`:**
- API mới cho xếp hạng bài đơn chi tiết
- Endpoint: `GET /api/leaderboard/practice?limit=50`
- Trả về thông tin:
  - `completedCount`: Số bài đã hoàn thành
  - `highestScore`: Điểm cao nhất
  - `totalPoints`: Tổng điểm
  - `activityDays`: Số ngày hoạt động
  - `badges`: Danh sách huy chương
  - `highestBadge`: Huy chương cao nhất
  - `userRank`: Cấp bậc người dùng

**File:** `server/src/routes/leaderboard.routes.ts`
- Thêm route: `GET /api/leaderboard/practice`

#### c. PVP Controller Updates
**File:** `server/src/controllers/simplePvpNew.controller.ts`

**Cập nhật `getLeaderboard`:**
- Tự động thêm admin vào bảng xếp hạng PVP
- Admin được sắp xếp dựa trên số wins và totalXP
- Chỉ thêm admin khi offset = 0 (trang đầu tiên)

### 2. Frontend Changes

#### a. Combined Leaderboard Modal
**File:** `client/src/components/CombinedLeaderboardModal.tsx`

**Tính năng:**
- Modal với 2 tabs: "Bài Đơn" và "PvP"
- **Tab Bài Đơn:**
  - Hiển thị số bài đã hoàn thành
  - Điểm cao nhất
  - Tổng điểm
  - Thời gian hoạt động (số ngày)
  - Huy chương cao nhất
  - Cấp bậc người dùng
  
- **Tab PVP:**
  - Số trận thắng/thua/hòa
  - Tỷ lệ thắng
  - Tổng XP
  - Tổng số trận đấu

- **UI Features:**
  - Top 3 có màu vàng đặc biệt
  - Icons khác nhau cho từng hạng (🏆 #1, 🥈 #2, 🥉 #3)
  - Responsive và có dark mode support
  - Smooth scrolling với ScrollArea

#### b. Hero Component Updates
**File:** `client/src/components/Hero.tsx`

**Thay đổi:**
- Thêm import `CombinedLeaderboardModal` và icon `Trophy`
- Thêm state `showLeaderboard`
- Thay đổi nút "Xem khóa học" thành nút "Xếp hạng"
- Nút mới có:
  - Icon Trophy
  - Hover effect (icon chuyển màu vàng)
  - Mở modal xếp hạng khi click

## API Endpoints

### Xếp Hạng Bài Đơn
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

### Xếp Hạng PVP
```
GET /api/simple-pvp/leaderboard?limit=50&offset=0
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

## Cách Sử Dụng

### 1. Set Điểm Cho Admin
```bash
# Chạy script
cd server
npx tsx scripts/set-admin-points.ts

# Hoặc nếu admin chưa tồn tại, script sẽ tạo với:
# Username: admin
# Email: admin@example.com
# Password: admin123
# Experience: 1000
```

### 2. Xem Bảng Xếp Hạng
1. Truy cập trang chủ: http://localhost:5173/
2. Click nút "Xếp hạng" ở hero section
3. Modal sẽ mở với 2 tabs:
   - **Bài Đơn**: Xếp hạng theo điểm làm bài tập
   - **PvP**: Xếp hạng theo thành tích đấu PvP

### 3. Thông Tin Hiển Thị

**Bài Đơn:**
- 🏆 Hạng
- 👤 Avatar & tên
- 🏅 Huy chương cao nhất
- ✅ Số bài đã làm
- ⏰ Thời gian hoạt động
- 🎯 Cấp bậc
- 📊 Tổng điểm
- ⭐ Điểm cao nhất

**PvP:**
- 🏆 Hạng
- 👤 Avatar & tên
- 🎮 Số trận đấu
- ✅ Thắng
- ❌ Thua
- ⚖️ Hòa
- 📈 Tỷ lệ thắng
- 💎 Tổng XP

## Tính Năng Admin

### Hiển Thị Trong Xếp Hạng
- Admin tự động xuất hiện trong cả 2 bảng xếp hạng
- Admin có 1000 điểm mặc định
- Được sắp xếp dựa trên điểm, không phải số bài làm
- Có huy chương đặc biệt: 👑

### Vị Trí Xếp Hạng
- Admin được chèn vào vị trí phù hợp dựa trên điểm
- Không phải lúc nào cũng ở top 1 (nếu có người khác có điểm cao hơn)
- Logic sắp xếp công bằng với tất cả users

## Testing

### 1. Kiểm Tra Admin Points
```bash
# Kết nối MongoDB và check
mongo bughunter
db.users.findOne({ role: 'admin' })
# Nên thấy experience: 1000
```

### 2. Kiểm Tra API
```bash
# Test Practice Leaderboard
curl http://localhost:5000/api/leaderboard/practice?limit=10

# Test PVP Leaderboard (cần token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/simple-pvp/leaderboard?limit=10
```

### 3. Kiểm Tra UI
1. Mở http://localhost:5173/
2. Click nút "Xếp hạng"
3. Kiểm tra:
   - Modal mở đúng
   - 2 tabs hoạt động
   - Dữ liệu hiển thị đầy đủ
   - Admin xuất hiện với 1000 điểm
   - Icons và colors hiển thị đúng

## Lưu Ý

### Performance
- Cả 2 API đều có pagination
- Mặc định limit = 50 (có thể tăng lên 100)
- Admin chỉ được thêm khi offset = 0 (trang đầu)

### Security
- API practice leaderboard: public
- API PVP leaderboard: yêu cầu authentication

### Future Improvements
- Cache leaderboard data
- Real-time updates khi có submission mới
- Filter theo thời gian (tuần này, tháng này, v.v.)
- Export leaderboard
- Share social media

## Troubleshooting

### Admin không hiển thị
```bash
# Chạy lại script
cd server
npx tsx scripts/set-admin-points.ts
```

### Dữ liệu không load
- Kiểm tra server đang chạy
- Kiểm tra MongoDB connection
- Xem console logs
- Kiểm tra network tab

### UI không hiển thị đúng
- Clear browser cache
- Restart dev server
- Kiểm tra console errors
- Kiểm tra import paths