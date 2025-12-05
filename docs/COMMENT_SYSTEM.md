# Hệ thống Bình luận (Comment System)

## Tổng quan
Đã hoàn thành chức năng bình luận đầy đủ cho các bài tập, bao gồm:
- Bình luận vào bất kỳ bài tập nào
- Xem avatar, tên, thời gian và nội dung bình luận
- Chỉnh sửa và xóa bình luận của mình
- **Like/Dislike bình luận** ✨ NEW
- Báo cáo (report/tố cáo) bình luận vi phạm
- **Admin dashboard quản lý comments** ✨ NEW

## Files đã tạo/chỉnh sửa

### Backend
1. **`server/src/models/comment.model.ts`** - Model cho Comment
   - Schema: user, challenge, content, **likes[], dislikes[]**, reports[], isHidden, timestamps
   - Index cho hiệu suất tìm kiếm

2. **`server/src/controllers/comment.controller.ts`** - Controllers xử lý logic người dùng
   - `createComment()` - Tạo bình luận mới
   - `getCommentsByChallenge()` - Lấy tất cả bình luận của 1 bài tập
   - **`likeComment()`** - Like/Unlike bình luận ✨ NEW
   - **`dislikeComment()`** - Dislike/Undislike bình luận ✨ NEW
   - `reportComment()` - Báo cáo bình luận
   - `updateComment()` - Chỉnh sửa bình luận (chỉ người tạo)
   - `deleteComment()` - Xóa bình luận (người tạo hoặc admin)

3. **`server/src/controllers/adminComment.controller.ts`** - Controllers cho Admin ✨ NEW
   - `getReportedComments()` - Lấy danh sách comments bị báo cáo
   - `getAllComments()` - Lấy tất cả comments (có thể filter theo challenge)
   - `toggleHideComment()` - Ẩn/hiện comment
   - `adminDeleteComment()` - Xóa comment
   - `getCommentStats()` - Thống kê comments

4. **`server/src/routes/comment.routes.ts`** - API routes cho người dùng
   - `GET /api/comments/challenge/:challengeId` - Public, lấy comments
   - `POST /api/comments` - Protected, tạo comment
   - **`POST /api/comments/:commentId/like`** - Protected, like ✨ NEW
   - **`POST /api/comments/:commentId/dislike`** - Protected, dislike ✨ NEW
   - `POST /api/comments/:commentId/report` - Protected, report
   - `PATCH /api/comments/:commentId` - Protected, edit
   - `DELETE /api/comments/:commentId` - Protected, delete

5. **`server/src/routes/adminComment.routes.ts`** - API routes cho Admin ✨ NEW
   - `GET /api/admin/comments/reported` - Lấy comments bị báo cáo
   - `GET /api/admin/comments` - Lấy tất cả comments (filter by challenge)
   - `GET /api/admin/comments/stats` - Thống kê
   - `PATCH /api/admin/comments/:commentId/hide` - Ẩn/hiện
   - `DELETE /api/admin/comments/:commentId` - Xóa

6. **`server/src/app.ts`** - Đã thêm routes
   - Mount `/api/comments` cho user routes
   - Mount `/api/admin/comments` cho admin routes ✨ NEW

### Frontend - User Interface
1. **`client/src/components/practice/CommentSection.tsx`** - UI Component cho người dùng
   - Form nhập bình luận với textarea
   - Danh sách comments với avatar, tên, thời gian
   - **Nút Like/Dislike với số đếm** ✨ NEW
   - Nút Edit/Delete cho comment của mình
   - Nút Report cho comment của người khác
   - Modal báo cáo với form nhập lý do
   - Loading states và error handling

2. **`client/src/components/practice/ProblemDetail.tsx`** - Integration
   - Import CommentSection
   - Thay thế placeholder ở tab "Bình luận" bằng CommentSection

### Frontend - Admin Interface ✨ NEW
3. **`client/src/components/admin/CommentReportManagement.tsx`** - Quản lý comments bị báo cáo
   - Hiển thị danh sách comments có reports
   - Thông tin người bị báo cáo (username, email, avatar)
   - Thông tin người báo cáo với lý do chi tiết
   - Modal xem chi tiết tất cả reports của 1 comment
   - Nút Ẩn/Hiện comment
   - Nút Xóa comment
   - Pagination

4. **`client/src/components/admin/AllCommentsManagement.tsx`** - Quản lý tất cả comments
   - Hiển thị tất cả comments từ mọi bài tập
   - Filter theo bài tập cụ thể
   - Sort theo: mới nhất, cũ nhất, nhiều báo cáo, nhiều like
   - Hiển thị thông tin challenge (title, difficulty, language)
   - Hiển thị like/dislike count
   - Nút Ẩn/Hiện và Xóa
   - Pagination

5. **`client/src/components/admin/AdminDashboard.tsx`** - Integration
   - Thêm 2 tabs mới:
     - "Bình luận bị báo cáo" (comment-reports)
     - "Tất cả bình luận" (all-comments)

## Tính năng chi tiết

### 1. Tạo bình luận
- Textarea với giới hạn 5000 ký tự
- Hiển thị số ký tự đã nhập
- Nút "Gửi bình luận" với loading state
- Yêu cầu đăng nhập

### 2. Hiển thị bình luận
- Avatar tròn (hoặc icon User nếu không có)
- Tên người dùng in đậm
- Thời gian relative (vừa xong, X phút trước, X giờ trước, X ngày trước)
- Nhãn "(đã chỉnh sửa)" nếu comment được edit
- Nội dung với line breaks preserved
- **Số like và dislike với nút tương tác** ✨ NEW
- Số lượng report nếu có (với icon cảnh báo)

### 3. Like/Dislike bình luận ✨ NEW
- Nút Like với icon ThumbsUp và số đếm
- Nút Dislike với icon ThumbsDown và số đếm
- Toggle: Click lại để unlike/undislike
- Exclusive: Like sẽ remove dislike và ngược lại
- Highlight màu khi đã like (blue) hoặc dislike (red)
- Fill icon khi active
- Yêu cầu đăng nhập
- Real-time update số đếm

### 4. Chỉnh sửa bình luận
- Chỉ người tạo mới thấy nút Edit
- Click Edit → hiện textarea inline
- Nút "Lưu" và "Hủy"
- Cập nhật real-time sau khi save

### 5. Xóa bình luận
- Chỉ người tạo mới thấy nút Delete
- Confirm dialog trước khi xóa
- Xóa khỏi danh sách ngay lập tức

### 6. Báo cáo bình luận
- Chỉ người dùng khác (không phải người tạo) mới thấy nút Report
- Click Report → mở modal
- Textarea nhập lý do (tối đa 500 ký tự)
- Hiển thị số ký tự đã nhập
- Nút "Gửi báo cáo"
- Thông báo thành công sau khi gửi
- Auto-hide comment nếu có >= 3 reports

### 7. Admin - Quản lý Comments bị báo cáo ✨ NEW
- **Hiển thị thông tin đầy đủ:**
  - Thông tin người bị báo cáo: username, email, avatar
  - Nội dung bình luận
  - Tổng số báo cáo
  - Thông tin bài tập (title, difficulty, language)
  - Like/Dislike count
  - Thời gian tạo

- **Chi tiết báo cáo:**
  - Modal hiển thị tất cả người báo cáo
  - Mỗi report có: username, email, lý do, thời gian
  
- **Hành động:**
  - Ẩn/Hiện comment (toggle)
  - Xóa comment vĩnh viễn
  - Pagination

### 8. Admin - Quản lý tất cả Comments ✨ NEW
- **Bộ lọc mạnh mẽ:**
  - Filter theo bài tập cụ thể (dropdown)
  - Sort theo: mới nhất, cũ nhất, nhiều báo cáo, nhiều like
  
- **Hiển thị thông tin:**
  - User info (username, email, avatar)
  - Challenge info (title, difficulty, language)
  - Content
  - Like/Dislike count
  - Report count (nếu có)
  - Trạng thái "Đã ẩn" (badge)
  
- **Hành động:**
  - Ẩn/Hiện comment
  - Xóa comment
  - Pagination

### 9. Phân quyền
- **Guest (chưa đăng nhập)**: Chỉ xem comments, không like/dislike
- **User đã đăng nhập**: Tạo, edit/delete comment của mình, like/dislike, report comment của người khác
- **Admin/Moderator**: Xem tất cả reports, ẩn/hiện/xóa bất kỳ comment nào, xem thống kê

## API Endpoints

### User Endpoints

#### GET /api/comments/challenge/:challengeId
Query params:
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (newest | oldest)

Response:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "...",
        "user": {...},
        "challenge": "...",
        "content": "...",
        "likeCount": 5,
        "dislikeCount": 1,
        "reportCount": 0,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {...}
  }
}
```

#### POST /api/comments
Body:
```json
{
  "challengeId": "...",
  "content": "..."
}
```

#### POST /api/comments/:commentId/like ✨ NEW
Response:
```json
{
  "success": true,
  "data": {
    "likeCount": 6,
    "dislikeCount": 1,
    "isLiked": true
  }
}
```

#### POST /api/comments/:commentId/dislike ✨ NEW
Response:
```json
{
  "success": true,
  "data": {
    "likeCount": 5,
    "dislikeCount": 2,
    "isDisliked": true
  }
}
```

#### POST /api/comments/:commentId/report
Body:
```json
{
  "reason": "Spam, ngôn từ không phù hợp..."
}
```

#### PATCH /api/comments/:commentId
Body:
```json
{
  "content": "..."
}
```

#### DELETE /api/comments/:commentId
No body required.

### Admin Endpoints ✨ NEW

#### GET /api/admin/comments/reported
Query params:
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (reports | newest | oldest)

Response:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "...",
        "user": {
          "_id": "...",
          "username": "john_doe",
          "email": "john@example.com",
          "avatar": "..."
        },
        "challenge": {
          "_id": "...",
          "title": "Fix Array Bug",
          "difficulty": "Easy",
          "language": "JavaScript"
        },
        "content": "...",
        "reportCount": 3,
        "reports": [
          {
            "user": {
              "_id": "...",
              "username": "reporter1",
              "email": "reporter1@example.com"
            },
            "reason": "Spam content",
            "reportedAt": "2024-01-15T10:30:00Z"
          }
        ],
        "likeCount": 2,
        "dislikeCount": 8,
        "isHidden": false
      }
    ],
    "pagination": {...}
  }
}
```

#### GET /api/admin/comments
Query params:
- `page` (default: 1)
- `limit` (default: 50)
- `challengeId` (optional)
- `sort` (newest | oldest | reports | likes)

Response:
```json
{
  "success": true,
  "data": {
    "comments": [...],
    "challenges": [
      {
        "_id": "...",
        "title": "Fix Array Bug",
        "difficulty": "Easy",
        "language": "JavaScript"
      }
    ],
    "pagination": {...}
  }
}
```

#### GET /api/admin/comments/stats
Response:
```json
{
  "success": true,
  "data": {
    "total": 1234,
    "reported": 45,
    "hidden": 12,
    "recentWeek": 89,
    "topChallenges": [...]
  }
}
```

#### PATCH /api/admin/comments/:commentId/hide
Body:
```json
{
  "isHidden": true,
  "reason": "Vi phạm quy định"
}
```

#### DELETE /api/admin/comments/:commentId
No body required.

## Security & Validation

### Backend
- Validation: content 1-5000 ký tự, reason 1-500 ký tự
- Authorization: JWT token required
- Permission checks: chỉ owner hoặc admin mới delete/edit
- Admin-only routes: require isAdmin middleware
- Rate limiting: có thể thêm rate limit cho create comment và like/dislike
- Auto-hide: comment bị ẩn tự động sau 3 reports
- Like/Dislike exclusive: không thể vừa like vừa dislike

### Frontend
- XSS protection: không render raw HTML
- Input sanitization: trim whitespace
- Character limits: UI hiển thị số ký tự
- Auth checks: kiểm tra token trước khi gọi API
- Role checks: chỉ admin mới thấy admin routes
- Optimistic UI: update local state trước khi API response

## Testing Guide

1. **Khởi động server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Khởi động client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test flow người dùng:**
   - Truy cập http://localhost:5173/challenges
   - Click vào 1 bài tập
   - Chuyển sang tab "Bình luận"
   - Thử tạo comment (cần đăng nhập)
   - Thử like/dislike comments ✨
   - Thử edit/delete comment của mình
   - Thử report comment của người khác

4. **Test flow admin:** ✨
   - Đăng nhập với tài khoản admin
   - Truy cập http://localhost:5173/admin/dashboard
   - Click tab "Bình luận bị báo cáo"
     - Xem danh sách comments có reports
     - Click "Xem chi tiết báo cáo" để xem tất cả người báo cáo
     - Thử ẩn/hiện comment
     - Thử xóa comment
   - Click tab "Tất cả bình luận"
     - Filter theo bài tập
     - Thử các tùy chọn sort
     - Xem thông tin đầy đủ của comments
     - Thử ẩn/hiện và xóa

## Database Schema

```typescript
interface IComment {
  user: ObjectId;              // Ref to User
  challenge: ObjectId;         // Ref to Challenge
  content: string;             // 1-5000 characters
  likes: ObjectId[];           // Array of User IDs who liked ✨
  dislikes: ObjectId[];        // Array of User IDs who disliked ✨
  reports: [{
    user: ObjectId;            // User who reported
    reason: string;            // Report reason
    reportedAt: Date;
  }];
  isHidden: boolean;           // Admin can hide
  createdAt: Date;
  updatedAt: Date;
}
```

## Known Issues

1. **Build Error:** File `simplePvp.controller.ts` có lỗi TypeScript không liên quan đến comment feature. Cần fix để build thành công.

2. **Real-time updates:** Hiện tại comments không cập nhật real-time cho users khác. Cần reload page hoặc chuyển tab để thấy comments mới/updated.

## Future Enhancements

1. **Real-time updates** với WebSocket
2. **Reply to comments** (nested comments / threaded discussions)
3. **Reactions** (emoji reactions: 😂😍😢😡)
4. **Rich text editor** cho comments (markdown support)
5. **Image upload** trong comments
6. **Mention users** với @username autocomplete
7. **Admin dashboard improvements:**
   - Bulk actions (hide/delete multiple)
   - Advanced filters (by user, date range, etc.)
   - Export reports to CSV
   - Analytics dashboard
8. **Email notifications:**
   - Notify user when their comment gets reported
   - Notify when comment is hidden by admin
   - Notify when someone replies to your comment
9. **Comment search** (full-text search)
10. **Comment history** (view edit history)

## Conclusion

Chức năng bình luận đã được implement đầy đủ với tất cả tính năng yêu cầu:
✅ Bất kỳ người dùng nào cũng có thể bình luận
✅ Hiển thị avatar, tên, thời gian, nội dung
✅ **Like/Dislike bình luận** ✨ NEW
✅ Chức năng Report/Tố cáo vi phạm
✅ Edit và Delete cho comment của mình
✅ **Admin dashboard quản lý comments bị báo cáo** ✨ NEW
  - Xem thông tin người bị báo cáo
  - Xem thông tin người báo cáo
  - Xem lý do báo cáo chi tiết
✅ **Admin dashboard quản lý tất cả comments** ✨ NEW
  - Filter theo bài tập
  - Sort theo nhiều tiêu chí
  - Ẩn/hiện và xóa comments
✅ UI đẹp, responsive và user-friendly
✅ Performance tối ưu với pagination
✅ Security đầy đủ với authentication và authorization
