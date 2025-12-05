# Hướng dẫn quản lý thành tựu (Achievement Management)

## Tổng quan

Module quản lý thành tựu cung cấp đầy đủ chức năng CRUD (Create, Read, Update, Delete) cho phép admin quản lý tất cả các thành tích trong hệ thống BugHunter. Module được thiết kế với các tính năng nâng cao như phân trang, tìm kiếm, lọc, sắp xếp, soft delete và thống kê chi tiết.

## Tính năng chính

### 1. CREATE - Tạo thành tựu mới

**Các trường thông tin:**
- **Tên thành tích*** (name): Tên hiển thị của thành tích
- **Mô tả*** (description): Mô tả chi tiết về thành tích
- **Icon** (icon): Emoji đại diện (mặc định: 🏆)
- **Hình ảnh** (image): URL hình ảnh (tùy chọn)
- **Loại*** (type): 
  - `challenge`: Thành tích liên quan đến thử thách
  - `streak`: Thành tích liên quan đến chuỗi hoạt động
  - `points`: Thành tích liên quan đến điểm số
  - `special`: Thành tích đặc biệt
- **Điều kiện*** (condition):
  - `type`: Loại điều kiện (VD: complete_challenges, streak_days, total_points)
  - `value`: Giá trị ngưỡng để đạt thành tích
- **Điểm thưởng*** (points): Số điểm người dùng nhận được
- **Tên Badge*** (badge): Tên unique của badge để tracking
- **Trạng thái** (isActive): Kích hoạt ngay hay không

**Validation:**
- Tất cả trường bắt buộc phải được điền đầy đủ
- Tên thành tích phải unique
- Giá trị điều kiện phải > 0
- Điểm không được âm

**API Endpoint:**
```
POST /api/achievements
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "name": "Người mới bắt đầu",
  "description": "Hoàn thành 5 thử thách đầu tiên",
  "icon": "🌟",
  "type": "challenge",
  "condition": {
    "type": "complete_challenges",
    "value": 5
  },
  "points": 50,
  "badge": "beginner_5",
  "isActive": true
}
```

### 2. READ - Xem danh sách và chi tiết

**Danh sách thành tựu với các tính năng:**

**Phân trang:**
- Mặc định: 10 items/trang
- Có thể thay đổi số lượng hiển thị
- Navigation với nút Previous/Next
- Hiển thị thông tin: Trang hiện tại / Tổng số trang (Tổng số thành tích)

**Tìm kiếm:**
- Tìm kiếm theo tên thành tích
- Tìm kiếm theo mô tả
- Tìm kiếm theo tên badge
- Tìm kiếm real-time

**Lọc:**
- Lọc theo loại (Type): All, Challenge, Streak, Points, Special
- Lọc theo trạng thái (Status): All, Active, Inactive
- Có thể kết hợp nhiều bộ lọc

**Sắp xếp:**
- Theo ngày tạo (Created Date) - mặc định
- Theo tên (Name)
- Theo điểm (Points)
- Chiều tăng dần/giảm dần

**Hiển thị thông tin trong bảng:**
- Icon
- Tên và mô tả
- Loại (Type badge)
- Điểm thưởng
- Số người dùng đã đạt được
- Trạng thái (Active/Inactive/Deleted)
- Các nút hành động (View/Edit/Delete/Restore)

**API Endpoint:**
```
GET /api/achievements?page=1&limit=10&search=beginner&type=challenge&isActive=true&sortBy=createdAt&sortOrder=desc
Authorization: Bearer {token} (optional)
```

**Chi tiết thành tựu:**
- Xem đầy đủ thông tin
- Thống kê số người dùng đã đạt được
- Thông tin người tạo/cập nhật
- Ngày tạo/cập nhật

**API Endpoint:**
```
GET /api/achievements/{id}
```

### 3. UPDATE - Cập nhật thành tựu

**Các trường có thể cập nhật:**
- Tất cả các trường giống như khi tạo mới
- Không thể thay đổi: createdAt, createdBy, isDeleted, deletedAt, deletedBy

**Validation:**
- Giống như khi tạo mới
- Tên phải unique (trừ tên hiện tại)

**API Endpoint:**
```
PATCH /api/achievements/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

Body: {các trường cần cập nhật}
```

### 4. DELETE - Xóa thành tựu

**Soft Delete (Mặc định):**
- Thành tích không bị xóa vĩnh viễn
- Được đánh dấu `isDeleted = true`
- Tự động deactivate (`isActive = false`)
- Lưu thông tin: deletedAt, deletedBy
- Có thể khôi phục sau này
- Dữ liệu lịch sử được giữ nguyên

**Hard Delete (Không khả dụng qua UI):**
- Xóa vĩnh viễn khỏi database
- Chỉ có thể thực hiện qua API với query param `?hard=true`
- Không thể khôi phục

**API Endpoints:**
```
# Soft Delete
DELETE /api/achievements/{id}
Authorization: Bearer {admin_token}

# Hard Delete (cẩn thận!)
DELETE /api/achievements/{id}?hard=true
Authorization: Bearer {admin_token}
```

**Restore (Khôi phục):**
- Chỉ áp dụng cho thành tích đã soft delete
- Khôi phục trạng thái trước khi xóa
- Xóa các thông tin: isDeleted, deletedAt, deletedBy

**API Endpoint:**
```
PATCH /api/achievements/{id}/restore
Authorization: Bearer {admin_token}
```

### 5. Thống kê (Statistics)

**Tổng quan hệ thống:**
- Tổng số thành tích
- Số thành tích đang hoạt động
- Số thành tích không hoạt động
- Số thành tích đã xóa
- Phân loại theo type
- Top 10 thành tích được đạt nhiều nhất

**API Endpoint:**
```
GET /api/achievements/stats/overview
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 50,
      "active": 45,
      "inactive": 5,
      "deleted": 3
    },
    "byType": {
      "challenge": 20,
      "streak": 10,
      "points": 15,
      "special": 5
    },
    "topEarned": [
      {
        "_id": "...",
        "name": "Người mới bắt đầu",
        "usersEarnedCount": 1250
      }
    ]
  }
}
```

## Phân quyền (Authorization)

**Yêu cầu:**
- Chỉ admin mới có quyền truy cập module này
- Token phải hợp lệ và chưa hết hạn
- Email phải khớp với ADMIN_EMAIL trong .env

**Middleware kiểm tra:**
1. `authenticateToken`: Xác thực JWT token
2. `isAdmin`: Kiểm tra quyền admin

**Cách kiểm tra admin:**
```typescript
// Trong auth.middleware.ts
req.user.role = user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
```

## Thông báo (Toast Notifications)

**Thành công:**
- ✅ Tạo thành tích thành công
- ✅ Cập nhật thành tích thành công
- ✅ Xóa thành tích thành công
- ✅ Khôi phục thành tích thành công

**Lỗi:**
- ❌ Không thể tải danh sách thành tích
- ❌ Không thể tạo thành tích (+ lý do)
- ❌ Không thể cập nhật thành tích (+ lý do)
- ❌ Không thể xóa thành tích (+ lý do)
- ❌ Validation errors (hiển thị trực tiếp trên form)

## Giao diện người dùng (UI/UX)

**Responsive Design:**
- Desktop: Hiển thị đầy đủ với bảng và sidebar
- Tablet: Điều chỉnh grid layout
- Mobile: Stack layout, optimized cho touch

**Accessibility:**
- Keyboard navigation support
- ARIA labels
- Focus indicators
- Color contrast theo WCAG standards

**Loading States:**
- Spinner khi đang tải dữ liệu
- Skeleton loaders cho table rows
- Disable buttons khi đang xử lý

**Empty States:**
- Thông báo "Không có thành tích nào" khi danh sách rỗng
- Hướng dẫn tạo thành tích đầu tiên

## Best Practices

### Bảo mật
1. ✅ Luôn validate dữ liệu ở cả client và server
2. ✅ Sử dụng prepared statements để tránh injection
3. ✅ Kiểm tra authorization cho mọi action
4. ✅ Sanitize user input
5. ✅ Rate limiting cho API endpoints

### Performance
1. ✅ Phân trang để tránh load quá nhiều dữ liệu
2. ✅ Index database fields thường xuyên query
3. ✅ Cache thống kê nếu cần
4. ✅ Lazy loading cho images
5. ✅ Debounce search input

### Data Integrity
1. ✅ Soft delete thay vì hard delete
2. ✅ Tracking audit fields (createdBy, updatedBy)
3. ✅ Validate unique constraints
4. ✅ Transaction support cho critical operations

## Troubleshooting

**Lỗi 401 Unauthorized:**
- Kiểm tra token có hợp lệ không
- Kiểm tra token đã expire chưa
- Đảm bảo email là admin email

**Lỗi 403 Forbidden:**
- User không có quyền admin
- Kiểm tra ADMIN_EMAIL trong .env

**Lỗi 400 Bad Request:**
- Kiểm tra validation errors
- Đảm bảo tất cả required fields được gửi
- Kiểm tra format dữ liệu

**Lỗi 500 Internal Server Error:**
- Kiểm tra logs server
- Kiểm tra kết nối database
- Kiểm tra schema model

## API Reference đầy đủ

### GET /api/achievements
Lấy danh sách thành tích với phân trang, tìm kiếm, lọc

**Query Parameters:**
- `page` (number, default: 1): Trang hiện tại
- `limit` (number, default: 10, max: 100): Số items mỗi trang
- `search` (string): Từ khóa tìm kiếm
- `type` (string): Lọc theo loại
- `isActive` (boolean): Lọc theo trạng thái
- `sortBy` (string): Trường để sắp xếp
- `sortOrder` ('asc'|'desc'): Chiều sắp xếp
- `includeDeleted` (boolean, default: false): Hiển thị cả deleted items (admin only)

### GET /api/achievements/:id
Lấy chi tiết một thành tích

**URL Parameters:**
- `id` (string): Achievement ID

### POST /api/achievements
Tạo thành tích mới (Admin only)

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:** (xem phần CREATE)

### PATCH /api/achievements/:id
Cập nhật thành tích (Admin only)

**URL Parameters:**
- `id` (string): Achievement ID

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:** Các trường cần cập nhật

### DELETE /api/achievements/:id
Xóa thành tích (Admin only)

**URL Parameters:**
- `id` (string): Achievement ID

**Query Parameters:**
- `hard` (boolean, default: false): Hard delete hay soft delete

**Headers:**
- `Authorization: Bearer {token}`

### PATCH /api/achievements/:id/restore
Khôi phục thành tích đã xóa (Admin only)

**URL Parameters:**
- `id` (string): Achievement ID

**Headers:**
- `Authorization: Bearer {token}`

### GET /api/achievements/stats/overview
Lấy thống kê tổng quan (Admin only)

**Headers:**
- `Authorization: Bearer {token}`

### GET /api/achievements/user/:userId
Lấy thành tích của một user cụ thể

**URL Parameters:**
- `userId` (string): User ID

**Headers:**
- `Authorization: Bearer {token}`

### POST /api/achievements/award
Trao thành tích cho user (Admin only)

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "userId": "user_id_here",
  "achievementId": "achievement_id_here"
}
```

## Testing

**Manual Testing Checklist:**
- [ ] Tạo thành tích mới với dữ liệu hợp lệ
- [ ] Tạo thành tích với dữ liệu không hợp lệ (kiểm tra validation)
- [ ] Xem danh sách với phân trang
- [ ] Tìm kiếm thành tích
- [ ] Lọc theo type và status
- [ ] Sắp xếp theo các trường khác nhau
- [ ] Xem chi tiết thành tích
- [ ] Cập nhật thành tích
- [ ] Soft delete thành tích
- [ ] Khôi phục thành tích đã xóa
- [ ] Kiểm tra permissions (non-admin không được truy cập)
- [ ] Kiểm tra responsive trên mobile
- [ ] Kiểm tra toast notifications

## Kết luận

Module quản lý thành tựu đã được thiết kế và triển khai đầy đủ với tất cả các tính năng CRUD cần thiết, tuân thủ best practices về bảo mật, performance và UX. Module sẵn sàng để sử dụng trong môi trường production sau khi testing kỹ lưỡng.

Để truy cập: Đăng nhập với tài khoản admin → Admin Dashboard → Achievement Management